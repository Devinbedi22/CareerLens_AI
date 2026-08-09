"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import { careerPaths } from "@/data/career-paths";

export default function HeroSection({ selectedPath, onSelectedPathChange }) {
  const currentPath = careerPaths[selectedPath];
  return (
    <section id="hero" className="relative overflow-hidden pb-20 pt-40 md:pt-44">
      <div className="absolute inset-x-0 top-0 h-96 bg-[radial-gradient(circle_at_top_left,_rgba(0,217,255,0.16),transparent_30%),radial-gradient(circle_at_top_right,_rgba(0,217,255,0.08),transparent_20%)] pointer-events-none" />
      <div className="relative container mx-auto px-4">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] items-start">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <span className="inline-flex rounded-full border border-cyan-400/20 bg-white/5 px-4 py-2 text-sm font-semibold uppercase tracking-[0.35em] text-cyan-200">
              AI-powered career guidance
            </span>
            <h1 className="mt-8 text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
              Build your career roadmap across any industry.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
              NextStep AI generates personalized roadmaps for Software Engineering, Data Science, Product Management, and more—showing you the exact skills, milestones, and timeline that matter.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link href="/dashboard">
                <Button size="lg" className="btn-cta">
                  Generate Your Roadmap
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/resume">
                <Button size="lg" variant="outline" className="border-cyan-300/30 text-cyan-100 hover:border-cyan-300 hover:text-white">
                  Explore Career Tools
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.1 }} className="relative">
            <div className="glass-card border-cyan-300/10 p-6 shadow-cyan-500/10">
              <div className="space-y-6">
                <div>
                  <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">Select a career path</p>
                  <div className="mt-4 grid gap-2 grid-cols-2 sm:grid-cols-1">
                    {Object.keys(careerPaths).map((path) => (
                      <button
                        key={path}
                        onClick={() => onSelectedPathChange(path)}
                        className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-all duration-200 ${
                          selectedPath === path
                            ? "border-cyan-300/80 bg-cyan-500/15 text-white"
                            : "border-white/10 bg-slate-950/50 text-slate-300 hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {selectedPath === path && <Check className="h-4 w-4 text-cyan-300" />}
                          {path}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-[2rem] border border-white/10 bg-slate-950/85 p-5">
                  <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Your path</p>
                    <p className="mt-3 text-sm text-slate-200">{currentPath.roadmap.map((step) => step.title).join(" → ")}</p>
                </div>

                <div className="rounded-[2rem] border border-white/10 bg-slate-950/85 p-5">
                  <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Key skills to develop</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {currentPath.skills.map((skill) => (
                      <span key={skill} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[2rem] border border-white/10 bg-slate-950/85 p-4 text-white">
                    <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Roadmap length</p>
                    <p className="mt-2 text-lg font-semibold">{currentPath.roadmap.length} milestones</p>
                  </div>
                  <div className="rounded-[2rem] border border-white/10 bg-slate-950/85 p-4 text-white">
                    <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Typical timeline</p>
                    <p className="mt-2 text-lg font-semibold">{currentPath.typicalTimeline}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
