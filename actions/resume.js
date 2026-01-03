"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MAX_RESUME_LENGTH = 50000; // ~10-15 pages
const HOURLY_AI_LIMIT = 20;

async function getAuthenticatedUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");
  return user;
}

async function callGeminiWithRetry(prompt, maxRetries = 2) {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();

      if (!text) {
        throw new Error("Empty response from AI");
      }

      return text;
    } catch (error) {
      lastError = error;
      console.error(`Gemini API attempt ${attempt + 1} failed:`, error.message);
      
      if (attempt < maxRetries) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }
  
  throw new Error(`AI service unavailable after ${maxRetries + 1} attempts: ${lastError.message}`);
}

function getPromptForType(type, current, industry) {
  const baseRules = `
Rules:
- Use strong action verbs (led, developed, implemented, achieved, optimized)
- Quantify results when possible (increased by X%, reduced time by Y hours)
- Highlight technical skills and tools relevant to ${industry}
- Be concise and impactful - no fluff or generic statements
- Focus on achievements and outcomes, not just responsibilities
- Use industry-standard terminology for ${industry}
- Ensure ATS-friendly formatting
`;

  const prompts = {
    summary: `
As an expert resume writer, improve this professional summary for a ${industry} professional.

Current content:
"${current}"

${baseRules}
- Max 3-4 sentences
- Start with your title and years of experience
- Highlight 2-3 key strengths or specializations
- End with career goal or unique value proposition

Return ONLY the improved summary. No markdown. No explanations.
`,
    experience: `
As an expert resume writer, improve this work experience description for a ${industry} professional.

Current content:
"${current}"

${baseRules}
- Start each point with a strong action verb
- Include 3-5 bullet points
- Quantify achievements (numbers, percentages, timeframes, dollar amounts)
- Show impact and results, not just tasks performed
- Mention specific technologies, methodologies, or tools used

Return ONLY the improved experience description. No markdown. No explanations.
`,
    skill: `
As an expert resume writer, improve this skills section for a ${industry} professional.

Current content:
"${current}"

${baseRules}
- Group related skills together (e.g., Programming Languages, Frameworks, Tools)
- List most relevant and advanced skills first
- Include proficiency levels if appropriate (Expert, Advanced, Intermediate)
- Mention certifications or special training
- Be specific (not just "programming" but "Python, JavaScript, React, Node.js")

Return ONLY the improved skills description. No markdown. No explanations.
`,
    project: `
As an expert resume writer, improve this project description for a ${industry} professional.

Current content:
"${current}"

${baseRules}
- Briefly describe what the project does (1 sentence)
- Highlight your specific role and key contributions
- Mention technologies/tools used
- Quantify impact or results (users, performance, efficiency gains)
- Keep it to 2-3 sentences total

Return ONLY the improved project description. No markdown. No explanations.
`,
    education: `
As an expert resume writer, improve this education description for a ${industry} professional.

Current content:
"${current}"

${baseRules}
- Mention degree, major, and institution
- Include GPA if 3.5 or higher
- List relevant coursework, honors, or awards
- Mention significant academic projects or research
- Keep it concise (2-3 sentences max)

Return ONLY the improved education description. No markdown. No explanations.
`,
  };

  return prompts[type.toLowerCase()] || prompts.summary;
}

export async function saveResume(content) {
  if (!content || typeof content !== 'string') {
    throw new Error("Invalid resume content");
  }

  const trimmedContent = content.trim();

  if (trimmedContent.length === 0) {
    throw new Error("Resume content cannot be empty");
  }

  if (trimmedContent.length > MAX_RESUME_LENGTH) {
    throw new Error(`Resume is too long (max ${MAX_RESUME_LENGTH} characters)`);
  }

  const user = await getAuthenticatedUser();

  try {
    const resume = await db.resume.upsert({
      where: { userId: user.id },
      update: { 
        content: trimmedContent,
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        content: trimmedContent,
      },
    });

    revalidatePath("/resume");
    return resume;
  } catch (error) {
    console.error("Error saving resume:", error);
    throw new Error(`Failed to save resume: ${error.message}`);
  }
}

