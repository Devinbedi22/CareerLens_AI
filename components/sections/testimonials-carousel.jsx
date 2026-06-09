"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { testimonial } from "@/data/testimonial";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Star } from "lucide-react";

export default function TestimonialsCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeTestimonial = testimonial[activeIndex];

  const handlePrev = () => setActiveIndex((prev) => (prev - 1 + testimonial.length) % testimonial.length);
  const handleNext = () => setActiveIndex((prev) => (prev + 1) % testimonial.length);

  return (
    <section id="testimonials" className="relative py-20">
      <div className="section-fade absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top,_rgba(0,217,255,0.18),transparent_40%)]" />
      <div className="relative container mx-auto px-4">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row md:items-end mb-10">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-cyan-300/80">Trusted by professionals</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Feedback that feels premium.</h2>
          </div>
          <div className="inline-flex items-center gap-3 rounded-full bg-white/5 px-4 py-2 text-sm text-cyan-200 ring-1 ring-white/10">
            <Star className="h-4 w-4 text-cyan-300" />
            Real stories + measurable outcomes
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[auto_1fr] lg:items-center">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrev}
              className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 text-cyan-200 transition hover:border-cyan-300/40 hover:bg-slate-900/90"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 text-cyan-200 transition hover:border-cyan-300/40 hover:bg-slate-900/90"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTestimonial.author}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -20 }}
                transition={{ duration: 0.35 }}
                className="glass-card border-cyan-300/10 bg-slate-950/85 p-8"
              >
                <Card className="bg-transparent border-none shadow-none p-0">
                  <CardContent className="p-0">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 overflow-hidden rounded-3xl border border-cyan-300/20 bg-white/5">
                          <img src={activeTestimonial.image} alt={activeTestimonial.author} className="h-full w-full object-cover" />
                        </div>
                        <div>
                          <p className="text-xl font-semibold text-white">{activeTestimonial.author}</p>
                          <p className="text-sm text-slate-400">{activeTestimonial.role} • {activeTestimonial.company}</p>
                        </div>
                      </div>
                      <div className="rounded-3xl bg-cyan-500/10 px-4 py-2 text-xs uppercase tracking-[0.35em] text-cyan-200">Verified</div>
                    </div>
                    <blockquote className="mt-8 text-slate-300 leading-8">“{activeTestimonial.quote}”</blockquote>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
