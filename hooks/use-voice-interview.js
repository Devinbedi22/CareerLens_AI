"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { detectSpeechEnd, cleanTranscript } from "@/lib/voice-interview-utils";

/**
 * useVoiceRecognition Hook
 * Manages browser Speech Recognition API for user voice input
 */
export function useVoiceRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState(null);
  
  const recognitionRef = useRef(null);
  const lastResultTimeRef = useRef(null);
  const silenceCheckIntervalRef = useRef(null);
  const onSpeechEndRef = useRef(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === "undefined") {
      setIsSupported(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      toast.error("Speech Recognition not supported in your browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      lastResultTimeRef.current = Date.now();
    };

    recognition.onresult = (event) => {
      let interim = "";
      let final = transcript;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcriptPart = result[0].transcript;

        if (result.isFinal) {
          final += transcriptPart + " ";
        } else {
          interim += transcriptPart;
        }
      }

      lastResultTimeRef.current = Date.now();
      setTranscript(cleanTranscript(final));
      setInterimTranscript(cleanTranscript(interim));
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setError(event.error);
      
      if (event.error !== "no-speech") {
        toast.error(`Voice input error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
      if (onSpeechEndRef.current) {
        onSpeechEndRef.current();
      }
    };

    recognitionRef.current = recognition;
    setIsSupported(true);

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (silenceCheckIntervalRef.current) {
        clearInterval(silenceCheckIntervalRef.current);
      }
    };
  }, [transcript]);

  // Silence detection - check if user stopped speaking
  useEffect(() => {
    if (!isListening) {
      if (silenceCheckIntervalRef.current) {
        clearInterval(silenceCheckIntervalRef.current);
      }
      return;
    }

    silenceCheckIntervalRef.current = setInterval(() => {
      if (lastResultTimeRef.current && detectSpeechEnd(lastResultTimeRef.current)) {
        if (recognitionRef.current && transcript.trim().length > 0) {
          recognitionRef.current.stop(); // Will trigger onend
        }
      }
    }, 500);

    return () => {
      if (silenceCheckIntervalRef.current) {
        clearInterval(silenceCheckIntervalRef.current);
      }
    };
  }, [isListening, transcript]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return;

    try {
      setTranscript("");
      setInterimTranscript("");
      setError(null);
      lastResultTimeRef.current = Date.now();
      recognitionRef.current.start();
    } catch (err) {
      console.error("Failed to start listening:", err);
      toast.error("Failed to start voice input");
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return;

    try {
      recognitionRef.current.stop();
    } catch (err) {
      console.error("Failed to stop listening:", err);
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
    lastResultTimeRef.current = null;
  }, []);

  const setOnSpeechEnd = useCallback((callback) => {
    onSpeechEndRef.current = callback;
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
    setOnSpeechEnd
  };
}

/**
 * useSpeechSynthesis Hook
 * Manages browser Speech Synthesis API for AI voice output
 */
export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const utteranceRef = useRef(null);
  const onEndRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      setIsSupported(false);
      return;
    }

    const synth = window.speechSynthesis;
    if (!synth) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);

    return () => {
      if (synth.speaking) {
        synth.cancel();
      }
    };
  }, []);

  const speak = useCallback((text, options = {}) => {
    if (!isSupported) {
      console.warn("Speech Synthesis not supported");
      return;
    }

    const synth = window.speechSynthesis;
    synth.cancel(); // Cancel any ongoing speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate || 1.0;
    utterance.pitch = options.pitch || 1.0;
    utterance.volume = options.volume || 0.8;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      if (onEndRef.current) {
        onEndRef.current();
      }
    };

    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event);
      setIsSpeaking(false);
      toast.error("Failed to play voice");
    };

    utteranceRef.current = utterance;
    synth.speak(utterance);
  }, [isSupported]);

  const stop = useCallback(() => {
    if (!isSupported) return;

    const synth = window.speechSynthesis;
    synth.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  const setOnEnd = useCallback((callback) => {
    onEndRef.current = callback;
  }, []);

  return {
    isSpeaking,
    isSupported,
    speak,
    stop,
    setOnEnd
  };
}

/**
 * useVoiceInterviewSession Hook
 * Manages the overall interview session state and conversation history
 */
export function useVoiceInterviewSession() {
  const [sessionState, setSessionState] = useState({
    status: "idle", // idle | selecting | in_progress | completed
    selectedCompany: null,
    difficulty: "Medium",
    duration: 30,
    startTime: null,
    endTime: null,
    conversationHistory: [],
    currentPhase: null,
    currentQuestion: "",
    userTranscript: "",
    isProcessing: false,
    questionCount: 0,
    error: null,
    personalizationContext: null
  });

  const updateSessionState = useCallback((updates) => {
    setSessionState(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  const addToHistory = useCallback((role, text, metadata = {}) => {
    setSessionState(prev => ({
      ...prev,
      conversationHistory: [
        ...prev.conversationHistory,
        {
          role,
          text,
          timestamp: Date.now(),
          ...metadata
        }
      ]
    }));
  }, []);

  const initializeSession = useCallback((company, difficulty, duration, context) => {
    setSessionState({
      status: "in_progress",
      selectedCompany: company,
      difficulty,
      duration,
      startTime: Date.now(),
      endTime: null,
      conversationHistory: [],
      currentPhase: "INTRODUCTION",
      currentQuestion: "",
      userTranscript: "",
      isProcessing: false,
      questionCount: 0,
      error: null,
      personalizationContext: context
    });
  }, []);

  const completeSession = useCallback((evaluation) => {
    setSessionState(prev => ({
      ...prev,
      status: "completed",
      endTime: Date.now(),
      evaluation
    }));
  }, []);

  const resetSession = useCallback(() => {
    setSessionState({
      status: "idle",
      selectedCompany: null,
      difficulty: "Medium",
      duration: 30,
      startTime: null,
      endTime: null,
      conversationHistory: [],
      currentPhase: null,
      currentQuestion: "",
      userTranscript: "",
      isProcessing: false,
      questionCount: 0,
      error: null,
      personalizationContext: null
    });
  }, []);

  return {
    sessionState,
    updateSessionState,
    addToHistory,
    initializeSession,
    completeSession,
    resetSession
  };
}
