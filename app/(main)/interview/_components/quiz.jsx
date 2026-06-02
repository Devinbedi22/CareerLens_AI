"use client";

import { useState, useEffect, useRef } from "react";
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
import { Mic } from "lucide-react";
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
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef(null);
  const transcriptBaseRef = useRef("");

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

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let interim = "";
      let finalTranscript = transcriptBaseRef.current;

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      transcriptBaseRef.current = finalTranscript;
      setInterimTranscript(interim);
      setAnswerText(`${finalTranscript}${interim}`);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      toast.error(`Voice input error: ${event.error}`);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      setInterimTranscript("");
    };

    recognitionRef.current = recognition;
    setSpeechSupported(true);

    return () => {
      recognition.stop();
    };
  }, []);

  const startInterview = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
    }

    setResultData(null);
    setGeneratedQuestions(null);
    setQuestions(null);
    setAnswers([]);
    setEvaluations([]);
    setAnswerText("");
    setShowEvaluation(false);
    setIsRecording(false);
    setInterimTranscript("");
    generateInterviewFn();
  };

  const startRecording = () => {
    if (!recognitionRef.current || isRecording) return;

    transcriptBaseRef.current = answerText;
    setInterimTranscript("");

    try {
      recognitionRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Speech recognition start failed:", error);
      toast.error("Unable to start voice input.");
    }
  };

  const stopRecording = () => {
    if (!recognitionRef.current || !isRecording) return;

    recognitionRef.current.stop();
    setIsRecording(false);
    setInterimTranscript("");
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    startRecording();
  };

  const handleSubmitAnswer = async () => {
    if (!answerText.trim()) {
      toast.error("Please enter your answer before submitting.");
      return;
    }

    if (evaluations[currentQuestion]) {
      return;
    }

    if (isRecording) {
      stopRecording();
    }

    try {
      await evaluateAnswerFn(questions[currentQuestion], answerText.trim());
    } catch (error) {
      console.error("Answer evaluation failed:", error);
    }
  };

  const handleNextQuestion = async () => {
    if (isRecording) {
      stopRecording();
    }

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

        <div className="space-y-2">
          {speechSupported ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant={isRecording ? "secondary" : "outline"}
                onClick={toggleRecording}
                disabled={isAnswered || evaluatingAnswer}
                className="w-full sm:w-auto"
              >
                <Mic className="mr-2 h-4 w-4" />
                {isRecording ? "Stop Recording" : "Voice Input"}
              </Button>
              <p className="text-sm text-muted-foreground">
                {isRecording
                  ? "Listening... speak now."
                  : "Use voice input to dictate your answer."}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Voice input is not supported by your browser.
            </p>
          )}
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
