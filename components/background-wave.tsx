"use client";
import { motion } from "framer-motion";

export const BackgroundWave = () => {
  return (
    <motion.video
      src="/wave-loop.mp4"
      autoPlay
      muted
      loop
      controls={false}
      className="fixed inset-0 w-full h-full grayscale object-cover z-[-1] pointer-events-none opacity-5"
    />
  );
};
