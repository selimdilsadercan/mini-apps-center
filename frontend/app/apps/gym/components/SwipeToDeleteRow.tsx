"use client";

import { Trash } from "@phosphor-icons/react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import type { ReactNode } from "react";

export default function SwipeToDeleteRow({
  onDelete,
  children,
  className = "",
}: {
  onDelete: () => void;
  children: ReactNode;
  className?: string;
}) {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [0, 40], [0, 1]);

  return (
    <motion.div
      initial={false}
      exit={{ opacity: 0, x: 20, height: 0, overflow: "hidden" }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`relative overflow-hidden ${className}`}
    >
      <motion.div
        style={{ opacity }}
        className="absolute inset-0 flex items-center justify-start px-6 bg-red-500"
      >
        <div className="flex flex-col items-center gap-0.5 text-white">
          <Trash size={20} weight="fill" />
          <span className="text-[8px] font-black uppercase tracking-wider">Sil</span>
        </div>
      </motion.div>

      <motion.div
        drag="x"
        style={{ x }}
        dragConstraints={{ left: 0, right: 100 }}
        dragElastic={0.05}
        onDragEnd={(_, info) => {
          if (info.offset.x > 80) {
            onDelete();
          }
          x.set(0);
        }}
        className="relative z-10"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
