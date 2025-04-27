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
    <section className="relative min-h-screen pt-20 pb-0 overflow-hidden bg-[#F9F6F3]">
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
            className="inline-flex items-center px-4 py-2 rounded-full bg-project-dave-purple/10 text-project-dave-purple mb-6"
          >
            <Zap className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium font-inter tracking-wide">
              Connect with Field Experts
            </span>
          </motion.div> */}

          <motion.h1
            variants={itemVariants}
            className="text-center font-inter font-bold text-4xl md:text-5xl lg:text-7xl tracking-tight max-w-4xl mx-auto mb-6 text-project-dave-dark-blue"
          >
            <div className="flex justify-center items-center whitespace-nowrap">
              F**k
              <CyclingText texts={[
                "Networking",
                "Outreach",
                "Cold Emails",
                "Follow-ups",
                "Job Hunting",
              ]} />
            </div>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="font-inter text-2xl md:text-3xl max-w-3xl mx-auto mb-8 leading-relaxed"
          >
            <span className="font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">Cut the crap.</span>{" "}
            <span className="font-semibold text-project-dave-dark-blue">Focus on real human interactions.</span>
          </motion.p>

          {showCTA && (
            <motion.div
              className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-16"
            >
              <Link
                to="/onboarding"
                className="button-primary flex items-center group font-inter font-medium"
              >
                Join Waitlist
                <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>
          )}

          {/* Modern Platform Showcase with Why Content Integrated */}
          <div className="mt-12 relative mb-0">
            {/* Decorative background effect */}
            <div className="absolute inset-0 -m-10 bg-gradient-to-br from-project-dave-purple/20 via-project-dave-purple/20 to-project-dave-purple/20 rounded-3xl blur-3xl opacity-40"></div>
            
            {/* Device frame effect - Increased size */}
            <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border border-white/20 backdrop-blur-sm bg-black/5 mx-auto"
                 style={{ maxWidth: '1200px', padding: '12px', margin: '0 auto' }}>
              {/* Inner frame effect */}
              <div className="relative z-10 rounded-[1.75rem] overflow-hidden bg-white/2 border border-white/10 shadow-inner">
                <div className="relative pb-[56.25%] h-0 overflow-hidden">
                  <video 
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                    preload="metadata"
                    className="absolute top-0 left-0 w-full h-full object-cover sm:object-contain"
                  >
                    <source src="/demovid3.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            </div>
            
            {/* Why Project Dave Content Integrated */}
            <div className="w-full mx-auto mt-20">
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-center mb-12 tracking-tight bg-clip-text">
                <span className="text-project-dave-dark-blue">Why </span>
                <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">project dave</span>
                <span className="text-project-dave-dark-blue">?</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 px-10">
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  viewport={{ once: true }}
                  className="flex flex-col items-center justify-center bg-gradient-to-b from-white to-purple-50/30 rounded-3xl shadow-xl px-16 py-14 min-h-[260px] hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 w-full"
                >
                  <h3 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Networking</h3>
                  <p className="text-gray-700 text-lg text-center leading-relaxed">Spending hours at events for a single lead is inefficient and draining.</p>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  viewport={{ once: true }}
                  className="flex flex-col items-center justify-center bg-gradient-to-b from-white to-purple-50/30 rounded-3xl shadow-xl px-16 py-14 min-h-[260px] hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 w-full"
                >
                  <h3 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Outreach</h3>
                  <p className="text-gray-700 text-lg text-center leading-relaxed">Generic messages fail to engage; personalization at scale is impossible manually.</p>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  viewport={{ once: true }}
                  className="flex flex-col items-center justify-center bg-gradient-to-b from-white to-purple-50/30 rounded-3xl shadow-xl px-16 py-14 min-h-[260px] hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 w-full"
                >
                  <h3 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Cold Emails</h3>
                  <p className="text-gray-700 text-lg text-center leading-relaxed">Dreaming up catchy subject lines and follow-ups wastes precious time.</p>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  viewport={{ once: true }}
                  className="flex flex-col items-center justify-center bg-gradient-to-b from-white to-purple-50/30 rounded-3xl shadow-xl px-16 py-14 min-h-[260px] hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 w-full"
                >
                  <h3 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Follow-ups</h3>
                  <p className="text-gray-700 text-lg text-center leading-relaxed">Tracking responses and reminders manually leads to missed opportunities.</p>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  viewport={{ once: true }}
                  className="flex flex-col items-center justify-center bg-gradient-to-b from-white to-purple-50/30 rounded-3xl shadow-xl px-16 py-14 min-h-[260px] hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 w-full"
                >
                  <h3 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Job Hunting</h3>
                  <p className="text-gray-700 text-lg text-center leading-relaxed">Applying indiscriminately clogs your week with rejections instead of conversation.</p>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  viewport={{ once: true }}
                  className="flex flex-col items-center justify-center bg-gradient-to-b from-white to-purple-50/30 rounded-3xl shadow-xl px-16 py-14 min-h-[260px] hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 w-full"
                >
                  <h3 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Sales Clients</h3>
                  <p className="text-gray-700 text-lg text-center leading-relaxed">We'll find and close sales for you. So you can focus on real human connections.</p>
                </motion.div>
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
