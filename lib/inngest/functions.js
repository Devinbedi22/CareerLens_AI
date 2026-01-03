import { db } from "@/lib/prisma";
import { inngest } from "./client";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const CACHE_DURATION_DAYS = 7;
const DELAY_BETWEEN_INDUSTRIES_MS = 2000; // 2 seconds
const MAX_RETRIES = 2;

function validateInsights(insights, industry) {
  if (!insights || typeof insights !== 'object') {
    throw new Error(`Invalid insights object for ${industry}`);
  }

  const required = [
    'salaryRanges', 'growthRate', 'demandLevel', 
    'topSkills', 'marketOutlook', 'keyTrends', 'recommendedSkills'
  ];

  for (const field of required) {
    if (!(field in insights)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  if (!Array.isArray(insights.salaryRanges) || insights.salaryRanges.length < 3) {
    throw new Error('salaryRanges must be an array with at least 3 items');
  }

  if (!Array.isArray(insights.topSkills) || insights.topSkills.length < 5) {
    throw new Error('topSkills must be an array with at least 5 items');
  }

  if (!['HIGH', 'MEDIUM', 'LOW'].includes(insights.demandLevel)) {
    throw new Error('demandLevel must be HIGH, MEDIUM, or LOW');
  }

  if (!['POSITIVE', 'NEUTRAL', 'NEGATIVE'].includes(insights.marketOutlook)) {
    throw new Error('marketOutlook must be POSITIVE, NEUTRAL, or NEGATIVE');
  }

  return true;
}

async function generateWithRetry(prompt, industry) {
  let lastError;
  
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (!text || text.trim().length === 0) {
        throw new Error("Empty response from AI");
      }

      const cleanedText = text
        .replace(/```(?:json)?\n?/g, "")
        .replace(/```/g, "")
        .trim();

      const parsed = JSON.parse(cleanedText);
      
      // Validate the response
      validateInsights(parsed, industry);
      
      return parsed;
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${attempt + 1}/${MAX_RETRIES + 1} failed for ${industry}:`, error.message);
      
      if (attempt < MAX_RETRIES) {
        // Exponential backoff: 2s, 4s
        await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
      }
    }
  }
  
  throw new Error(`Failed after ${MAX_RETRIES + 1} attempts: ${lastError.message}`);
}

function createPrompt(industry) {
  const currentYear = new Date().getFullYear();
  
  return `
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
2. Include at least 5 salary ranges for different roles in ${industry}
3. Include exactly 5 items each for topSkills, keyTrends, and recommendedSkills
4. growthRate must be a number (percentage, e.g., 15.5 for 15.5%)
5. demandLevel must be exactly one of: "HIGH", "MEDIUM", "LOW"
6. marketOutlook must be exactly one of: "POSITIVE", "NEUTRAL", "NEGATIVE"
7. All salaries must be realistic numbers in USD
8. Base all data on current ${currentYear} market conditions
9. Ensure role names are realistic job titles in the ${industry} industry
`;
}

export const generateIndustryInsights = inngest.createFunction(
  { 
    id: "generate-industry-insights",
    name: "Generate Industry Insights",
    retries: 0, // Don't retry the entire job, we handle retries per industry
  },
  { cron: "0 0 * * 0" }, // Every Sunday at midnight
  async ({ step }) => {
    const stats = {
      total: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      startTime: new Date(),
      failures: [],
    };

    // Fetch unique industries
    const industries = await step.run("Fetch unique industries", async () => {
      const results = await db.industryInsight.findMany({
        distinct: ['industry'],
        select: { industry: true },
        where: {
          industry: { not: null },
        },
      });
      
      stats.total = results.length;
      console.log(`Found ${stats.total} unique industries to update`);
      
      return results;
    });

    if (industries.length === 0) {
      console.log("No industries found to update");
      return { ...stats, message: "No industries to update" };
    }

    // Process each industry
    for (let i = 0; i < industries.length; i++) {
      const { industry } = industries[i];
      
      if (!industry || industry.trim().length === 0) {
        console.warn(`Skipping invalid industry at index ${i}`);
        stats.skipped++;
        continue;
      }

      try {
        // Generate insights
        const insights = await step.run(
          `Generate insights for ${industry}`,
          async () => {
            const prompt = createPrompt(industry);
            return await generateWithRetry(prompt, industry);
          }
        );

        // Update database
        await step.run(`Update ${industry} in database`, async () => {
          await db.industryInsight.upsert({
            where: { industry },
            update: {
              salaryRanges: insights.salaryRanges,
              growthRate: insights.growthRate,
              demandLevel: insights.demandLevel,
              topSkills: insights.topSkills,
              marketOutlook: insights.marketOutlook,
              keyTrends: insights.keyTrends,
              recommendedSkills: insights.recommendedSkills,
              lastUpdated: new Date(),
              nextUpdate: new Date(Date.now() + CACHE_DURATION_DAYS * 24 * 60 * 60 * 1000),
            },
            create: {
              industry,
              salaryRanges: insights.salaryRanges,
              growthRate: insights.growthRate,
              demandLevel: insights.demandLevel,
              topSkills: insights.topSkills,
              marketOutlook: insights.marketOutlook,
              keyTrends: insights.keyTrends,
              recommendedSkills: insights.recommendedSkills,
              lastUpdated: new Date(),
              nextUpdate: new Date(Date.now() + CACHE_DURATION_DAYS * 24 * 60 * 60 * 1000),
            },
          });
        });

        stats.successful++;
        console.log(`✅ Successfully updated ${industry} (${stats.successful}/${stats.total})`);

      } catch (error) {
        stats.failed++;
        stats.failures.push({
          industry,
          error: error.message,
          timestamp: new Date(),
        });
        console.error(`❌ Failed to update ${industry}:`, error.message);
        // Continue to next industry instead of crashing
      }

      // Rate limiting: wait between industries (except for the last one)
      if (i < industries.length - 1) {
        await step.sleep("Rate limit delay", DELAY_BETWEEN_INDUSTRIES_MS);
      }
    }

    // Calculate final stats
    stats.endTime = new Date();
    stats.durationMs = stats.endTime - stats.startTime;
    stats.durationMinutes = Math.round(stats.durationMs / 1000 / 60);

    console.log('========================================');
    console.log('Industry Insights Cron Job Completed');
    console.log('========================================');
    console.log(`Total industries: ${stats.total}`);
    console.log(`Successful: ${stats.successful}`);
    console.log(`Failed: ${stats.failed}`);
    console.log(`Skipped: ${stats.skipped}`);
    console.log(`Duration: ${stats.durationMinutes} minutes`);
    
    if (stats.failures.length > 0) {
      console.log('\nFailures:');
      stats.failures.forEach(f => {
        console.log(`  - ${f.industry}: ${f.error}`);
      });
    }
    
    console.log('========================================');

    return stats;
  }
);

// Optional: Add a manual trigger function for testing
export const manualGenerateIndustryInsights = inngest.createFunction(
  { 
    id: "manual-generate-industry-insights",
    name: "Manual Generate Industry Insights (Test)",
  },
  { event: "industry/insights.generate" },
  async ({ event, step }) => {
    const { industry } = event.data;
    
    if (!industry) {
      throw new Error("Industry name is required");
    }

    const insights = await step.run("Generate insights", async () => {
      const prompt = createPrompt(industry);
      return await generateWithRetry(prompt, industry);
    });

    await step.run("Update database", async () => {
      await db.industryInsight.upsert({
        where: { industry },
        update: {
          ...insights,
          lastUpdated: new Date(),
          nextUpdate: new Date(Date.now() + CACHE_DURATION_DAYS * 24 * 60 * 60 * 1000),
        },
        create: {
          industry,
          ...insights,
          lastUpdated: new Date(),
          nextUpdate: new Date(Date.now() + CACHE_DURATION_DAYS * 24 * 60 * 60 * 1000),
        },
      });
    });

    return { industry, success: true, insights };
  }
);