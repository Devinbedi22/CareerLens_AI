"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { generateText } from "@/lib/genai";

const DAILY_LIMIT = 10;

const TEMPLATE_PLACEHOLDER_PATTERN = /\[[^\]]+\]/g;

function formatGeneratedCoverLetter(content, { name, email, currentDate }) {
  const cleanedContent = content
    .replace(TEMPLATE_PLACEHOLDER_PATTERN, "")
    .replace(/^\s*[-|,;:]?\s*$/gm, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const salutationMatch = cleanedContent.match(/^Dear .+$/im);
  if (!salutationMatch) return cleanedContent;

  const salutationIndex = salutationMatch.index;
  let header = cleanedContent.slice(0, salutationIndex);
  const body = cleanedContent.slice(salutationIndex).trim();

  [name, email, currentDate].filter(Boolean).forEach((value) => {
    header = header.replaceAll(value, `\n${value}\n`);
  });

  header = header
    .replace(/\s*\|\s*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return `${header}\n\n${body}`.trim();
}

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

  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const prompt = `
Create the FINAL, ready-to-use professional cover letter for a ${data.jobTitle} position at ${data.companyName}.

About the candidate:
${user.name ? `- Name: ${user.name}` : ""}
${user.email ? `- Email: ${user.email}` : ""}
${user.industry ? `- Industry: ${user.industry}` : ''}
${user.experience ? `- Years of Experience: ${user.experience}` : ''}
${user.skills?.length ? `- Skills: ${user.skills.join(", ")}` : ''}
${user.bio ? `- Professional Background: ${user.bio}` : ''}

Job Description:
${data.jobDescription}

Current date: ${currentDate}

Requirements:
1. Professional and enthusiastic tone
2. Highlight relevant skills and experience
3. Show understanding of the company's needs
4. 350-400 words
5. Proper business letter formatting in markdown
6. Include specific achievements
7. Align candidate's background with role requirements
8. Format the opening vertically: each available candidate contact item on its own line, then a blank line, then ${currentDate}, then a blank line, then the hiring recipient, company name, and company location on separate lines when known.
9. Use the actual candidate values supplied above. Omit unavailable address, phone, location, or other fields.
10. Never output placeholders, templates, bracketed instructions, or example text. Forbidden examples include [Your Name], [Your Address], [Your Phone Number], [Your Email Address], [Date], [City, State, Zip Code], [Company Address], and [Hiring Manager].
11. Do not invent personal contact information or company details.
12. The response must be only the finished cover letter, not instructions to the user.

Return ONLY the final cover letter in markdown format. No explanations or template text.
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
      const generatedContent = await generateText(prompt, "gemini-2.5-flash");

      if (!generatedContent) {
        throw new Error("Empty response from AI");
      }

      const content = formatGeneratedCoverLetter(generatedContent, {
        name: user.name,
        email: user.email,
        currentDate,
      });

      if (!content) {
        throw new Error("AI returned only template placeholders");
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