export async function getResume() {
  const user = await getAuthenticatedUser();

  return db.resume.findUnique({
    where: { userId: user.id },
  });
}

export async function improveWithAI({ current, type }) {
  // Validate input
  if (!current || typeof current !== 'string' || current.trim().length === 0) {
    throw new Error("Current content is required and cannot be empty");
  }

  if (current.length > 5000) {
    throw new Error("Content is too long (max 5000 characters per section)");
  }

  if (!type || typeof type !== 'string') {
    throw new Error("Content type is required");
  }

  const validTypes = ['summary', 'experience', 'skill', 'project', 'education'];
  const normalizedType = type.toLowerCase();
  
  if (!validTypes.includes(normalizedType)) {
    throw new Error(`Invalid type. Must be one of: ${validTypes.join(', ')}`);
  }

  const user = await getAuthenticatedUser();

  if (!user.industry) {
    throw new Error("Please set your industry in your profile before using AI improvements");
  }

  // Check rate limit
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const recentImprovements = await db.resume.findMany({
    where: {
      userId: user.id,
      updatedAt: { gte: oneHourAgo }
    },
  });

  if (recentImprovements.length >= HOURLY_AI_LIMIT) {
    throw new Error(`Rate limit reached (${HOURLY_AI_LIMIT} improvements per hour). Please try again later.`);
  }

  const prompt = getPromptForType(normalizedType, current, user.industry);

  try {
    const improvedText = await callGeminiWithRetry(prompt);

    // Basic validation of improved text
    if (improvedText.length < 10) {
      throw new Error("AI returned suspiciously short content");
    }

    return improvedText;
  } catch (error) {
    console.error("Error improving resume:", error);
    throw new Error(`Failed to improve resume: ${error.message}`);
  }
}

export async function analyzeResume() {
  const user = await getAuthenticatedUser();

  if (!user.industry) {
    throw new Error("Please set your industry in your profile before analyzing your resume");
  }

  const resume = await db.resume.findUnique({
    where: { userId: user.id },
  });

  if (!resume || !resume.content || resume.content.trim().length === 0) {
    throw new Error("No resume found to analyze. Please create a resume first.");
  }

  const prompt = `
Analyze this resume for a ${user.industry} professional and provide detailed feedback.

Resume content:
${resume.content.slice(0, 10000)} ${resume.content.length > 10000 ? '... (truncated)' : ''}

Provide a JSON response with:
{
  "score": number (0-100, overall resume quality),
  "strengths": ["strength1", "strength2", "strength3"],
  "improvements": ["improvement1", "improvement2", "improvement3"],
  "missingKeywords": ["keyword1", "keyword2", "keyword3"],
  "atsCompatibility": number (0-100, how well it will perform with ATS systems)
}

Focus on:
- ATS compatibility and formatting
- Keyword optimization for ${user.industry}
- Presence of quantifiable achievements
- Action verb usage
- Overall structure and clarity
- Industry-specific terminology
- Balance between technical skills and soft skills

Return ONLY valid JSON. No markdown. No code blocks. No explanations.
`;

  try {
    const text = await callGeminiWithRetry(prompt);
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim();
    const analysis = JSON.parse(cleanedText);

    // Validate response structure
    if (typeof analysis.score !== 'number' || 
        !Array.isArray(analysis.strengths) ||
        !Array.isArray(analysis.improvements)) {
      throw new Error("Invalid analysis format from AI");
    }

    return analysis;
  } catch (error) {
    console.error("Error analyzing resume:", error);
    
    if (error instanceof SyntaxError) {
      throw new Error("Failed to parse AI analysis response");
    }
    
    throw new Error(`Failed to analyze resume: ${error.message}`);
  }
}

export async function deleteResume() {
  const user = await getAuthenticatedUser();

  try {
    await db.resume.delete({
      where: { userId: user.id },
    });

    revalidatePath("/resume");
    return { success: true };
  } catch (error) {
    // If resume doesn't exist, that's okay
    if (error.code === 'P2025') {
      return { success: true, message: "Resume already deleted" };
    }
    
    console.error("Error deleting resume:", error);
    throw new Error(`Failed to delete resume: ${error.message}`);
  }
}