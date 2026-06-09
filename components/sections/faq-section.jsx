"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { faqs } from "@/data/faqs";
import { motion } from "framer-motion";

export default function FAQSection() {
  return (
    <section id="faq" className="py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl text-center mx-auto mb-12">
          <p className="text-sm uppercase tracking-[0.4em] text-cyan-300/80">Ask anything</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Frequently asked questions</h2>
          <p className="mt-4 text-slate-300">Clear answers to the details that matter most for students and early-career professionals.</p>
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={faq.question} value={`item-${index}`} className="glass-card border-cyan-300/10 bg-slate-950/80 shadow-cyan-500/10">
                <AccordionTrigger className="text-left px-6 py-5 text-base font-semibold text-white hover:text-cyan-200">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-5 text-slate-300">
                  <p>{faq.answer}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
