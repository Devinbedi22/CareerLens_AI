import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import FeatureGrid from "@/components/sections/feature-grid";
import CareerRoadmapExperience from "@/components/sections/career-roadmap-experience";
import IndustryInsights from "@/components/sections/industry-insights";
import FAQSection from "@/components/sections/faq-section";
import { ArrowRight } from "lucide-react";

const highlights = [
  { label: "Industries Covered", value: "50+" },
  { label: "Interview Questions", value: "1200+" },
  { label: "AI Success Rate", value: "95%" },
  { label: "24/7 Support", value: "Always" },
];

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(0,217,255,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(0,217,255,0.06),transparent_30%)] pointer-events-none" />
      <CareerRoadmapExperience />

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {highlights.map((item) => (
              <Card key={item.label} className="glass-card border-cyan-300/10 p-6">
                <CardContent className="p-0">
                  <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">{item.label}</p>
                  <p className="mt-4 text-4xl font-semibold text-white">{item.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <FeatureGrid />
      <IndustryInsights />
      <FAQSection />

      <section id="cta" className="py-24">
        <div className="container mx-auto px-4">
          <Card className="glass-card border-cyan-300/20 bg-gradient-to-r from-slate-950/90 via-slate-900/80 to-cyan-950/80 p-10 text-center shadow-cyan-600/20">
            <CardContent className="p-0">
              <p className="text-sm uppercase tracking-[0.4em] text-cyan-300/80">Launch your next chapter</p>
              <h2 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Turn every application into a standout story.</h2>
              <p className="mx-auto mt-4 max-w-2xl text-slate-300">NextStep AI blends intelligent guidance, polished resumes, and interview coaching so you move faster, stay confident, and land opportunities that match your goals.</p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:justify-center">
                <Link href="/dashboard">
                  <Button size="lg" className="btn-cta">
                    Try it free
                  </Button>
                </Link>
                <Link href="/resume">
                  <Button size="lg" variant="outline" className="border-cyan-300/30 text-cyan-200 hover:border-cyan-400 hover:text-white">
                    Explore resume tools
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
