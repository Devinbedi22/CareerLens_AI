"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
    const text = response.text();

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

  // Generate fresh insights
  const insights = await generateAIInsights(user.industry);

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