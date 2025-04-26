import React from 'react';
import Navbar from '@/components/Navbar';

const Why = () => {
  return (
    <div>
      <Navbar />
      <div className="min-h-screen flex flex-col bg-white">
        <div className="flex-1 flex flex-col justify-center items-center">
          <h1 className="text-6xl md:text-7xl font-extrabold text-convrt-dark-blue text-center mb-14 mt-8 tracking-tight">Why?</h1>
          <div className="w-full max-w-7xl px-4 mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
              <div className="flex flex-col items-center justify-center bg-white rounded-2xl shadow-lg px-6 py-8 min-h-[260px]">
                <h2 className="text-xl font-bold mb-2 text-convrt-dark-blue">Networking</h2>
                <p className="text-gray-600 text-center">Spending hours at events for a single lead is inefficient and draining.</p>
              </div>
              <div className="flex flex-col items-center justify-center bg-white rounded-2xl shadow-lg px-6 py-8 min-h-[260px]">
                <h2 className="text-xl font-bold mb-2 text-convrt-dark-blue">Outreach</h2>
                <p className="text-gray-600 text-center">Generic messages fail to engage; personalization at scale is impossible manually.</p>
              </div>
              <div className="flex flex-col items-center justify-center bg-white rounded-2xl shadow-lg px-6 py-8 min-h-[260px]">
                <h2 className="text-xl font-bold mb-2 text-convrt-dark-blue">Cold Emails</h2>
                <p className="text-gray-600 text-center">Dreaming up catchy subject lines and follow-ups wastes precious time.</p>
              </div>
              <div className="flex flex-col items-center justify-center bg-white rounded-2xl shadow-lg px-6 py-8 min-h-[260px]">
                <h2 className="text-xl font-bold mb-2 text-convrt-dark-blue">Follow-ups</h2>
                <p className="text-gray-600 text-center">Tracking responses and reminders manually leads to missed opportunities.</p>
              </div>
              <div className="flex flex-col items-center justify-center bg-white rounded-2xl shadow-lg px-6 py-8 min-h-[260px]">
                <h2 className="text-xl font-bold mb-2 text-convrt-dark-blue">Job Hunting</h2>
                <p className="text-gray-600 text-center">Applying indiscriminately clogs your week with rejections instead of conversation.</p>
              </div>
            </div>
          </div>
        </div>
        <footer className="bg-white py-8 border-t border-gray-100 text-center text-gray-400 text-sm w-full">
          © 2025 vi-net. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default Why;