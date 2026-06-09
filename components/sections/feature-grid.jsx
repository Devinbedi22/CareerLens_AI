"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { features } from "@/data/features";

const cardOrder = ["lg:col-span-5", "lg:col-span-3", "lg:col-span-4", "lg:col-span-3", "lg:col-span-5", "lg:col-span-4"];

export default function FeatureGrid() {
  return (
    <section id="features" className="relative overflow-hidden py-20">
      <div className="section-fade absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top,_rgba(0,217,255,0.18),transparent_45%)]" />
      <div className="relative container mx-auto px-4">
        <div className="max-w-3xl text-center mx-auto mb-12">
          <p className="text-sm uppercase tracking-[0.4em] text-cyan-300/80 mb-3">Platform capabilities</p>
          <h2 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">Intelligent tools for the next step in your career.</h2>
          <p className="mt-4 text-slate-300">A Bento-style command center built to help you track performance, sharpen skills, and land better roles.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {features.map((feature, index) => {
            // Map feature titles to existing routes. Use closest valid routes when exact pages don't exist.
            const routeMap = {
              "AI Resume Analyzer": "/resume",
              "Career Roadmap Generator": "/roadmap",
              "Interview Coach": "/interview",
              "Industry Insights": "/insights",
              "Salary Predictor": "/salary-predictor",
              "Skill Gap Analysis": "/resume",
            };

            const href = routeMap[feature.title] || "/dashboard";

            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className={`${cardOrder[index]} p-6 transition-transform duration-300`}
              >
                <Link
                  href={href}
                  className="block glass-card border-cyan-300/10 p-6 rounded-lg bg-transparent shadow-none border-none focus:outline-none focus:ring-2 focus:ring-cyan-300 hover:scale-105 transform transition duration-300 cursor-pointer hover:shadow-lg hover:shadow-cyan-500/20 hover:border-cyan-300/40"
                  aria-label={feature.title}
                >
                  <Card className="bg-transparent shadow-none border-none p-0">
                    <CardContent className="p-0">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-cyan-300">{feature.icon}</div>
                        <div className="rounded-full bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.25em] text-cyan-200/80">Live</div>
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                      <p className="text-slate-300">{feature.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
