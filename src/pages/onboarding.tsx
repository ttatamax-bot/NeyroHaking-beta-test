import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

const steps = [
  {
    title: "Техники",
    body: "Каждый день — шесть техник. Планер, нейровизуализация, медитация, прогулка, хобби и сон. Выполняй — получай ключи и потенциал.",
    bg: "techniques"
  },
  {
    title: "Путь",
    body: "Здесь твой прогресс. Потенциал — мера твоего развития. Ключи — внутренняя валюта. Серия — твоя последовательность.",
    bg: "path"
  },
  {
    title: "Академия",
    body: "Статьи о нейробиологии и психологии. Открывай их за ключи. Консультации и личное ведение — здесь.",
    bg: "academy"
  }
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [, setLocation] = useLocation();

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      setLocation("/onboarding/email");
    }
  };

  return (
    <div className="w-full min-h-screen relative flex justify-center bg-base overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={steps[step].bg}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 z-0 bg-base"
        />
      </AnimatePresence>

      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 25 }}
        className="fixed bottom-[90px] w-[calc(100%-32px)] bg-surface-2 rounded-[20px] p-6 shadow-[0_-8px_32px_rgba(0,0,0,0.4)] border border-[rgba(255,255,255,0.08)] z-20"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="title-m text-primary">{steps[step].title}</h2>
          <span className="label text-tertiary">{step + 1}/{steps.length}</span>
        </div>

        <p className="body text-secondary mb-6 h-[80px]">
          {steps[step].body}
        </p>

        <button
          onClick={handleNext}
          className="btn-shimmer w-full h-[48px] bg-blue-core text-primary rounded-full title-s active:opacity-90"
        >
          {step === steps.length - 1 ? "Продолжить" : "Далее"}
        </button>
      </motion.div>
    </div>
  );
}
