/**
 * Voice Interview Utilities
 * 
 * Interviewer profiles, configurations, and helper functions
 * for the AI Voice Interviewer feature.
 */

// Interview difficulty levels and their impact on question complexity
export const DIFFICULTY_SETTINGS = {
  EASY: {
    level: "Easy",
    questionComplexity: "Basic concepts, straightforward problems",
    systemPromptNote: "Ask clarifying questions. Allow hints if candidate struggles.",
    avgQuestionDuration: 60, // seconds
    followUpDepth: "Shallow follow-ups"
  },
  MEDIUM: {
    level: "Medium",
    questionComplexity: "Intermediate concepts, real-world problems",
    systemPromptNote: "Challenge answers when reasoning is incomplete.",
    avgQuestionDuration: 120,
    followUpDepth: "Moderate follow-ups"
  },
  HARD: {
    level: "Hard",
    questionComplexity: "Advanced concepts, complex systems, tradeoffs",
    systemPromptNote: "Expect depth. Challenge weak answers. Push for optimization.",
    avgQuestionDuration: 180,
    followUpDepth: "Deep follow-ups with tradeoff discussions"
  },
  EXPERT: {
    level: "Expert",
    questionComplexity: "Expert-level architecture, edge cases, optimization, scalability",
    systemPromptNote: "Do NOT guide. Expect expert reasoning. Challenge aggressively.",
    avgQuestionDuration: 240,
    followUpDepth: "Very deep follow-ups, advanced tradeoffs"
  }
};

// Interview duration options in minutes
export const DURATION_OPTIONS = [15, 30, 45, 60];

