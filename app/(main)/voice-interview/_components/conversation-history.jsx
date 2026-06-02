"use client";

import React, { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ConversationHistory({ conversationHistory = [] }) {
  const scrollRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversationHistory]);

  if (conversationHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conversation History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Interview will appear here...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-base">Conversation History</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto max-h-96 pr-4">
        <div className="space-y-4">
          {conversationHistory.map((msg, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant={msg.role === "ai" ? "default" : "secondary"}>
                  {msg.role === "ai" ? "AI" : "You"}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-gray-700 pl-2 border-l-2 border-gray-200">
                {msg.text}
              </p>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </CardContent>
    </Card>
  );
}
