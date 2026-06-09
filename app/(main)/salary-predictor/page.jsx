import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";

export default function SalaryPredictorPage() {
  return (
    <div className="relative overflow-hidden">
      <section className="relative py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">Salary Predictor</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Estimate Your Market Compensation</h1>
            <p className="mt-4 text-slate-300">We’re building a salary estimator that blends role benchmarks and market data to help you set realistic compensation expectations.</p>
            <div className="mt-8">
              <Link href="/dashboard">
                <Button size="lg" className="btn-cta">See related market data</Button>
              </Link>
            </div>
          </div>

          <Card className="glass-card border-cyan-300/10 p-6 text-center">
            <CardContent>
              <div className="flex flex-col items-center justify-center gap-6 py-12">
                <TrendingUp className="h-12 w-12 text-cyan-300" />
                <h3 className="text-2xl font-semibold text-white">Feature Under Development</h3>
                <p className="text-slate-300 max-w-xl">Salary Predictor is coming soon. We’re integrating market signals and role-specific benchmarks — check back soon or view related insights on the dashboard.</p>
                <div className="mt-4">
                  <Link href="/dashboard">
                    <Button variant="outline">Open dashboard</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
