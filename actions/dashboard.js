"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getRoleRecommendations } from "@/lib/recommendation-engine";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const CACHE_DURATION_DAYS = 7;

async function getAuthenticatedUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: { industryInsight: true },
  });

  if (!user) throw new Error("User not found");
  return user;
}

function validateInsightsResponse(data) {
  const requiredFields = [
    'salaryRanges',
    'growthRate',
    'demandLevel',
    'topSkills',
    'marketOutlook',
    'keyTrends',
    'recommendedSkills'
  ];

  for (const field of requiredFields) {
    if (!(field in data)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  if (!Array.isArray(data.salaryRanges) || data.salaryRanges.length < 3) {
    throw new Error("Invalid salaryRanges: must be array with at least 3 items");
  }

  if (!Array.isArray(data.topSkills) || data.topSkills.length < 5) {
    throw new Error("Invalid topSkills: must be array with at least 5 items");
  }

  if (!['HIGH', 'MEDIUM', 'LOW'].includes(data.demandLevel)) {
    throw new Error("Invalid demandLevel: must be HIGH, MEDIUM, or LOW");
  }

  if (!['POSITIVE', 'NEUTRAL', 'NEGATIVE'].includes(data.marketOutlook)) {
    throw new Error("Invalid marketOutlook: must be POSITIVE, NEUTRAL, or NEGATIVE");
  }

  return true;
}

async function callGeminiWithRetry(prompt, maxRetries = 2) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = await response.text();

      if (!text?.trim()) {
        throw new Error("Empty response from AI");
      }

      return text.trim();
    } catch (error) {
      lastError = error;
      // Log detailed server-side error for observability
      console.error(`Gemini API attempt ${attempt + 1} failed:`, {
        message: error?.message,
        stack: error?.stack,
        attempt: attempt + 1,
      });

      // Exponential backoff delays: 1s, 2s, 4s ...
      if (attempt < maxRetries) {
        const delayMs = 1000 * Math.pow(2, attempt); // 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw new Error(`AI service unavailable after ${maxRetries + 1} attempts: ${lastError?.message || 'unknown error'}`);
}

function validateRoleExplanations(data) {
  if (!data || typeof data !== 'object' || !Array.isArray(data.recommendations)) {
    throw new Error("Invalid role explanation format from AI");
  }

  return data.recommendations.every((item) =>
    item?.title && typeof item.title === 'string' && item?.explanation && typeof item.explanation === 'string'
  );
}

async function getJobRecommendationExplanations({ recommendations, resumeText, skills, profile }) {
  const prompt = `
You are a career coach. For each of the recommended roles below, explain why it was recommended, what skills are missing, and how the user can improve their suitability.

User resume content:
${resumeText.slice(0, 12000)}${resumeText.length > 12000 ? " ... (truncated)" : ""}

User skills: ${Array.isArray(skills) ? skills.join(", ") : skills}
User profile: ${profile || "N/A"}

Recommended roles:
${recommendations.map((role) => `- ${role.title}`).join("\n")}

Return ONLY valid JSON in this exact format:
{
  "recommendations": [
    {
      "title": "Role Title",
      "explanation": "..."
    }
  ]
}
`;

  const text = await callGeminiWithRetry(prompt);
  const cleanedText = text.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim();
  const parsed = JSON.parse(cleanedText);

  if (!validateRoleExplanations(parsed)) {
    throw new Error("Invalid role explanations from AI");
  }

  return parsed.recommendations.reduce((map, item) => {
    map[item.title] = item.explanation;
    return map;
  }, {});
}

export async function getJobRecommendations() {
  const user = await getAuthenticatedUser();
  const resume = await db.resume.findUnique({ where: { userId: user.id } });

  const recommendations = getRoleRecommendations({
    resumeContent: resume?.content ?? "",
    skills: user.skills ?? [],
    experience: user.experience ?? 0,
    profile: user.bio ?? "",
  });

  if (!recommendations.length) {
    return { recommendedRoles: [] };
  }

  const explanations = await getJobRecommendationExplanations({
    recommendations,
    resumeText: resume?.content ?? "",
    skills: user.skills ?? [],
    profile: user.bio ?? "",
  });

  return {
    recommendedRoles: recommendations.map((role) => ({
      ...role,
      explanation: explanations[role.title] ?? "",
    })),
  };
}

export async function generateAIInsights(industry) {
  if (!industry?.trim()) {
    throw new Error("Industry is required to generate insights");
  }

  const currentYear = new Date().getFullYear();
  
  const prompt = `
Analyze the current state of the ${industry} industry as of ${currentYear}.

Return a JSON object with this EXACT structure:
{
  "salaryRanges": [
    {
      "role": "Senior Software Engineer",
      "min": 120000,
      "max": 180000,
      "median": 150000,
      "location": "United States"
    }
  ],
  "growthRate": 15.5,
  "demandLevel": "HIGH",
  "topSkills": ["Python", "JavaScript", "React", "Node.js", "AWS"],
  "marketOutlook": "POSITIVE",
  "keyTrends": ["AI Integration", "Remote Work", "Cloud Migration", "Cybersecurity Focus", "Green Tech"],
  "recommendedSkills": ["Machine Learning", "Cloud Computing", "DevOps", "Data Analysis", "Agile"]
}

CRITICAL RULES:
1. Return ONLY valid JSON - no markdown, no code blocks, no explanations
2. Include at least 5 salary ranges for different roles in the ${industry} industry
3. Include exactly 5 items each for topSkills, keyTrends, and recommendedSkills
4. growthRate must be a number (percentage, e.g., 15.5 for 15.5%)
5. demandLevel must be exactly one of: "HIGH", "MEDIUM", "LOW"
6. marketOutlook must be exactly one of: "POSITIVE", "NEUTRAL", "NEGATIVE"
7. All salaries must be realistic numbers in USD
8. Base all data on current ${currentYear} market conditions
9. Ensure role names are realistic job titles in the ${industry} industry
`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();

    // Clean and parse JSON
    const cleanedText = text
      .replace(/```(?:json)?\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    
    const parsed = JSON.parse(cleanedText);
    
    // Validate structure
    validateInsightsResponse(parsed);
    
    return parsed;
  } catch (error) {
    console.error("Error generating AI insights:", error);
    
    if (error instanceof SyntaxError) {
      throw new Error("Failed to parse AI response as valid JSON");
    }
    
    throw new Error(`Failed to generate industry insights: ${error.message}`);
  }
}

function shouldRefreshInsights(insight) {
  if (!insight) return true;
  return new Date() > new Date(insight.nextUpdate);
}

function getNextUpdateDate() {
  return new Date(Date.now() + CACHE_DURATION_DAYS * 24 * 60 * 60 * 1000);
}

export async function getIndustryInsights() {
  const user = await getAuthenticatedUser();

  if (!user.industry?.trim()) {
    throw new Error("User industry not set. Please update your profile.");
  }

  // Return cached insights if still valid
  if (user.industryInsight && !shouldRefreshInsights(user.industryInsight)) {
    return user.industryInsight;
  }

  // Generate fresh insights (with internal error handling so UI won't crash)
  let insights;
  try {
    insights = await generateAIInsights(user.industry);
  } catch (error) {
    // Log server-side and return null so the page can render without AI insights
    console.error("AI insights generation failed for user", user.id, error);
    return null;
  }

  // Update existing or create new
  if (user.industryInsight) {
    return await db.industryInsight.update({
      where: { id: user.industryInsight.id },
      data: {
        salaryRanges: insights.salaryRanges,
        growthRate: insights.growthRate,
        demandLevel: insights.demandLevel,
        topSkills: insights.topSkills,
        marketOutlook: insights.marketOutlook,
        keyTrends: insights.keyTrends,
        recommendedSkills: insights.recommendedSkills,
        nextUpdate: getNextUpdateDate(),
      },
    });
  }

  return await db.industryInsight.create({
    data: {
      industry: user.industry,
      userId: user.id,
      salaryRanges: insights.salaryRanges,
      growthRate: insights.growthRate,
      demandLevel: insights.demandLevel,
      topSkills: insights.topSkills,
      marketOutlook: insights.marketOutlook,
      keyTrends: insights.keyTrends,
      recommendedSkills: insights.recommendedSkills,
      nextUpdate: getNextUpdateDate(),
    },
  });
}

export async function refreshIndustryInsights() {
  const user = await getAuthenticatedUser();

  if (!user.industry?.trim()) {
    throw new Error("User industry not set. Please update your profile.");
  }

  const insights = await generateAIInsights(user.industry);

  if (user.industryInsight) {
    return await db.industryInsight.update({
      where: { id: user.industryInsight.id },
      data: {
        salaryRanges: insights.salaryRanges,
        growthRate: insights.growthRate,
        demandLevel: insights.demandLevel,
        topSkills: insights.topSkills,
        marketOutlook: insights.marketOutlook,
        keyTrends: insights.keyTrends,
        recommendedSkills: insights.recommendedSkills,
        nextUpdate: getNextUpdateDate(),
      },
    });
  }

  return await db.industryInsight.create({
    data: {
      industry: user.industry,
      userId: user.id,
      salaryRanges: insights.salaryRanges,
      growthRate: insights.growthRate,
      demandLevel: insights.demandLevel,
      topSkills: insights.topSkills,
      marketOutlook: insights.marketOutlook,
      keyTrends: insights.keyTrends,
      recommendedSkills: insights.recommendedSkills,
      nextUpdate: getNextUpdateDate(),
    },
  });
}