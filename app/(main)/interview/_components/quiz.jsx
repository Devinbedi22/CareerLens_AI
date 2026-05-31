"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  generateMockInterview,
  evaluateMockInterviewAnswer,
  saveMockInterviewSession,
} from "@/actions/interview";
import QuizResult from "./quiz-result";
import useFetch from "@/hooks/use-fetch";
import { BarLoader } from "react-spinners";

export default function Quiz() {
  const [questions, setQuestions] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answerText, setAnswerText] = useState("");
  const [answers, setAnswers] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [showEvaluation, setShowEvaluation] = useState(false);

  const {
    loading: loadingQuestions,
    fn: generateInterviewFn,
    data: generatedQuestions,
    setData: setGeneratedQuestions,
  } = useFetch(generateMockInterview);

  const {
    loading: evaluatingAnswer,
    fn: evaluateAnswerFn,
    data: evaluationData,
  } = useFetch(evaluateMockInterviewAnswer);

  const {
    loading: savingSession,
    fn: saveSessionFn,
    data: resultData,
    setData: setResultData,
  } = useFetch(saveMockInterviewSession);

  useEffect(() => {
    if (generatedQuestions) {
      setQuestions(generatedQuestions);
      setCurrentQuestion(0);
      setAnswerText("");
      setAnswers(new Array(generatedQuestions.length).fill(""));
      setEvaluations(new Array(generatedQuestions.length).fill(null));
      setShowEvaluation(false);
    }
  }, [generatedQuestions]);

  useEffect(() => {
    if (!evaluationData || !questions) return;

    const updatedAnswers = [...answers];
    updatedAnswers[currentQuestion] = answerText.trim();
    setAnswers(updatedAnswers);

    const updatedEvaluations = [...evaluations];
    updatedEvaluations[currentQuestion] = evaluationData;
    setEvaluations(updatedEvaluations);
    setShowEvaluation(true);
  }, [evaluationData]);

  const startInterview = () => {
    setResultData(null);
    setGeneratedQuestions(null);
    setQuestions(null);
    setAnswers([]);
    setEvaluations([]);
    setAnswerText("");
    setShowEvaluation(false);
    generateInterviewFn();
  };

  const handleSubmitAnswer = async () => {
    if (!answerText.trim()) {
      toast.error("Please enter your answer before submitting.");
      return;
    }

    if (evaluations[currentQuestion]) {
      return;
    }

    try {
      await evaluateAnswerFn(questions[currentQuestion], answerText.trim());
    } catch (error) {
      console.error("Answer evaluation failed:", error);
    }
  };

  const handleNextQuestion = async () => {
    if (currentQuestion < questions.length - 1) {
      const nextIndex = currentQuestion + 1;
      setCurrentQuestion(nextIndex);
      setAnswerText(answers[nextIndex] ?? "");
      setShowEvaluation(false);
      return;
    }

    await finishInterview();
  };

  const finishInterview = async () => {
    const responseHistory = questions.map((question, index) => ({
      question,
      answer: answers[index] ?? "",
      evaluation: evaluations[index],
    }));

    if (responseHistory.some((item) => !item.evaluation)) {
      toast.error("Please submit answers for all questions before finishing.");
      return;
    }

    try {
      await saveSessionFn(questions, responseHistory);
    } catch (error) {
      console.error("Failed to save interview session:", error);
    }
  };

  if (loadingQuestions) {
    return <BarLoader className="mt-4" width="100%" color="gray" />;
  }

  if (resultData) {
    return (
      <div className="mx-2">
        <QuizResult result={resultData} onStartNew={startInterview} />
      </div>
    );
  }

  if (!questions) {
    return (
      <Card className="mx-2">
        <CardHeader>
          <CardTitle>Start Your Mock Interview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Practice 7 tailored interview questions generated from your profile,
            resume, skills, and experience. Submit an answer and receive
            immediate AI feedback.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={startInterview} className="w-full">
            Start Interview
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const current = questions[currentQuestion];
  const currentEvaluation = evaluations[currentQuestion];
  const isAnswered = Boolean(currentEvaluation);

  return (
    <Card className="mx-2">
      <CardHeader>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle>
              Question {currentQuestion + 1} of {questions.length}
            </CardTitle>
            <Badge variant="secondary">{current.category}</Badge>
          </div>
          <p className="text-muted-foreground">{current.question}</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="font-medium">Your answer</p>
          <Textarea
            value={answerText}
            onChange={(event) => setAnswerText(event.target.value)}
            placeholder="Type your response here..."
            disabled={isAnswered}
            className="min-h-[180px]"
          />
        </div>

        {isAnswered && currentEvaluation ? (
          <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold">AI Evaluation</p>
              <span className="text-sm text-muted-foreground">
                Score: {currentEvaluation.score}
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <p className="text-sm font-medium">Strengths</p>
                <ul className="mt-2 list-disc list-inside text-sm">
                  {currentEvaluation.strengths.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium">Weaknesses</p>
                <ul className="mt-2 list-disc list-inside text-sm">
                  {currentEvaluation.weaknesses.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium">Improvements</p>
                <ul className="mt-2 list-disc list-inside text-sm">
                  {currentEvaluation.improvements.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>

      <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {isAnswered
              ? "Answer submitted. Move to the next question when ready."
              : "Submit your answer to receive immediate feedback."}
          </p>
          {evaluatingAnswer && (
            <BarLoader className="w-full" color="gray" />
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            onClick={handleSubmitAnswer}
            disabled={isAnswered || evaluatingAnswer || savingSession}
            variant="outline"
          >
            Submit Answer
          </Button>
          <Button
            onClick={handleNextQuestion}
            disabled={!isAnswered || savingSession}
          >
            {currentQuestion < questions.length - 1
              ? "Next Question"
              : "Finish Interview"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
