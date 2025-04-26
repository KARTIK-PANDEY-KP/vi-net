import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CyclingTextProps {
  texts: string[];
  cycleInterval?: number;
}

const CyclingText: React.FC<CyclingTextProps> = ({ texts, cycleInterval = 2000 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Colors for each word
  const colors = [
    'text-blue-500',    // CS - Blue
    'text-green-500',   // Business - Green
    'text-purple-500',  // Marketing - Purple
    'text-red-500',     // Law - Red
    'text-yellow-600'   // Med - Amber
  ];
  
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % texts.length);
    }, cycleInterval);
    
    return () => clearInterval(intervalId);
  }, [texts, cycleInterval]);
  
  return (
    <span className="relative inline-block min-w-28 h-[1em] align-bottom">
      <AnimatePresence mode="wait">
        <motion.span
          key={currentIndex}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.5 }}
          className={`absolute inset-0 ${colors[currentIndex]}`}
        >
          {texts[currentIndex]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

export default CyclingText;