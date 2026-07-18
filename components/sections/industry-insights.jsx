"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, TrendingUp, Layers, Sparkles } from "lucide-react";

const trendingDomains = [
  { name: "Artificial Intelligence", description: "AI/ML engineers, prompt engineers, and AI ethicists in high demand" },
  { name: "Cloud Computing", description: "AWS, Azure, and GCP expertise remains critical for infrastructure roles" },
  { name: "Data Engineering", description: "Data pipelines and analytics platforms growing across industries" },
  { name: "Cybersecurity", description: "Security specialists and compliance experts increasingly needed" },
  { name: "Product Management", description: "Cross-functional product roles expanding in tech and startups" },
];

const growthCategories = [
  { name: "AI/Machine Learning", icon: "🤖" },
  { name: "Cloud Infrastructure", icon: "☁️" },
  { name: "Data Engineering", icon: "📊" },
  { name: "Cybersecurity", icon: "🔒" },
  { name: "Full-Stack Development", icon: "💻" },
  { name: "Product & Strategy", icon: "🎯" },
];

export default function IndustryInsights() {
  return (
    <section id="insights" className="relative py-20">
      <div className="section-fade absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top,_rgba(0,217,255,0.18),transparent_40%)]" />
      <div className="relative container mx-auto px-4">
        <div className="space-y-12">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">Career Trends</p>
            <h2 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">Explore growing career domains.</h2>
            <p className="text-slate-300">NextStep AI helps you understand which career paths are expanding, where opportunities are emerging, and how to prepare for tomorrow's roles.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {trendingDomains.map((domain) => (
              <div key={domain.name} className="glass-card border-cyan-300/10 bg-slate-950/85 p-6 shadow-cyan-500/10 rounded-3xl hover:border-cyan-300/20 transition-all duration-300">
                <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">Growing domain</p>
                <h3 className="mt-4 text-xl font-semibold text-white">{domain.name}</h3>
                <p className="mt-3 text-slate-300 leading-6 text-sm">{domain.description}</p>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-semibold text-white mb-4">Popular career categories</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {growthCategories.map((category) => (
                  <div key={category.name} className="rounded-2xl border border-white/10 bg-slate-950/80 p-6 hover:border-cyan-300/30 transition-all duration-300">
                    <div className="text-3xl mb-2">{category.icon}</div>
                    <p className="text-white font-medium">{category.name}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 text-slate-300">
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">How NextStep AI helps</p>
              <p className="mt-4 leading-7">We help you explore which career paths match your interests and skills, show you the typical progression for each role, and recommend the key areas you should focus on to succeed. When you're ready, generate a personalized roadmap.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
