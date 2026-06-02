"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import InterviewerAvatar from "./interviewer-avatar";
import VoiceTranscript from "./voice-transcript";
import ConversationHistory from "./conversation-history";

export default function InterviewCanvas({
  profile,
  difficulty,
  startTime,
  currentQuestion,
  userTranscript,
  interimTranscript,
  isListening,
  isSpeaking,
  isProcessing,
  conversationHistory,
  questionCount,
  onEndInterview
}) {
  const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;

  return (
    <div className="space-y-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">{profile.name} Interview</h2>
          <p className="text-sm text-muted-foreground">
            {difficulty} Level • Question {questionCount}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-mono font-bold">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </p>
          <Button
            onClick={onEndInterview}
            variant="destructive"
            size="sm"
            className="mt-2"
          >
            <X className="h-4 w-4 mr-1" />
            End Interview
          </Button>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column - Conversation History */}
        <div className="lg:col-span-1 max-h-96">
          <ConversationHistory conversationHistory={conversationHistory} />
        </div>

        {/* Right Column - Interview Interface */}
        <div className="lg:col-span-2 space-y-4">
          {/* Avatar and Status */}
          <Card>
            <CardContent className="pt-6">
              <InterviewerAvatar isSpeaking={isSpeaking} isListening={isListening} />
            </CardContent>
          </Card>

          {/* Transcript and Question */}
          <VoiceTranscript
            currentQuestion={currentQuestion}
            userTranscript={userTranscript}
            interimTranscript={interimTranscript}
            isListening={isListening}
            isProcessing={isProcessing}
            isSpeaking={isSpeaking}
          />

          {/* Instructions Card */}
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-4">
              <p className="text-sm text-amber-900">
                {isSpeaking && "🎧 Listen to the question..."}
                {isListening && !isSpeaking && "🎤 Speak your answer clearly..."}
                {isProcessing && "⏳ Processing your response..."}
                {!isSpeaking && !isListening && !isProcessing && !currentQuestion && "⏳ Initializing interview..."}
                {!isSpeaking && !isListening && !isProcessing && currentQuestion && "Ready for next question"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
