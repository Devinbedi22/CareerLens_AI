"use client";

import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function QuizResult({
  result,
  hideStartNew = false,
  onStartNew,
}) {
  if (!result) return null;

  const report = result.report ?? result;
  const score = report.overallScore ?? result.quizScore ?? 0;
  const improvementTip = report.finalFeedback ?? result.improvementTip;
  const questions = report.questions ?? result.questions ?? [];
  const recommendedAreas = report.recommendedAreas ?? [];

  return (
    <div className="mx-auto">
      <h1 className="flex items-center gap-2 text-3xl gradient-title">
        <Trophy className="h-6 w-6 text-yellow-500" />
        {report.overallScore != null ? "Interview Report" : "Quiz Results"}
      </h1>

      <CardContent className="space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold">{score.toFixed(1)}%</h3>
          <Progress value={score} className="w-full" />
        </div>

        {report.overallScore != null && (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-sm font-medium">Technical Knowledge</p>
              <p className="mt-2 text-2xl font-bold">
                {report.technicalKnowledge ?? 0}%
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-sm font-medium">Communication</p>
              <p className="mt-2 text-2xl font-bold">
                {report.communication ?? 0}%
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-sm font-medium">Problem Solving</p>
              <p className="mt-2 text-2xl font-bold">
                {report.problemSolving ?? 0}%
              </p>
            </div>
          </div>
        )}

        {improvementTip && (
          <div className="bg-muted p-4 rounded-lg">
            <p className="font-medium">
              {report.overallScore != null ? "Final Feedback:" : "Improvement Tip:"}
            </p>
            <p className="text-muted-foreground">{improvementTip}</p>
          </div>
        )}

        {recommendedAreas.length > 0 && (
          <div className="bg-muted p-4 rounded-lg">
            <p className="font-medium">Recommended Areas</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {recommendedAreas.map((area, index) => (
                <span key={index} className="rounded-full border px-3 py-1 text-sm">
                  {area}
                </span>
              ))}
            </div>
          </div>
        )}

        {questions.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium">
              {report.overallScore != null ? "Question Review" : "Questions Review"}
            </h3>
            {questions.map((q, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{q.question}</p>
                  {q.evaluation?.score != null ? (
                    <span className="text-sm text-muted-foreground">
                      Score: {q.evaluation.score}
                    </span>
                  ) : null}
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    <span className="font-medium">Your answer:</span>{" "}
                    {q.answer || q.userAnswer}
                  </p>
                  {q.evaluation?.strengths?.length > 0 && (
                    <p>Strengths: {q.evaluation.strengths.join(", ")}</p>
                  )}
                  {q.evaluation?.weaknesses?.length > 0 && (
                    <p>Weaknesses: {q.evaluation.weaknesses.join(", ")}</p>
                  )}
                  {q.evaluation?.improvements?.length > 0 && (
                    <p>Improvements: {q.evaluation.improvements.join(", ")}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {!hideStartNew && (
        <CardFooter>
          <Button onClick={onStartNew} className="w-full">
            Start New Interview
          </Button>
        </CardFooter>
      )}
    </div>
  );
}
