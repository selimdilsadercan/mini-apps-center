"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, HelpCircle } from "lucide-react";
import { useTranslations } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { CaretDown, Envelope } from "@phosphor-icons/react";

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
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:border-gray-200 transition-colors"
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

export default function FAQPage() {
  const router = useRouter();
  const t = useTranslations("FAQ");
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-[#FAF9F7] py-12 px-6 flex justify-center items-center">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-12 relative overflow-hidden">
        {/* Decorative background gradients */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Back Button */}
        <button
          onClick={() => router.push("/home")}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors mb-8 group cursor-pointer"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Ana Sayfaya Dön</span>
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-10 border-b border-gray-100 pb-8">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-4">
            <HelpCircle size={32} className="text-amber-500" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">{t("title")}</h1>
          <p className="text-gray-500 text-sm">{t("subtitle")}</p>
        </div>

        {/* Content */}
        <div className="space-y-4">
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
        <div className="text-center mt-12 border-t border-gray-100 pt-8">
          <p className="text-gray-400 text-xs font-bold mb-4">{t("moreQuestions")}</p>
          <a
            href="mailto:contact@allminiapps.com"
            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-bold transition-colors text-sm"
          >
            <Envelope size={18} />
            <span>contact@allminiapps.com</span>
          </a>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-xs text-gray-400 font-medium">
          &copy; {new Date().getFullYear()} Everything. Tüm Hakları Saklıdır.
        </div>
      </div>
    </div>
  );
}
