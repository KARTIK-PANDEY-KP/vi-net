import React, { useEffect, useRef } from 'react';

const PlatformDemo: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    if (videoRef.current) {
      // Make the video play at normal speed
      videoRef.current.playbackRate = 1;
    }
  }, []);

  return (
    <div className="flex justify-center items-center w-full" style={{ marginTop: '30rem' }}>
      {/* Tablet/Device Container */}
      <div className="relative max-w-3xl w-full mx-auto" style={{ maxWidth: '750px' }}>
        {/* Decorative gradient background */}
        <div className="absolute inset-0 -m-10 bg-gradient-to-br from-convrt-purple/20 via-convrt-purple/20 to-convrt-purple/20 rounded-3xl blur-3xl opacity-40"></div>
        
        {/* Device frame */}
        <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/20 backdrop-blur-sm bg-black flex justify-center items-center" style={{ aspectRatio: '4/3' }}>
          {/* Video that completely fills the container */}
          <div className="w-full h-full overflow-hidden">
            <video 
              ref={videoRef}
              autoPlay 
              loop 
              muted 
              playsInline
              className="w-full h-full object-cover object-center"
            >
              <source src="/src/assets/demovid3.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformDemo;
