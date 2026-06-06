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

function normalizeInterviewCategory(category) {
  const normalized = String(category).trim().toLowerCase();
  if (normalized === "technical") return "Technical";
  if (normalized === "behavioral") return "Behavioral";
  if (normalized === "project") return "Project";
  if (normalized === "resume") return "Resume";
  return "Technical";
}

function calculateAverage(scores) {
  if (!scores.length) return 0;
  return Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length);
}

function validateInterviewEvaluation(evaluation) {
  if (
    typeof evaluation.score !== "number" ||
    evaluation.score < 0 ||
    evaluation.score > 100 ||
    !Array.isArray(evaluation.strengths) ||
    !Array.isArray(evaluation.weaknesses) ||
    !Array.isArray(evaluation.improvements)
  ) {
    throw new Error("Invalid interview evaluation format from AI");
  }
  return true;
}

function validateMockInterviewQuestions(questions) {
  if (!Array.isArray(questions)) {
    throw new Error("Invalid mock interview questions format: expected an array");
  }

  if (questions.length < 5 || questions.length > 10) {
    throw new Error(`Mock interview must contain between 5 and 10 questions, got ${questions.length}`);
  }

  questions.forEach((question, index) => {
    if (!question || typeof question.question !== "string" || !question.question.trim()) {
      throw new Error(`Question ${index + 1} is missing text`);
    }

    if (!question.category || typeof question.category !== "string") {
      throw new Error(`Question ${index + 1} is missing a category`);
    }

    const category = normalizeInterviewCategory(question.category);
    if (!["Technical", "Behavioral", "Project", "Resume"].includes(category)) {
      throw new Error(`Question ${index + 1} has an invalid category: ${question.category}`);
    }

    question.category = category;
  });

  return true;
}

function buildInterviewContext(user) {
  const parts = [];
  if (user.industry) parts.push(`Industry: ${user.industry}`);
  if (user.experience != null) parts.push(`Years of experience: ${user.experience}`);
  if (user.skills?.length) parts.push(`Skills: ${user.skills.join(", ")}`);
  if (user.resume?.content) {
    parts.push(`Resume content:\n${user.resume.content.slice(0, 12000)}`);
  }
  return parts.join("\n\n");
}

async function getAuthenticatedUserWithResume() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: { resume: true },
  });

  if (!user) throw new Error("User not found");
  return user;
}

export async function generateMockInterview() {
  const user = await getAuthenticatedUserWithResume();

  const prompt = `You are an expert interview coach for a ${user.industry ?? "professional"}.
Use the user's profile, resume, skills, and experience to create a personalized mock interview.

User context:
${buildInterviewContext(user)}

Create 7 interview questions that cover the following areas:
- Technical concepts
- Projects
- Resume-based experience
- Behavioral scenarios

Return ONLY valid JSON in this exact format, with no markdown and no explanatory text:
{
  "questions": [
    {
      "question": "...",
      "category": "Technical|Behavioral|Project|Resume"
    }
  ]
}

Rules:
1. Return exactly 7 questions.
2. Each question must have one of the categories: Technical, Behavioral, Project, Resume.
3. Questions must feel like a real interview session.
4. Do not include answers, options, or follow-up text.
5. Keep question text clear and concise.
`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = (await response.text()).trim();

    if (!text) {
      throw new Error("Empty response from AI");
    }

    const cleaned = text.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (!parsed.questions) {
      throw new Error("AI response did not contain questions");
    }

    validateMockInterviewQuestions(parsed.questions);
    return parsed.questions;
  } catch (error) {
    console.error("Error generating mock interview questions:", error);
    if (error instanceof SyntaxError) {
      throw new Error("Failed to parse AI response as valid JSON");
    }
    throw new Error(`Failed to generate mock interview questions: ${error.message}`);
  }
}

