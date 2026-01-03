"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const DAILY_QUIZ_LIMIT = 5;

async function getAuthenticatedUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");
  return user;
}

function validateQuizResponse(quiz) {
  if (!quiz || !Array.isArray(quiz.questions)) {
    throw new Error("Invalid quiz format: missing questions array");
  }

  if (quiz.questions.length !== 10) {
    throw new Error(`Invalid quiz format: expected 10 questions, got ${quiz.questions.length}`);
  }

  for (const [index, q] of quiz.questions.entries()) {
    if (!q.question || typeof q.question !== 'string') {
      throw new Error(`Question ${index + 1}: missing or invalid question text`);
    }
    
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      throw new Error(`Question ${index + 1}: must have exactly 4 options`);
    }
    
    if (!q.correctAnswer || !q.options.includes(q.correctAnswer)) {
      throw new Error(`Question ${index + 1}: correctAnswer must be one of the options`);
    }
    
    if (!q.explanation || typeof q.explanation !== 'string') {
      throw new Error(`Question ${index + 1}: missing or invalid explanation`);
    }
  }

  return true;
}

export async function generateQuiz() {
  const user = await getAuthenticatedUser();

  // Check rate limit
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayQuizCount = await db.assessment.count({
    where: {
      userId: user.id,
      createdAt: { gte: today }
    }
  });

  if (todayQuizCount >= DAILY_QUIZ_LIMIT) {
    throw new Error(`Daily quiz limit reached (${DAILY_QUIZ_LIMIT} per day). Try again tomorrow.`);
  }

  if (!user.industry) {
    throw new Error("Please set your industry in your profile before generating quizzes");
  }

  const prompt = `
Generate 10 challenging technical interview questions for a ${user.industry} professional${
    user.skills?.length ? ` with expertise in ${user.skills.join(", ")}` : ""
  }.

Requirements:
- 10 questions total
- Each question must be multiple choice with exactly 4 options
- Questions should be practical and relevant to real-world scenarios
- Mix of difficulty levels (3 easy, 4 medium, 3 hard)
- Cover different aspects of ${user.industry}
${user.skills?.length ? `- Focus on skills: ${user.skills.join(", ")}` : ""}

Return ONLY valid JSON in this EXACT format (no markdown, no code blocks):

{
  "questions": [
    {
      "question": "What is the primary purpose of...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option B",
      "explanation": "Option B is correct because..."
    }
  ]
}

CRITICAL RULES:
1. Return ONLY valid JSON - no markdown, no explanations outside JSON
2. Exactly 10 questions
3. Each question must have exactly 4 unique options
4. correctAnswer must EXACTLY match one of the options (same capitalization, spacing, etc.)
5. Explanations should be 1-2 sentences
6. Questions should be clear and unambiguous
7. Make questions challenging but fair
`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text?.trim()) {
      throw new Error("Empty response from AI");
    }

    // Clean JSON
    const cleanedText = text
      .replace(/```(?:json)?\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    
    const quiz = JSON.parse(cleanedText);

    // Validate structure
    validateQuizResponse(quiz);

    return quiz.questions;
  } catch (error) {
    console.error("Error generating quiz:", error);
    
    if (error instanceof SyntaxError) {
      throw new Error("Failed to parse AI response as valid JSON");
    }
    
    throw new Error(`Failed to generate quiz questions: ${error.message}`);
  }
}

export async function saveQuizResult(questions, answers, score) {
  // Validate inputs
  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    throw new Error("Invalid questions array");
  }
  
  if (!answers || !Array.isArray(answers)) {
    throw new Error("Invalid answers array");
  }
  
  if (typeof score !== 'number' || score < 0 || score > 100) {
    throw new Error("Invalid score: must be between 0 and 100");
  }
  
  if (questions.length !== answers.length) {
    throw new Error("Questions and answers length mismatch");
  }

  const user = await getAuthenticatedUser();

  const questionResults = questions.map((q, index) => ({
    question: q.question,
    answer: q.correctAnswer,
    userAnswer: answers[index] || "Not answered",
    isCorrect: q.correctAnswer === answers[index],
    explanation: q.explanation,
  }));

  const wrongAnswers = questionResults.filter((q) => !q.isCorrect);

  let improvementTip = null;

  if (wrongAnswers.length > 0) {
    // Limit to top 3 wrong answers to avoid token limits
    const wrongQuestionsText = wrongAnswers
      .slice(0, 3)
      .map(
        (q) =>
          `Question: "${q.question}"
Correct Answer: "${q.answer}"
User Answer: "${q.userAnswer}"`
      )
      .join("\n\n");

    const improvementPrompt = `
The user is a ${user.industry} professional and got ${wrongAnswers.length} out of 10 technical interview questions wrong.

Here are examples of questions they got wrong:

${wrongQuestionsText}

Provide ONE concise improvement tip (maximum 2 sentences):
- Focus on what specific skills or concepts to learn next
- Be encouraging and actionable
- Reference the specific topics they struggled with
- Don't just say "practice more" - be specific
`;

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const tipResult = await model.generateContent(improvementPrompt);
      const tipResponse = await tipResult.response;
      improvementTip = tipResponse.text().trim();
    } catch (err) {
      console.error("Error generating improvement tip:", err);
      improvementTip = "Keep practicing! Review the explanations for questions you missed and focus on those topics.";
    }
  } else {
    improvementTip = "Perfect score! You've demonstrated excellent knowledge. Keep it up!";
  }

  try {
    return await db.assessment.create({
      data: {
        userId: user.id,
        quizScore: score,
        questions: questionResults,
        category: "Technical",
        improvementTip,
      },
    });
  } catch (error) {
    console.error("Error saving quiz result:", error);
    throw new Error(`Failed to save quiz result: ${error.message}`);
  }
}

export async function getAssessments() {
  const user = await getAuthenticatedUser();

  return db.assessment.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" }, // ✅ Changed to desc for most recent first
    select: {
      id: true,
      quizScore: true,
      category: true,
      improvementTip: true,
      createdAt: true,
      // Exclude questions array for list view to reduce data transfer
    },
  });
}

export async function getAssessmentById(id) {
  if (!id) throw new Error("Assessment ID is required");
  
  const user = await getAuthenticatedUser();

  const assessment = await db.assessment.findUnique({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!assessment) throw new Error("Assessment not found");
  
  return assessment;
}

export async function deleteAssessment(id) {
  if (!id) throw new Error("Assessment ID is required");
  
  const user = await getAuthenticatedUser();

  return db.assessment.delete({
    where: {
      id,
      userId: user.id,
    },
  });
}

export async function getQuizStats() {
  const user = await getAuthenticatedUser();

  const assessments = await db.assessment.findMany({
    where: { userId: user.id },
    select: {
      quizScore: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (assessments.length === 0) {
    return {
      totalQuizzes: 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      recentScores: [],
    };
  }

  const scores = assessments.map(a => a.quizScore);
  
  return {
    totalQuizzes: assessments.length,
    averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    highestScore: Math.max(...scores),
    lowestScore: Math.min(...scores),
    recentScores: assessments.slice(0, 5).map(a => ({
      score: a.quizScore,
      date: a.createdAt,
    })),
  };
}