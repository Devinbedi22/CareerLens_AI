import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";
import { getAssessments } from "@/actions/interview";
import StatsCards from "./_components/stats-cards";
import PerformanceChart from "./_components/performance-chart";
import QuizList from "./_components/quiz-list";

export default async function InterviewPrepPage() {
  const assessments = await getAssessments();

  return (
    <div>
      <div className="mb-5 flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="max-w-full text-4xl font-bold leading-tight gradient-title sm:text-5xl md:text-6xl">
          Interview Preparation
        </h1>
        <Link href="/voice-interview" className="w-full md:w-auto">
          <Button size="lg" className="w-full gap-2 md:w-auto">
            <Mic className="h-4 w-4" />
            AI Voice Interview
          </Button>
        </Link>
      </div>
      <div className="space-y-6">
        <StatsCards assessments={assessments} />
        <PerformanceChart assessments={assessments} />
        <QuizList assessments={assessments} />
      </div>
    </div>
  );
}