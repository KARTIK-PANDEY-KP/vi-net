import React from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import AnimatedBackground from '@/components/AnimatedBackground';

const WaitlistSuccess = () => {
  return (
    <div>
      <Navbar />
      <Hero />
      <section className="relative min-h-screen pt-20 pb-32 overflow-hidden bg-[#F9F6F3]">
        <AnimatedBackground />
        <div className="flex flex-col items-center justify-center pt-32">
          <div className="rounded-xl bg-white shadow p-8 flex flex-col items-center">
            <h1 className="text-3xl font-bold mb-4 text-project-dave-dark-blue">Successfully Joined Waitlist!</h1>
            <p className="text-lg text-gray-700">Thank you for joining the waitlist. We will contact you soon!</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default WaitlistSuccess;
