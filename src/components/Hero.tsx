import React, { useRef } from "react";
import AnimatedBackground from "./AnimatedBackground";
import { ArrowRight, Zap } from "lucide-react";
import { motion } from "framer-motion";
import PlatformDemo from "./hero/PlatformDemo";
import StatsSection from "./hero/StatsSection";
import CyclingText from "./CyclingText"; // Import the CyclingText component
import { Link } from "react-router-dom";

const Hero = ({ showCTA = true }: { showCTA?: boolean }) => {
  const statsRef = useRef<HTMLDivElement>(null);
  const demoRef = useRef<HTMLDivElement>(null);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 40, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <section className="relative min-h-screen pt-20 pb-32 overflow-hidden bg-[#F9F6F3]">
      <AnimatedBackground />

      <div className="container-section relative z-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="max-w-5xl mx-auto text-center"
        >
          {/* <motion.div
            variants={itemVariants}
            className="inline-flex items-center px-4 py-2 rounded-full bg-convrt-purple/10 text-convrt-purple mb-6"
          >
            <Zap className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium font-inter tracking-wide">
              Connect with Field Experts
            </span>
          </motion.div> */}

          <motion.h1
            variants={itemVariants}
            className="flex justify-center items-center whitespace-nowrap font-inter font-bold text-4xl md:text-5xl lg:text-7xl tracking-tight max-w-4xl mx-auto mb-6 text-convrt-dark-blue"
          >
            F**k&nbsp;
            <CyclingText texts={[
              "Networking",
              "Outreach",
              "Cold Emails",
              "Follow-ups",
              "Job Hunting",
            ]} />
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="font-inter text-xl text-convrt-dark-blue/80 max-w-3xl mx-auto mb-8 leading-relaxed"
          >
            Cut the crap. Focus on real human interactions.
          </motion.p>

          {showCTA && (
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-16"
            >
              {/* <Link
                to="/onboarding"
                className="button-primary flex items-center group font-inter font-medium"
              >
                Get Started */}
              <Link
                to="/onboarding"
                className="button-primary flex items-center group font-inter font-medium"
              >
                Join Waitlist
                <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link to="/why" className="button-outline font-inter">
                Why?
              </Link>
            </motion.div>
          )}

          {/* Modern Platform Showcase */}
          <div className="mt-24 relative">
            {/* Decorative background effect */}
            <div className="absolute inset-0 -m-6 bg-gradient-to-br from-convrt-purple/20 via-convrt-purple/20 to-convrt-purple/20 rounded-3xl blur-3xl opacity-40"></div>
            
            {/* Device frame effect */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/20 backdrop-blur-sm bg-black/5 mx-auto" style={{ maxWidth: '900px', padding: '16px' }}>
              {/* Inner frame effect */}
              <div className="relative z-10 rounded-2xl overflow-hidden bg-white/2 border border-white/10 shadow-inner">
                <video 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  className="w-full h-full object-cover"
                  style={{ display: 'block', width: '100%', minHeight: '500px' }}
                >
                  <source src="/src/assets/demovid3.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>

          {/* Stats Section - Enhanced with better styling and icons */}
          {/* <StatsSection statsRef={statsRef} /> */}
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
