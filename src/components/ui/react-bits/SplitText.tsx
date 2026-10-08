'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  wordClassName?: string;
}

export function SplitText({
  text,
  className = '',
  delay = 0.05,
  wordClassName = '',
}: SplitTextProps) {
  const words = text.split(' ');

  return (
    <span className={`inline-block overflow-hidden ${className}`}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden mr-[0.25em] last:mr-0">
          <motion.span
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: '0%', opacity: 1 }}
            transition={{
              duration: 0.65,
              delay: delay + i * 0.08,
              ease: [0.16, 1, 0.3, 1], // Editorial athletic ease
            }}
            className={`inline-block ${wordClassName}`}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
