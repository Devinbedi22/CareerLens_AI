"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const DAILY_LIMIT = 10;

async function getAuthenticatedUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");
  return user;
}

export async function generateCoverLetter(data) {
  // Validate input
  if (!data?.jobTitle || !data?.companyName || !data?.jobDescription) {
    throw new Error("Missing required fields: jobTitle, companyName, and jobDescription");
  }

  const user = await getAuthenticatedUser();

  // Check rate limit
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCount = await db.coverLetter.count({
    where: {
      userId: user.id,
      createdAt: { gte: today }
    }
  });

  if (todayCount >= DAILY_LIMIT) {
    throw new Error(`Daily limit of ${DAILY_LIMIT} cover letters reached. Try again tomorrow.`);
  }

  const prompt = `
Write a professional cover letter for a ${data.jobTitle} position at ${data.companyName}.

About the candidate:
${user.industry ? `- Industry: ${user.industry}` : ''}
${user.experience ? `- Years of Experience: ${user.experience}` : ''}
${user.skills?.length ? `- Skills: ${user.skills.join(", ")}` : ''}
${user.bio ? `- Professional Background: ${user.bio}` : ''}

Job Description:
${data.jobDescription}

Requirements:
1. Professional and enthusiastic tone
2. Highlight relevant skills and experience
3. Show understanding of the company's needs
4. 350-400 words
5. Proper business letter formatting in markdown
6. Include specific achievements
7. Align candidate's background with role requirements

Return ONLY the cover letter in markdown format. No explanations.
`;

  // Create placeholder
  const coverLetter = await db.coverLetter.create({
    data: {
      content: "",
      jobDescription: data.jobDescription,
      companyName: data.companyName,
      jobTitle: data.jobTitle,
      status: "pending",
      userId: user.id,
    },
  });

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text().trim();

    if (!content) {
      throw new Error("Empty response from AI");
    }

    // Update with generated content
    return await db.coverLetter.update({
      where: { id: coverLetter.id },
      data: {
        content,
        status: "completed",
      },
    });
  } catch (error) {
    console.error("Error generating cover letter:", error);
    
    // Mark as failed
    await db.coverLetter.update({
      where: { id: coverLetter.id },
      data: { status: "failed" },
    });
    
    throw new Error(`Failed to generate cover letter: ${error.message}`);
  }
}

export async function getCoverLetters() {
  const user = await getAuthenticatedUser();
  
  return db.coverLetter.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCoverLetter(id) {
  if (!id) throw new Error("Cover letter ID is required");
  
  const user = await getAuthenticatedUser();

  const coverLetter = await db.coverLetter.findUnique({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!coverLetter) throw new Error("Cover letter not found");
  
  return coverLetter;
}

export async function deleteCoverLetter(id) {
  if (!id) throw new Error("Cover letter ID is required");
  
  const user = await getAuthenticatedUser();

  return db.coverLetter.delete({
    where: {
      id,
      userId: user.id,
    },
  });
}