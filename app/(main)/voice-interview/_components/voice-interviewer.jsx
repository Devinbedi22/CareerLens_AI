"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { useVoiceRecognition, useSpeechSynthesis, useVoiceInterviewSession } from "@/hooks/use-voice-interview";
import useFetch from "@/hooks/use-fetch";
import {
  initializeVoiceInterview,
  processVoiceResponse,
  generateFinalEvaluation,
  saveVoiceInterviewSession
} from "@/actions/voice-interview";
import CompanyDifficultySelector from "./company-difficulty-selector";
import InterviewCanvas from "./interview-canvas";
import EvaluationReport from "./evaluation-report";

export default function VoiceInterviewer() {
  const { sessionState, updateSessionState, addToHistory, initializeSession, completeSession, resetSession } =
    useVoiceInterviewSession();

  const voiceRecognition = useVoiceRecognition();
  const speechSynthesis = useSpeechSynthesis();

  // Server action hooks
  const {
    fn: initializeInterviewFn,
    loading: initializingInterview
  } = useFetch(initializeVoiceInterview);

  const {
    fn: processVoiceResponseFn,
    loading: processingVoiceResponse
  } = useFetch(processVoiceResponse);

  const {
    fn: generateFinalEvaluationFn,
    loading: generatingEvaluation
  } = useFetch(generateFinalEvaluation);

  const {
    fn: saveVoiceInterviewSessionFn,
    loading: savingSession
  } = useFetch(saveVoiceInterviewSession);

  // Refs for managing interview flow
  const questionCountRef = useRef(0);
  const maxQuestionsRef = useRef(8);
  const hasStartedRef = useRef(false);

  /**
   * Start interview - initialize with company and difficulty
   */
  const handleStartInterview = useCallback(
    async (companyId, difficulty, duration) => {
      try {
        questionCountRef.current = 0;
        maxQuestionsRef.current = Math.ceil((duration / 5)); // ~1 question per 5 minutes

        const response = await initializeInterviewFn(companyId, difficulty, duration);

        if (response?.success) {
          initializeSession(companyId, difficulty, duration, response.personalizationContext);
            updateSessionState({
              currentQuestion: response.initialQuestion
            });
            // Tag initial AI question as part of the INTRODUCTION phase
            addToHistory("ai", response.initialQuestion, { questionNum: 1, phase: "INTRODUCTION" });

          // Speak the first question
          speechSynthesis.speak(response.initialQuestion);
          hasStartedRef.current = true;

          toast.success("Interview started!");
        }
      } catch (error) {
        console.error("Failed to start interview:", error);
        toast.error("Failed to start interview. Please try again.");
      }
    },
    [initializeInterviewFn, initializeSession, updateSessionState, addToHistory, speechSynthesis]
  );

  /**
   * Handle end of AI speech - start listening
   */
  const handleAISpeechEnd = useCallback(() => {
    if (sessionState.status === "in_progress") {
      voiceRecognition.resetTranscript();
      voiceRecognition.startListening();
    }
  }, [sessionState.status, voiceRecognition]);

  /**
   * Handle end of user speech - process response
   */
  const handleUserSpeechEnd = useCallback(async () => {
    if (!voiceRecognition.transcript.trim()) {
      toast.error("Please speak something before submitting");
      voiceRecognition.startListening();
      return;
    }

    const userResponse = voiceRecognition.transcript;
    addToHistory("user", userResponse);

    try {
      updateSessionState({ isProcessing: true });

      const response = await processVoiceResponseFn(
        sessionState.selectedCompany,
        userResponse,
        sessionState.conversationHistory,
        sessionState.difficulty,
        sessionState.currentPhase
      );

      if (response?.success) {
        questionCountRef.current++;
        const nextQuestion = response.nextQuestion;

        updateSessionState({
          currentQuestion: nextQuestion,
          userTranscript: "",
          isProcessing: false,
          questionCount: questionCountRef.current
        });

        addToHistory("ai", nextQuestion, {
          isFollowUp: response.isFollowUp,
          reasoning: response.reasoning,
          questionNum: questionCountRef.current + 1,
          phase: sessionState.currentPhase
        });

        // Check if we should end interview
        if (questionCountRef.current >= maxQuestionsRef.current) {
          // Give user a moment before ending
          setTimeout(() => {
            handleEndInterview();
          }, 2000);
        } else {
          // Speak the next question
          speechSynthesis.speak(nextQuestion);
        }
        // Phase advancement heuristic: if both intro questions were asked and two user replies exist, move to RESUME
        try {
          const prevHistory = sessionState.conversationHistory || [];
          const virtualHistory = [
            ...prevHistory,
            { role: "user", text: userResponse },
            { role: "ai", text: nextQuestion }
          ];

          const aiIntroAsked = virtualHistory.some(m => m.role === "ai" && m.text.toLowerCase().includes("tell me about yourself"));
          const aiResumeAsked = virtualHistory.some(m => m.role === "ai" && m.text.toLowerCase().includes("walk me through your resume"));
          const userReplies = virtualHistory.filter(m => m.role === "user").length;

          if (aiIntroAsked && aiResumeAsked && userReplies >= 2 && sessionState.currentPhase === "INTRODUCTION") {
            updateSessionState({ currentPhase: "RESUME" });
          }
        } catch (e) {
          // non-fatal
        }
      }
    } catch (error) {
      console.error("Failed to process voice response:", error);
      toast.error("Failed to process response. Trying again...");
      voiceRecognition.startListening();
      updateSessionState({ isProcessing: false });
    }
  }, [
    voiceRecognition,
    sessionState.selectedCompany,
    sessionState.conversationHistory,
    sessionState.difficulty,
    addToHistory,
    updateSessionState,
    processVoiceResponseFn,
    speechSynthesis
  ]);

  /**
   * End interview and generate evaluation
   */
  const handleEndInterview = useCallback(async () => {
    if (sessionState.status !== "in_progress") return;

    speechSynthesis.stop();
    voiceRecognition.stopListening();

    try {
      updateSessionState({ isProcessing: true });

      // Generate final evaluation
      const evaluationResponse = await generateFinalEvaluationFn(
        sessionState.selectedCompany,
        sessionState.conversationHistory,
        sessionState.difficulty
      );

      if (evaluationResponse?.success) {
        // Save to database
        await saveVoiceInterviewSessionFn(
          sessionState.selectedCompany,
          sessionState.difficulty,
          sessionState.conversationHistory,
          evaluationResponse
        );

        // Update state to show evaluation report
        completeSession(evaluationResponse);
        updateSessionState({ isProcessing: false });

        toast.success("Interview completed!");
      }
    } catch (error) {
      console.error("Failed to end interview:", error);
      toast.error("Error completing interview. Please try again.");
      updateSessionState({ isProcessing: false });
    }
  }, [
    sessionState.status,
    sessionState.selectedCompany,
    sessionState.conversationHistory,
    sessionState.difficulty,
    generateFinalEvaluationFn,
    saveVoiceInterviewSessionFn,
    completeSession,
    updateSessionState,
    speechSynthesis,
    voiceRecognition
  ]);

  /**
   * Setup speech synthesis end callback
   */
  useEffect(() => {
    speechSynthesis.setOnEnd(handleAISpeechEnd);
  }, [speechSynthesis, handleAISpeechEnd]);

  /**
   * Setup voice recognition end callback
   */
  useEffect(() => {
    voiceRecognition.setOnSpeechEnd(handleUserSpeechEnd);
  }, [voiceRecognition, handleUserSpeechEnd]);

  // Render based on session status
  if (sessionState.status === "idle" || sessionState.status === "selecting") {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-4xl font-bold gradient-title mb-2">Voice Interview Simulator</h1>
          <p className="text-muted-foreground">
            Practice real interviews with AI interviewers from top companies.
          </p>
        </div>
        <CompanyDifficultySelector
          onStart={handleStartInterview}
          isLoading={initializingInterview}
        />
      </div>
    );
  }

  if (sessionState.status === "in_progress") {
    return (
      <div className="container mx-auto">
        <InterviewCanvas
          profile={sessionState.personalizationContext?.profile || {}}
          difficulty={sessionState.difficulty}
          startTime={sessionState.startTime}
          currentQuestion={sessionState.currentQuestion}
          userTranscript={voiceRecognition.transcript}
          interimTranscript={voiceRecognition.interimTranscript}
          isListening={voiceRecognition.isListening}
          isSpeaking={speechSynthesis.isSpeaking}
          isProcessing={sessionState.isProcessing}
          conversationHistory={sessionState.conversationHistory}
          questionCount={sessionState.questionCount}
          onEndInterview={handleEndInterview}
        />
      </div>
    );
  }

  if (sessionState.status === "completed") {
    return (
      <div className="container mx-auto">
        <div className="mb-6">
          <button
            onClick={resetSession}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            ← Start Another Interview
          </button>
        </div>
        <EvaluationReport
          evaluation={sessionState.evaluation?.evaluation}
          company={sessionState.personalizationContext?.profile?.name}
          difficulty={sessionState.difficulty}
          duration={sessionState.duration}
        />
      </div>
    );
  }

  return null;
}
