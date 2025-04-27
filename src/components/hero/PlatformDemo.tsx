import React, { useRef } from 'react';
import demoVideo from "../../public/demovid5.mp4";
import demoGif from "../../public/demovid.gif";

const PlatformDemo: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div className="relative max-w-5xl mx-auto" style={{ marginTop: '30rem' }}> {/* Using MASSIVE margin to push way down */}
      {/* Decorative gradient background */}
      <div className="absolute inset-0 -m-10 bg-gradient-to-br from-project-dave-purple/20 via-project-dave-purple/20 to-project-dave-purple/20 rounded-3xl blur-3xl opacity-40"></div>
      
      {/* Main video container */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/20 backdrop-blur-sm bg-black">
        {/* Video that completely fills the container */}
        <div className="w-full h-full">
          <video 
            ref={videoRef}
            autoPlay 
            loop 
            muted 
            playsInline
            className="w-full h-full object-cover object-center"
            style={{ display: 'block', width: '110%', minHeight: '500px' }}
          >
            <source src={demoVideo} type="video/mp4" />
            <source src={demoGif} type="image/gif" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </div>
  );
};

export default PlatformDemo;
