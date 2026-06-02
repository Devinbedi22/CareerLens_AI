"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Download, Share2 } from "lucide-react";
import { toast } from "sonner";

export default function EvaluationReport({ evaluation, company, difficulty, duration }) {
  if (!evaluation) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading evaluation...</p>
        </CardContent>
      </Card>
    );
  }

  const {
    overallScore,
    technicalKnowledge,
    communication,
    problemSolving,
    confidence,
    strengths = [],
    weaknesses = [],
    improvementSuggestions = []
  } = evaluation;

  const scoreColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const scoreBgColor = (score) => {
    if (score >= 80) return "bg-green-50";
    if (score >= 60) return "bg-yellow-50";
    return "bg-red-50";
  };

  const handleDownload = () => {
    const report = `
Interview Report
================

Company: ${company}
Difficulty: ${difficulty}
Duration: ${duration} minutes

SCORES
------
Overall: ${overallScore}/100
Technical Knowledge: ${technicalKnowledge}/100
Communication: ${communication}/100
Problem Solving: ${problemSolving}/100
Confidence: ${confidence}/100

STRENGTHS
---------
${strengths.map((s, i) => `${i + 1}. ${s}`).join("\n")}

WEAKNESSES
----------
${weaknesses.map((w, i) => `${i + 1}. ${w}`).join("\n")}

IMPROVEMENT SUGGESTIONS
-----------------------
${improvementSuggestions.map((s, i) => `${i + 1}. ${s}`).join("\n")}
    `;

    const element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(report));
    element.setAttribute("download", `voice-interview-${company}-${new Date().toISOString().slice(0, 10)}.txt`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast.success("Report downloaded!");
  };

  const handleShare = () => {
    const text = `I completed a ${difficulty} voice interview with ${company} and scored ${overallScore}/100! ${window.location.href}`;
    if (navigator.share) {
      navigator.share({
        title: "Voice Interview Results",
        text: text
      });
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    }
  };

  return (
    <div className="space-y-6 py-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold mb-2">Interview Complete</h2>
        <p className="text-muted-foreground">
          {company} • {difficulty} Level • {duration} minutes
        </p>
      </div>

      {/* Overall Score - Large Card */}
      <Card className={`border-2 ${scoreBgColor(overallScore)}`}>
        <CardContent className="pt-8 text-center">
          <p className="text-sm font-medium text-muted-foreground mb-2">Overall Score</p>
          <p className={`text-6xl font-bold ${scoreColor(overallScore)}`}>
            {overallScore}
            <span className="text-2xl">/100</span>
          </p>
          {overallScore >= 80 && <p className="text-sm font-medium text-green-600 mt-2">Excellent Performance</p>}
          {overallScore >= 60 && overallScore < 80 && <p className="text-sm font-medium text-yellow-600 mt-2">Good Performance</p>}
          {overallScore < 60 && <p className="text-sm font-medium text-red-600 mt-2">Needs Improvement</p>}
        </CardContent>
      </Card>

      {/* Score Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Technical Knowledge", score: technicalKnowledge },
          { label: "Communication", score: communication },
          { label: "Problem Solving", score: problemSolving },
          { label: "Confidence", score: confidence }
        ].map((item) => (
          <Card key={item.label} className={scoreBgColor(item.score)}>
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-muted-foreground mb-2 truncate">{item.label}</p>
              <p className={`text-2xl font-bold ${scoreColor(item.score)}`}>{item.score}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Strengths */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-green-600">✓ Strengths</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {strengths.map((strength, idx) => (
            <div key={idx} className="flex gap-2">
              <span className="text-green-600 font-bold">•</span>
              <p className="text-sm">{strength}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Weaknesses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-red-600">✗ Weaknesses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {weaknesses.map((weakness, idx) => (
            <div key={idx} className="flex gap-2">
              <span className="text-red-600 font-bold">•</span>
              <p className="text-sm">{weakness}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Improvement Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-blue-600">→ Improvement Suggestions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {improvementSuggestions.map((suggestion, idx) => (
            <div key={idx} className="flex gap-2">
              <span className="text-blue-600 font-bold">{idx + 1}.</span>
              <p className="text-sm">{suggestion}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={handleDownload} variant="outline" className="flex-1">
          <Download className="h-4 w-4 mr-2" />
          Download Report
        </Button>
        <Button onClick={handleShare} variant="outline" className="flex-1">
          <Share2 className="h-4 w-4 mr-2" />
          Share Results
        </Button>
      </div>

      {/* Next Steps */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6 space-y-2">
          <p className="font-medium text-blue-900">Next Steps</p>
          <ul className="text-sm text-blue-900 space-y-1">
            <li className="flex gap-2">
              <ArrowRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
              Review the improvement suggestions
            </li>
            <li className="flex gap-2">
              <ArrowRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
              Practice with different difficulty levels
            </li>
            <li className="flex gap-2">
              <ArrowRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
              Try other company interviewers
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
