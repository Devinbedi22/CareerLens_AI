import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import VoiceInterviewer from "./_components/voice-interviewer";

export default function VoiceInterviewPage() {
  return (
    <div className="space-y-4 py-6">
      <div className="flex items-center justify-between">
        <Link href="/interview">
          <Button variant="link" className="gap-2 pl-0">
            <ArrowLeft className="h-4 w-4" />
            Back to Interview Preparation
          </Button>
        </Link>
      </div>

      <VoiceInterviewer />
    </div>
  );
}