// Interviewer profiles for each company
export const INTERVIEWER_PROFILES = {
  microsoft: {
    id: "microsoft",
    name: "Microsoft",
    category: "BIG_TECH",
    focusAreas: [
      "Projects and Technical Fundamentals",
      "Collaboration and Communication",
      "Design Decisions",
      "Practical Problem Solving"
    ],
    interviewStyle: "Resume deep dives, engineering judgment, real-world scenarios",
    technicalWeight: 70,
    behavioralWeight: 30,
    followUpAggressiveness: "MEDIUM",
    questionDrillPoints: [
      "Why did you make this technical choice?",
      "How would you handle scaling?",
      "What would you do differently?",
      "What did you learn from this?"
    ],
    initialQuestionTemplate:
      "Walk me through one of your most significant projects and the technical decisions you made.",
    projectDrillingKeywords: ["design", "trade-off", "scaling", "performance", "alternative"],
    commonInterviewTopics: [
      "System Design",
      "API Design",
      "Data Structures",
      "Project Experience",
      "Problem Solving"
    ],
    systemPromptOverrides: {
      behavioralTone: "Professional and collaborative",
      technicalExpectations: "Practical engineering mindset",
      interruptBehavior: "Ask clarifying questions, not hints"
    }
  },

  google: {
    id: "google",
    name: "Google",
    category: "BIG_TECH",
    focusAreas: [
      "Problem Solving",
      "System Design",
      "Scalability",
      "Architecture"
    ],
    interviewStyle: "Deep technical reasoning with multiple follow-ups, tradeoff discussions",
    technicalWeight: 85,
    behavioralWeight: 15,
    followUpAggressiveness: "HIGH",
    questionDrillPoints: [
      "How would you scale this to a million users?",
      "What are the tradeoffs?",
      "Why this approach over alternatives?",
      "What breaks first?"
    ],
    initialQuestionTemplate:
      "Tell me about a system you designed that had to scale significantly. What were the key challenges?",
    projectDrillingKeywords: ["scale", "tradeoff", "architecture", "optimization", "bottleneck"],
    commonInterviewTopics: [
      "System Design",
      "Algorithm Optimization",
      "Scalability",
      "Distributed Systems",
      "Technical Depth"
    ],
    systemPromptOverrides: {
      behavioralTone: "Direct and technical",
      technicalExpectations: "Deep systems thinking",
      interruptBehavior: "Challenge weak reasoning immediately"
    }
  },

  goldman_sachs: {
    id: "goldman_sachs",
    name: "Goldman Sachs",
    category: "FINTECH",
    focusAreas: [
      "Data Structures & Algorithms",
      "OOP",
      "DBMS",
      "Operating Systems",
      "Computer Networks",
      "Resume Discussion"
    ],
    interviewStyle: "High technical scrutiny, strong CS fundamentals required",
    technicalWeight: 90,
    behavioralWeight: 10,
    followUpAggressiveness: "HIGH",
    questionDrillPoints: [
      "What is the time complexity?",
      "Why not use this algorithm instead?",
      "Can you optimize further?",
      "What are the space-time tradeoffs?"
    ],
    initialQuestionTemplate:
      "Walk me through your most complex algorithm or data structure. Explain the time and space complexity.",
    projectDrillingKeywords: ["complexity", "optimization", "algorithm", "efficiency", "fundamental"],
    commonInterviewTopics: [
      "DSA",
      "OOP Design",
      "Database Design",
      "OS Concepts",
      "Networks"
    ],
    systemPromptOverrides: {
      behavioralTone: "Rigorous and demanding",
      technicalExpectations: "CS fundamentals required",
      interruptBehavior: "Do NOT guide. Expect expert knowledge."
    }
  },

  arcesium: {
    id: "arcesium",
    name: "Arcesium",
    category: "FINTECH",
    focusAreas: [
      "Advanced DSA",
      "Dynamic Programming",
      "Graphs",
      "Trees",
      "Low Level Design",
      "Performance Optimization"
    ],
    interviewStyle: "Difficult technical interviews, deep follow-ups on optimization",
    technicalWeight: 95,
    behavioralWeight: 5,
    followUpAggressiveness: "VERY_HIGH",
    questionDrillPoints: [
      "What is the optimal solution?",
      "Can you beat this complexity?",
      "Why does this work?",
      "Edge cases?"
    ],
    initialQuestionTemplate:
      "Solve this challenging problem and optimize it to the best possible complexity.",
    projectDrillingKeywords: ["optimal", "complexity", "edge case", "performance", "advanced"],
    commonInterviewTopics: [
      "Advanced DSA",
      "DP",
      "Graphs",
      "LLD",
      "Performance"
    ],
    systemPromptOverrides: {
      behavioralTone: "Demanding and rigorous",
      technicalExpectations: "Expert-level DSA required",
      interruptBehavior: "Push for optimal solutions only"
    }
  },

  phonepe: {
    id: "phonepe",
    name: "PhonePe",
    category: "FINTECH",
    focusAreas: [
      "Backend Systems",
      "APIs",
      "Databases",
      "Scalability",
      "Product Thinking"
    ],
    interviewStyle: "Backend engineering depth, product-aware questions",
    technicalWeight: 75,
    behavioralWeight: 25,
    followUpAggressiveness: "MEDIUM",
    questionDrillPoints: [
      "How would this scale to millions of transactions?",
      "What database design?",
      "API design decisions?",
      "Failure handling?"
    ],
    initialQuestionTemplate:
      "Describe a backend system you built. How would you design it for our scale?",
    projectDrillingKeywords: ["backend", "api", "database", "scale", "transaction"],
    commonInterviewTopics: [
      "Backend Systems",
      "API Design",
      "Database Design",
      "Scalability",
      "Product Thinking"
    ],
    systemPromptOverrides: {
      behavioralTone: "Practical and product-focused",
      technicalExpectations: "Backend systems design",
      interruptBehavior: "Ask about tradeoffs and scaling"
    }
  },

  mckinsey: {
    id: "mckinsey",
    name: "McKinsey",
    category: "CONSULTING",
    focusAreas: [
      "Structured Thinking",
      "Communication",
      "Leadership",
      "Problem Solving",
      "Business Reasoning"
    ],
    interviewStyle: "Case-based, business problem solving, clear communication",
    technicalWeight: 20,
    behavioralWeight: 80,
    followUpAggressiveness: "MEDIUM",
    questionDrillPoints: [
      "Why did you make this decision?",
      "What data supports this?",
      "What are the risks?",
      "How would you communicate this?"
    ],
    initialQuestionTemplate:
      "Tell me about a business problem you solved. How did you approach it?",
    projectDrillingKeywords: ["business", "decision", "stakeholder", "impact", "communication"],
    commonInterviewTopics: [
      "Case Analysis",
      "Problem Decomposition",
      "Business Acumen",
      "Leadership",
      "Communication"
    ],
    systemPromptOverrides: {
      behavioralTone: "Professional and business-minded",
      technicalExpectations: "Business reasoning, not coding",
      interruptBehavior: "Challenge weak reasoning, ask for data"
    }
  },

  hr_recruiter: {
    id: "hr_recruiter",
    name: "HR Recruiter",
    category: "GENERAL",
    focusAreas: [
      "Career Motivation",
      "Teamwork and Collaboration",
      "Leadership Potential",
      "Cultural Fit",
      "Communication"
    ],
    interviewStyle: "Behavioral, team dynamics, career trajectory",
    technicalWeight: 10,
    behavioralWeight: 90,
    followUpAggressiveness: "MEDIUM",
    questionDrillPoints: [
      "Tell me more about that",
      "How did that make you feel?",
      "What did you learn?",
      "How would you handle this differently?"
    ],
    initialQuestionTemplate:
      "Tell me about yourself and your career journey so far.",
    projectDrillingKeywords: ["team", "leadership", "challenge", "growth", "culture"],
    commonInterviewTopics: [
      "Career Motivation",
      "Team Dynamics",
      "Leadership",
      "Conflict Resolution",
      "Cultural Fit"
    ],
    systemPromptOverrides: {
      behavioralTone: "Warm but professional",
      technicalExpectations: "Soft skills and communication",
      interruptBehavior: "Probe deeper on behaviors and decisions"
    }
  }
};

