import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CyclingTextProps {
  texts: string[];
  cycleInterval?: number;
}

const CyclingText: React.FC<CyclingTextProps> = ({ texts, cycleInterval = 2000 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Find the longest text to set a fixed width
  const longestTextLength = useMemo(() => {
    return Math.max(...texts.map(text => text.length));
  }, [texts]);
  
  // Colors for each word
  const colors = [
    'text-blue-500',    // Networking
    'text-green-500',   // Outreach
    'text-purple-500',  // Cold Emails
    'text-red-500',     // Follow-ups
    'text-yellow-600',  // Job Hunting
    'text-indigo-500',  // Resume Building
    'text-pink-500',    // Interview Prep
    'text-teal-500'     // Career Advice
  ];
  
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % texts.length);
    }, cycleInterval);
    
    return () => clearInterval(intervalId);
  }, [texts, cycleInterval]);
  
  return (
    <span 
      className="relative inline-block align-bottom text-center"
      style={{ 
        minWidth: `${longestTextLength * 0.6}em`, 
        display: 'inline-block',
        marginLeft: '-0.15em'
      }}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={currentIndex}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.5 }}
          className={`block w-full text-center ${colors[currentIndex]}`}
        >
          {texts[currentIndex]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

export default CyclingText;