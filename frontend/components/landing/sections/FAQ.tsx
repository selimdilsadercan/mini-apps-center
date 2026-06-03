"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CaretDown, Envelope } from "@phosphor-icons/react";
import { useTranslations } from "@/contexts/LanguageContext";

const FAQItem: React.FC<{
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
  index: number;
}> = ({ question, answer, isOpen, onClick, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-xs hover:border-gray-200 transition-colors"
    >
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50/50 transition-colors cursor-pointer"
      >
        <span className="text-gray-900 font-bold text-sm sm:text-base pr-4">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 text-gray-400"
        >
          <CaretDown size={18} weight="bold" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="px-6 pb-6 text-gray-500 text-xs sm:text-sm font-semibold leading-relaxed border-t border-gray-100 pt-4">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const FAQ: React.FC = () => {
  const t = useTranslations("FAQ");
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 relative overflow-hidden bg-white">
      {/* Background Blurs */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-purple-100/20 rounded-full blur-3xl" />
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-indigo-100/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-2 rounded-full bg-amber-55 border border-amber-100 text-amber-700 text-xs font-bold mb-4 shadow-sm"
          >
            {t("badge")}
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight"
          >
            {t("title")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-500 text-base md:text-lg max-w-2xl mx-auto font-semibold leading-relaxed"
          >
            {t("subtitle")}
          </motion.p>
        </div>

        {/* FAQ Items */}
        <div className="max-w-2xl mx-auto space-y-4">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <FAQItem
              key={index}
              question={t(`questions.${index}.q` as any)}
              answer={t(`questions.${index}.a` as any)}
              isOpen={openIndex === index}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              index={index}
            />
          ))}
        </div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16 border-t border-gray-100 pt-8"
        >
          <p className="text-gray-400 text-xs font-bold mb-4">{t("moreQuestions")}</p>
          <motion.a
            href="mailto:contact@allminiapps.com"
            whileHover={{ y: -2 }}
            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-bold transition-colors text-sm"
          >
            <Envelope size={18} weight="fill" />
            <span>contact@allminiapps.com</span>
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQ;