/**
 * Build personalization context from user data
 * Combines resume, ATS results, match results, recommendations, and previous assessments
 */
export async function buildPersonalizationContext(user, db, difficulty) {
  const context = {
    resume: null,
    atsScore: null,
    atsFeedback: null,
    resumeMatchResults: null,
    jobRecommendations: [],
    previousAssessments: [],
    userProfile: {
      industry: user.industry,
      experience: user.experience,
      skills: user.skills
    },
    difficultyLevel: difficulty
  };

  try {
    // Fetch resume
    const resume = await db.resume.findUnique({
      where: { userId: user.id }
    });
    if (resume) {
      context.resume = resume.content.slice(0, 2000); // Truncate for context
      context.atsScore = resume.atsScore;
      context.atsFeedback = resume.feedback;
    }

    // Fetch previous assessments (last 3 voice interviews)
    const previousAssessments = await db.assessment.findMany({
      where: {
        userId: user.id,
        category: { contains: "Voice Interview" }
      },
      orderBy: { createdAt: "desc" },
      take: 3
    });
    context.previousAssessments = previousAssessments.map(a => ({
      category: a.category,
      quizScore: a.quizScore,
      createdAt: a.createdAt
    }));
  } catch (error) {
    console.error("Error building personalization context:", error);
  }

  return context;
}

/**
 * Build the system prompt for Gemini based on company profile and difficulty
 */
