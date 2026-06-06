"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  buildPersonalizationContext,
  buildInterviewerSystemPrompt,
  getProfileById,
  validateVoiceSessionResponse,
  parseGeminiEvaluation
} from "@/lib/voice-interview-utils";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Get authenticated user
 */
async function getAuthenticatedUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: { resume: true }
  });

  if (!user) throw new Error("User not found");
  return user;
}

/**
 * Call Gemini with retry logic and exponential backoff
 */
async function callGeminiWithRetry(prompt, maxRetries = 3) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = await response.text();

      if (!text?.trim()) {
        throw new Error("Empty response from Gemini");
      }

      return text.trim();
    } catch (error) {
      lastError = error;
      console.error(`Gemini API attempt ${attempt + 1} failed:`, {
        message: error?.message,
        attempt: attempt + 1
      });

      if (attempt < maxRetries) {
        const delayMs = 1000 * Math.pow(2, attempt); // 1s, 2s, 4s, 8s
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw new Error(`Gemini API failed after ${maxRetries + 1} attempts: ${lastError?.message}`);
}

/**
 * Initialize a voice interview session
 * Returns the initial question and system setup
 */
export async function initializeVoiceInterview(companyId, difficulty, duration) {
  const user = await getAuthenticatedUser();

  // Validate inputs
  if (!companyId) throw new Error("Company ID is required");
  if (!["Easy", "Medium", "Hard", "Expert"].includes(difficulty)) {
    throw new Error("Invalid difficulty level");
  }
  if (![15, 30, 45, 60].includes(duration)) {
    throw new Error("Invalid interview duration");
  }

  // Get company profile
  const profile = getProfileById(companyId);
  if (!profile) throw new Error("Company profile not found");

  // Build personalization context
  const personalizationContext = await buildPersonalizationContext(user, db, difficulty);

  // The first question MUST always be the mandatory introduction opener.
  // Per product rules the interview MUST begin with this question.
  const initialQuestion = "Tell me about yourself.";

  return {
    success: true,
    initialQuestion: initialQuestion,
    profile,
    difficulty,
    duration,
    personalizationContext
  };
}

/**
 * Process user response and generate next question
 * This is the main loop of the interview
 */
export async function processVoiceResponse(
  companyId,
  userTranscript,
  conversationHistory,
  difficulty,
  currentPhase = "INTRODUCTION"
) {
  const user = await getAuthenticatedUser();

  if (!userTranscript?.trim()) {
    throw new Error("User transcript is required");
  }

  if (!Array.isArray(conversationHistory)) {
    throw new Error("Conversation history must be an array");
  }

  // Get profile
  const profile = getProfileById(companyId);
  if (!profile) throw new Error("Company profile not found");

  // Build personalization context
  const personalizationContext = await buildPersonalizationContext(user, db, difficulty);

  // Add user response to history for context
  const updatedHistory = [
    ...conversationHistory,
    {
      role: "user",
      text: userTranscript
    }
  ];

  // Build the prompt for next question generation
  const systemPrompt = buildInterviewerSystemPrompt(
    profile,
    difficulty,
    personalizationContext,
    updatedHistory,
    currentPhase
  );

  try {
    const response = await callGeminiWithRetry(systemPrompt);

    // Parse the response
    const cleaned = response
      .replace(/```(?:json)?\n?/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    if (!validateVoiceSessionResponse(parsed)) {
      throw new Error("Invalid response format from Gemini");
    }

    return {
      success: true,
      nextQuestion: parsed.nextQuestion,
      isFollowUp: parsed.isFollowUp,
      reasoning: parsed.reasoning
    };
  } catch (error) {
    console.error("Failed to process voice response:", error);
    
    if (error instanceof SyntaxError) {
      throw new Error("Failed to parse AI response");
    }

    throw error;
  }
}

/**
 * Generate final evaluation after interview ends
 */
export async function generateFinalEvaluation(
  companyId,
  conversationHistory,
  difficulty
) {
  const user = await getAuthenticatedUser();

  if (!Array.isArray(conversationHistory) || conversationHistory.length === 0) {
    throw new Error("Conversation history is required");
  }

  const profile = getProfileById(companyId);
  if (!profile) throw new Error("Company profile not found");

  const personalizationContext = await buildPersonalizationContext(user, db, difficulty);

  // Build evaluation prompt
  const evaluationPrompt = `
You are evaluating a ${profile.name} interview for a ${difficulty} level position.

INTERVIEW FOCUS AREAS: ${profile.focusAreas.join(", ")}
TECHNICAL WEIGHT: ${profile.technicalWeight}%
BEHAVIORAL WEIGHT: ${profile.behavioralWeight}%

FULL CONVERSATION:
${conversationHistory.map(m => `${m.role.toUpperCase()}: ${m.text}`).join("\n\n")}

---

Evaluate the candidate on:
1. Technical Knowledge (0-100): Based on ${profile.focusAreas.join(", ")}
2. Communication (0-100): How clearly they explained their thinking
3. Problem Solving (0-100): Approach to challenges and trade-off analysis
4. Confidence (0-100): Conviction in their answers
5. Overall Score (0-100): Weighted by technical ${profile.technicalWeight}% and behavioral ${profile.behavioralWeight}%

Identify:
- Top 3-4 strengths shown during the interview
- Top 3-4 weaknesses or gaps
- 3-4 specific improvement suggestions

Be fair but rigorous. This is a professional evaluation.

Return ONLY this JSON:
{
  "overallScore": 0-100,
  "technicalKnowledge": 0-100,
  "communication": 0-100,
  "problemSolving": 0-100,
  "confidence": 0-100,
  "strengths": ["...", "...", "..."],
  "weaknesses": ["...", "...", "..."],
  "improvementSuggestions": ["...", "...", "..."]
}
`;

  try {
    const response = await callGeminiWithRetry(evaluationPrompt);
    const evaluation = parseGeminiEvaluation(response);

    return {
      success: true,
      evaluation
    };
  } catch (error) {
    console.error("Failed to generate final evaluation:", error);
    throw error;
  }
}

/**
 * Save the completed interview session to the database
 */
export async function saveVoiceInterviewSession(
  companyId,
  difficulty,
  conversationHistory,
  evaluation
) {
  const user = await getAuthenticatedUser();

  if (!companyId) throw new Error("Company ID is required");
  if (!evaluation) throw new Error("Evaluation is required");

  const profile = getProfileById(companyId);
  if (!profile) throw new Error("Company profile not found");

  try {
    // Create assessment record
    const assessment = await db.assessment.create({
      data: {
        userId: user.id,
        category: `Voice Interview - ${profile.name} (${difficulty})`,
        quizScore: evaluation.evaluation.overallScore,
        questions: conversationHistory, // Store full conversation in JSON
        improvementTip: `Technical: ${evaluation.evaluation.technicalKnowledge}% | Communication: ${evaluation.evaluation.communication}% | Problem Solving: ${evaluation.evaluation.problemSolving}%`
      }
    });

    return {
      success: true,
      assessmentId: assessment.id,
      message: "Interview session saved successfully"
    };
  } catch (error) {
    console.error("Failed to save voice interview session:", error);
    throw error;
  }
}

/**
 * Get personalized interview context (for client use)
 */
export async function getInterviewContext(companyId) {
  const user = await getAuthenticatedUser();

  const profile = getProfileById(companyId);
  if (!profile) throw new Error("Company profile not found");

  try {
    const personalizationContext = await buildPersonalizationContext(user, db, "Medium");

    return {
      success: true,
      profile,
      personalizationContext
    };
  } catch (error) {
    console.error("Failed to get interview context:", error);
    throw error;
  }
}
