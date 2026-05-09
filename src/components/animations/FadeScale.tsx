/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { DURATIONS, EASINGS } from '../../lib/animations';

interface FadeScaleProps {
  children: React.ReactNode;
  delay?: number; // in milliseconds
  className?: string;
}

/**
 * FadeScale Component
 * 
 * Ported from Flutter premium animation logic.
 * Performs a subtle scale from 0.96 to 1.0 while fading in.
 */
export const FadeScale: React.FC<FadeScaleProps> = ({ 
  children, 
  delay = 0, 
  className = "" 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: DURATIONS.NORMAL,
        delay: delay / 1000, // Convert ms to s for Framer Motion
        ease: EASINGS.PREMIUM,
        // Using a slightly more active transition for the scale to match the 'springCurve' feel
        scale: {
          type: "spring",
          damping: 20,
          stiffness: 120,
          delay: delay / 1000,
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
