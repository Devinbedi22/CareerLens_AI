"use client";

import React from "react";
import { Mic, Pause } from "lucide-react";

export default function InterviewerAvatar({ isSpeaking, isListening }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      {/* Avatar Circle */}
      <div
        className={`w-24 h-24 rounded-full border-4 flex items-center justify-center transition-all ${
          isSpeaking
            ? "border-blue-500 bg-blue-100 animate-pulse"
            : isListening
            ? "border-green-500 bg-green-100"
            : "border-gray-300 bg-gray-100"
        }`}
      >
        {isSpeaking ? (
          <div className="space-y-1">
            <div className="h-1 w-1 bg-blue-500 rounded-full mx-auto animate-bounce" />
            <div className="h-1 w-1 bg-blue-500 rounded-full mx-auto animate-bounce" style={{ animationDelay: "0.1s" }} />
            <div className="h-1 w-1 bg-blue-500 rounded-full mx-auto animate-bounce" style={{ animationDelay: "0.2s" }} />
          </div>
        ) : isListening ? (
          <Mic className="h-8 w-8 text-green-600" />
        ) : (
          <Pause className="h-8 w-8 text-gray-400" />
        )}
      </div>

      {/* Status Text */}
      <div className="text-center">
        {isSpeaking && (
          <p className="text-sm font-medium text-blue-600">AI is speaking...</p>
        )}
        {isListening && !isSpeaking && (
          <p className="text-sm font-medium text-green-600">Listening to you...</p>
        )}
        {!isSpeaking && !isListening && (
          <p className="text-sm text-muted-foreground">Ready</p>
        )}
      </div>
    </div>
  );
}