export async function evaluateMockInterviewAnswer(question, answer) {
  if (!question || typeof question.question !== "string") {
    throw new Error("Invalid question for evaluation");
  }

  if (!answer || typeof answer !== "string" || !answer.trim()) {
    throw new Error("Answer text is required for evaluation");
  }

  const user = await getAuthenticatedUserWithResume();

  const prompt = `You are an expert interview evaluator for a ${user.industry ?? "professional"}.

User context:
${buildInterviewContext(user)}

Interview question:
${question.question}

Question category: ${question.category}

Candidate answer:
${answer.trim()}

Evaluate the answer and return ONLY valid JSON in this exact format, with no markdown or commentary:
{
  "score": 0,
  "strengths": [],
  "weaknesses": [],
  "improvements": []
}

Use a score between 0 and 100. Keep strengths, weaknesses, and improvements concise.
`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = (await response.text()).trim();

    if (!text) {
      throw new Error("Empty response from AI");
    }

    const cleaned = text.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim();
    const evaluation = JSON.parse(cleaned);

    validateInterviewEvaluation(evaluation);
    return evaluation;
  } catch (error) {
    console.error("Error evaluating interview answer:", error);
    if (error instanceof SyntaxError) {
      throw new Error("Failed to parse AI evaluation response as valid JSON");
    }
    throw new Error(`Failed to evaluate interview answer: ${error.message}`);
  }
}

function createMockInterviewReport(responses) {
  const overallScore = calculateAverage(responses.map((item) => item.evaluation.score));

  const technical = [];
  const communication = [];
  const problemSolving = [];

  const weaknesses = [];
  const improvements = [];
  const strengths = [];

  responses.forEach((item) => {
    const category = normalizeInterviewCategory(item.question.category);
    const score = item.evaluation.score;

    if (category === "Technical") {
      technical.push(score);
      problemSolving.push(score);
    }
    if (category === "Behavioral") {
      communication.push(score);
    }
    if (category === "Project") {
      problemSolving.push(score);
      communication.push(score);
    }
    if (category === "Resume") {
      communication.push(score);
    }

    strengths.push(...item.evaluation.strengths);
    weaknesses.push(...item.evaluation.weaknesses);
    improvements.push(...item.evaluation.improvements);
  });

  const recommendedAreas = Array.from(
    new Set([...weaknesses, ...improvements])
  ).slice(0, 5);

  const finalFeedback = `Your mock interview scored ${overallScore}%. ` +
    `Technical knowledge was ${calculateAverage(technical)}%, communication was ${calculateAverage(communication)}%, ` +
    `and problem solving was ${calculateAverage(problemSolving)}%. ` +
    `Focus on ${recommendedAreas.length ? recommendedAreas.join(", ") : "clarity and confidence"} to improve your next session.`;

  return {
    overallScore,
    technicalKnowledge: calculateAverage(technical),
    communication: calculateAverage(communication),
    problemSolving: calculateAverage(problemSolving),
    finalFeedback,
    recommendedAreas,
  };
}

export async function saveMockInterviewSession(questions, responses) {
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("Invalid questions array");
  }
  if (!Array.isArray(responses) || responses.length !== questions.length) {
    throw new Error("Responses must match questions length");
  }

  const user = await getAuthenticatedUserWithResume();

  responses.forEach((response, index) => {
    if (!response || !response.question || !response.evaluation) {
      throw new Error(`Invalid response payload at index ${index}`);
    }
    validateInterviewEvaluation(response.evaluation);
  });

  const report = createMockInterviewReport(responses);

  const assessment = await db.assessment.create({
    data: {
      userId: user.id,
      quizScore: report.overallScore,
      questions: responses,
      category: "Mock Interview",
      improvementTip: report.finalFeedback,
    },
  });

  return {
    assessmentId: assessment.id,
    quizScore: report.overallScore,
    report,
    questions: responses,
    improvementTip: report.finalFeedback,
  };
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
    const text = await response.text();

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
      improvementTip = (await tipResponse.text()).trim();
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