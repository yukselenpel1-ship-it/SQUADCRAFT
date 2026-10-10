'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface BlurTextProps {
  text: string;
  delay?: number;
  className?: string;
  animateBy?: 'words' | 'letters';
  direction?: 'top' | 'bottom';
  onAnimationComplete?: () => void;
}

export function BlurText({
  text = '',
  delay = 50,
  className = '',
  animateBy = 'words',
  direction = 'top',
  onAnimationComplete,
}: BlurTextProps) {
  const elements = animateBy === 'words' ? text.split(' ') : text.split('');
  const ref = useRef<HTMLParagraphElement>(null);
  const inView = useInView(ref, { once: true });

  return (
    <p ref={ref} className={`flex flex-wrap ${className}`}>
      {elements.map((element, index) => (
        <motion.span
          key={index}
          initial={{
            filter: 'blur(10px)',
            opacity: 0,
            y: direction === 'top' ? -18 : 18,
          }}
          animate={
            inView
              ? {
                  filter: 'blur(0px)',
                  opacity: 1,
                  y: 0,
                }
              : {}
          }
          transition={{
            duration: 0.45,
            delay: (index * delay) / 1000,
            ease: [0.25, 0.25, 0, 1],
          }}
          onAnimationComplete={
            index === elements.length - 1 ? onAnimationComplete : undefined
          }
          className="inline-block whitespace-pre will-change-[transform,filter,opacity]"
        >
          {element}
          {animateBy === 'words' && index < elements.length - 1 && '\u00A0'}
        </motion.span>
      ))}
    </p>
  );
}
