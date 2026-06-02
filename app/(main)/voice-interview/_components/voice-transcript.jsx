"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { BarLoader } from "react-spinners";

export default function VoiceTranscript({
  currentQuestion,
  userTranscript,
  interimTranscript,
  isListening,
  isProcessing,
  isSpeaking
}) {
  const fullTranscript = userTranscript + (interimTranscript ? " " + interimTranscript : "");

  return (
    <div className="space-y-4">
      {/* Current AI Question */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <p className="text-xs font-medium text-blue-600 mb-2">AI Question</p>
          {isSpeaking ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-700 italic">{currentQuestion}</p>
              <BarLoader width="100%" height={2} color="#3b82f6" />
            </div>
          ) : (
            <p className="text-sm text-gray-700">{currentQuestion}</p>
          )}
        </CardContent>
      </Card>

      {/* User Transcript */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-green-600">Your Response</p>
            {isListening && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-green-600">Recording</span>
                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
              </div>
            )}
            {isProcessing && (
              <span className="text-xs text-blue-600">Processing...</span>
            )}
          </div>

          {fullTranscript ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-700 leading-relaxed">{fullTranscript}</p>
              {interimTranscript && (
                <p className="text-sm text-gray-500 italic">
                  {interimTranscript}
                  <span className="animate-pulse">|</span>
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">
              {isListening ? "Waiting for your response..." : "Ready to listen"}
            </p>
          )}

          {isProcessing && (
            <BarLoader width="100%" height={2} color="#60a5fa" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
