import Link from "next/link";
import { Button } from "@/components/ui/button";
import RoadmapSection from "@/components/sections/roadmap";
import { Card, CardContent } from "@/components/ui/card";

export default function RoadmapPage() {
  return (
    <div className="relative overflow-hidden">
      <section className="relative py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">Career Roadmap</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Career Roadmap Generator</h1>
            <p className="mt-4 text-slate-300">Generate a clear, actionable progression plan that maps skills, milestones, and timelines for your chosen career path.</p>
            <div className="mt-8">
              <Link href="#roadmap">
                <Button size="lg" className="btn-cta">Generate your roadmap</Button>
              </Link>
            </div>
          </div>

          <Card className="glass-card border-cyan-300/10 p-6">
            <CardContent className="p-0">
              <RoadmapSection />
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
