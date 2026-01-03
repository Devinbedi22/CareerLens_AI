"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { generateAIInsights } from "./dashboard";

// Helper function to normalize skills
function normalizeSkills(skills) {
  if (!skills) return [];
  
  // If it's already an array, return it
  if (Array.isArray(skills)) {
    return skills.map((s) => s.trim()).filter(Boolean);
  }
  
  // If it's a string, split and trim
  if (typeof skills === "string") {
    return skills.split(",").map((s) => s.trim()).filter(Boolean);
  }
  
  return [];
}

export async function updateUser(data) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    // Normalize skills before using them
    const normalizedSkills = normalizeSkills(data.skills);

    // ✅ 0. Ensure IndustryInsight exists BEFORE creating/updating user
    const existingInsight = await db.industryInsight.findUnique({
      where: { industry: data.industry },
    });

    if (!existingInsight) {
      // Create a basic IndustryInsight record first
      await db.industryInsight.create({
        data: {
          industry: data.industry,
          salaryRanges: [],
          growthRate: 0,
          demandLevel: "MEDIUM",
          topSkills: [],
          marketOutlook: "NEUTRAL",
          keyTrends: [],
          recommendedSkills: [],
          nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      // ✅ Try to generate AI insights in background (NON-BLOCKING)
      try {
        const insights = await generateAIInsights(data.industry);
        
        // Update the insight with AI-generated data
        await db.industryInsight.update({
          where: { industry: data.industry },
          data: insights,
        });
      } catch (aiError) {
        // 🚨 AI FAILURE IS ALLOWED - we already have basic insight created
        console.error("AI insight generation failed (non-blocking):", aiError);
      }
    }

    // ✅ 1. Now upsert user (industry foreign key will be satisfied)
    const user = await db.user.upsert({
      where: { clerkUserId: userId },
      update: {
        industry: data.industry,
        experience: Number(data.experience),
        bio: data.bio,
        skills: normalizedSkills,
      },
      create: {
        clerkUserId: userId,
        email: data.email, // REQUIRED from frontend
        name: data.name ?? null,
        industry: data.industry,
        experience: Number(data.experience),
        bio: data.bio,
        skills: normalizedSkills,
      },
    });

    revalidatePath("/dashboard");
    return user;
  } catch (error) {
    console.error("Error updating user:", error);
    throw new Error("Failed to update profile");
  }
}

export async function getUserOnboardingStatus() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: { industry: true },
  });

  return {
    isOnboarded: !!user?.industry,
  };
}