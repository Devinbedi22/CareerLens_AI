"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, ChevronRight } from "lucide-react";
import { careerPaths, DEFAULT_CAREER_PATH } from "@/data/career-paths";

export default function RoadmapSection({ selectedPath = DEFAULT_CAREER_PATH }) {
  const [active, setActive] = useState(2);
  const currentPath = careerPaths[selectedPath] || careerPaths[DEFAULT_CAREER_PATH];
  const steps = currentPath.roadmap;

  useEffect(() => {
    setActive(Math.min(2, steps.length - 1));
  }, [selectedPath, steps.length]);

  const activeDetail = steps[active];

  return (
    <section id="roadmap" className="relative py-20">
      <div className="section-fade absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top,_rgba(0,217,255,0.2),transparent_40%)]" />
      <div className="relative container mx-auto px-4">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] items-start">
          <div className="space-y-6">
            <div className="inline-flex items-center rounded-full bg-white/8 px-4 py-2 text-sm text-cyan-200 ring-1 ring-cyan-300/20">
              <Sparkles className="mr-2 h-4 w-4" />
              Career roadmap designed for accelerated growth
            </div>
            <div>
              <h2 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">A structured path for any career.</h2>
              <p className="mt-4 text-slate-300">NextStep AI creates personalized roadmaps with clear milestones, skill recommendations, and realistic timelines for your chosen career path.</p>
            </div>
            <div className="grid gap-4">
              {steps.map((step, index) => {
                const isActive = index === active;
                return (
                  <motion.button
                    key={step.title}
                    type="button"
                    onClick={() => setActive(index)}
                    whileHover={{ x: 4 }}
                    className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80 p-6 text-left transition-all duration-300 ${isActive ? "border-cyan-300/80 bg-slate-900/95 shadow-[0_20px_80px_-60px_rgba(0,217,255,0.45)]" : "hover:border-white/20 hover:bg-slate-900/70"}`}
                  >
                    <div className={`absolute inset-y-0 left-0 w-1 rounded-full bg-cyan-400/80 transition-all duration-300 ${isActive ? "opacity-100" : "opacity-0"}`} />
                    <div className="flex items-start justify-between gap-6">
                      <div>
                        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Step {index + 1}</p>
                        <h3 className="mt-2 text-2xl font-semibold text-white">{step.title}</h3>
                        <p className="mt-2 text-slate-300">{step.subtitle}</p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-cyan-300 transition duration-300 group-hover:bg-cyan-300/10">
                        <ChevronRight className="h-5 w-5" />
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="glass-card border-cyan-300/10 p-6 shadow-cyan-500/10 h-fit lg:self-center"
          >
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Milestone {active + 1}</p>
                  <h3 className="mt-2 text-3xl font-semibold text-white">{activeDetail.title}</h3>
                </div>
                <div className="rounded-3xl bg-white/5 px-4 py-2 text-sm text-cyan-100">of {steps.length}</div>
              </div>

              <div className="rounded-3xl bg-slate-950/80 p-5 ring-1 ring-white/10">
                <p className="text-sm text-cyan-200">What this means</p>
                <p className="mt-3 text-white leading-7">{activeDetail.description}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-slate-950/80 p-5 ring-1 ring-white/10">
                  <p className="text-sm text-cyan-200">Focus areas</p>
                  <p className="mt-3 text-white">{activeDetail.focus}</p>
                </div>
                <div className="rounded-3xl bg-slate-950/80 p-5 ring-1 ring-white/10">
                  <p className="text-sm text-cyan-200">Typical timeline</p>
                  <p className="mt-3 text-white">{activeDetail.timeline}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