export function buildInterviewerSystemPrompt(
  profile,
  difficulty,
  personalizationContext,
  conversationHistory
) {
  const difficultySettings = Object.values(DIFFICULTY_SETTINGS).find(
    d => d.level === difficulty
  ) || DIFFICULTY_SETTINGS.MEDIUM;

  const questionsAsked = conversationHistory.filter(m => m.role === "ai").length;

  return `
You are a professional interview conductor for ${profile.name}.

YOUR ROLE:
You are conducting a real interview. You are NOT a tutor, NOT a chatbot, and NOT a hint provider.
Act like a professional interviewer with decades of experience.

COMPANY PROFILE:
Name: ${profile.name}
Focus Areas: ${profile.focusAreas.join(", ")}
Style: ${profile.interviewStyle}
Technical Weight: ${profile.technicalWeight}% | Behavioral Weight: ${profile.behavioralWeight}%

INTERVIEW DIFFICULTY: ${difficulty}
${difficultySettings.systemPromptNote}

CANDIDATE BACKGROUND:
Industry: ${personalizationContext.userProfile.industry || "Unknown"}
Experience: ${personalizationContext.userProfile.experience || "Unknown"} years
Skills: ${personalizationContext.userProfile.skills?.join(", ") || "Not provided"}
${personalizationContext.atsScore ? `ATS Score: ${personalizationContext.atsScore}/100` : ""}
${personalizationContext.atsFeedback ? `ATS Feedback: ${personalizationContext.atsFeedback}` : ""}

CONVERSATION HISTORY:
${conversationHistory.map(m => `${m.role.toUpperCase()}: ${m.text}`).join("\n\n")}

---

CRITICAL INTERVIEWER RULES:
1. You are NOT a teacher. Do NOT explain concepts during the interview.
2. You are NOT supportive. Do NOT give excessive praise or validation.
3. You are NOT a guide. Do NOT provide hints or nudge candidates in the right direction.
4. You ARE professional. Challenge weak reasoning. Probe for depth.
5. You ARE direct. Call out incomplete answers. Ask for clarifications immediately.
6. You ARE focused. Ask ONE question at a time, never multiple questions.
7. You ARE adaptive. When a candidate mentions a project, drill into:
   - Design decisions and WHY they were made
   - Trade-offs considered and WHY they were chosen
   - Scalability limits and bottlenecks
   - Technical choices vs alternatives not chosen
8. You ARE following ${profile.name} patterns. Use these focus areas: ${profile.focusAreas.join(", ")}
9. You NEVER ask the same question twice.
10. Your tone should be: ${profile.systemPromptOverrides.behavioralTone}
11. Expected technical depth: ${profile.systemPromptOverrides.technicalExpectations}

QUESTION STRATEGY FOR THIS INTERVIEW:
- Total questions expected: ~8-10 (based on difficulty and candidate pace)
- Questions asked so far: ${questionsAsked}
- Follow-up depth: ${difficultySettings.followUpDepth}

---

NEXT STEP:
The candidate just gave their response above. Decide:
1. Should you ask a follow-up to dig deeper?
2. Or should you move to a new topic/question?

Then generate ONE question. Make it natural. Make it challenging. Make it professional.

Return ONLY this JSON:
{
  "nextQuestion": "Your one question here...",
  "isFollowUp": true or false,
  "reasoning": "Brief explanation (1 sentence)"
}

Do NOT return anything else. No markdown, no code blocks, no explanations.
`;
}

/**
 * Detect when the user has finished speaking
 * Returns true if no new results in 1.5 seconds
 */
export function detectSpeechEnd(lastResultTime, currentTime = Date.now()) {
  if (!lastResultTime) return false;
  return currentTime - lastResultTime > 1500;
}

/**
 * Clean transcript text
 */
export function cleanTranscript(text) {
  if (!text) return "";
  return text
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s.,!?-]/g, "");
}

/**
 * Validate Gemini response structure
 */
export function validateVoiceSessionResponse(response) {
  if (!response) return false;
  
  const { nextQuestion, isFollowUp, reasoning } = response;
  
  return (
    typeof nextQuestion === "string" &&
    nextQuestion.trim().length > 0 &&
    typeof isFollowUp === "boolean" &&
    typeof reasoning === "string"
  );
}

/**
 * Parse Gemini evaluation response
 */
export function parseGeminiEvaluation(evaluationText) {
  try {
    const cleaned = evaluationText
      .replace(/```(?:json)?\n?/g, "")
      .replace(/```/g, "")
      .trim();
    
    const evaluation = JSON.parse(cleaned);
    
    if (!evaluation.overallScore) {
      throw new Error("Missing overallScore");
    }
    
    return evaluation;
  } catch (error) {
    console.error("Failed to parse evaluation:", error);
    throw error;
  }
}

/**
 * Get profile by ID
 */
export function getProfileById(companyId) {
  return INTERVIEWER_PROFILES[companyId] || null;
}

/**
 * Get all available profiles
 */
export function getAllProfiles() {
  return Object.values(INTERVIEWER_PROFILES);
}
