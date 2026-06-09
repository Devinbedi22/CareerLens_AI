import Link from "next/link";
import IndustryInsights from "@/components/sections/industry-insights";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function InsightsPage() {
  return (
    <div className="relative overflow-hidden">
      <section className="relative py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">Industry Insights</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Explore Industry Trends</h1>
            <p className="mt-4 text-slate-300">Understand hiring demand, salary movement, and the skills shaping the market today.</p>
            <div className="mt-8">
              <Link href="/dashboard">
                <Button size="lg" className="btn-cta">View dashboard insights</Button>
              </Link>
            </div>
          </div>

          <Card className="glass-card border-cyan-300/10 p-6">
            <CardContent className="p-0">
              <IndustryInsights />
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
