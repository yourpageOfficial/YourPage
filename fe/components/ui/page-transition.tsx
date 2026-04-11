"use client";

import { motion } from "framer-motion";
import { slideUp } from "@/lib/motion-variants";

export function PageTransition({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div initial="hidden" animate="visible" variants={slideUp} className={className}>
      {children}
    </motion.div>
  );
}
