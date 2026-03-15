'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX } from 'lucide-react';

export default function IntroHook({ onComplete }: { onComplete: () => void }) {
  const [isMuted, setIsMuted] = useState(true);
  const [showSkip, setShowSkip] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const playVideo = async () => {
      const video = videoRef.current;
      if (!video) return;

      try {
        video.muted = true; // Always start muted for autoplay
        await video.play();
      } catch (err) {
        console.log("Autoplay failed:", err);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(playVideo, 100);
    const skipTimer = setTimeout(() => setShowSkip(true), 3000);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(skipTimer);
    };
  }, []);

  const handleEnded = () => {
    onComplete();
  };

  const skipIntro = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        preload="auto"
        muted={isMuted}
        onEnded={handleEnded}
        onError={(e) => console.error("Video loading error:", e)}
        className="w-full h-full object-cover"
      >
        <source src="./aura_genesis_intro.mp4" type="video/mp4" />
        <source src="/aura_genesis_intro.mp4" type="video/mp4" />
      </video>

      {/* Manual Initiation Hook (if blocked) */}
      <div 
        className="absolute inset-0 z-[1] cursor-pointer" 
        onClick={() => {
          if (videoRef.current) videoRef.current.play();
        }}
      />
      
      {/* Cinematic Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 pointer-events-none" />
      
      <AnimatePresence>
        {showSkip && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onClick={skipIntro}
            className="absolute bottom-12 right-12 z-10 px-8 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full text-white text-sm font-display tracking-widest uppercase transition-all hover:scale-105 active:scale-95 group"
          >
            Skip Induction
            <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
          </motion.button>
        )}
      </AnimatePresence>

      <button
        onClick={(e) => {
          e.stopPropagation();
          const nextMuted = !isMuted;
          setIsMuted(nextMuted);
          if (videoRef.current) {
            videoRef.current.muted = nextMuted;
          }
        }}
        className="absolute bottom-12 left-12 z-10 p-3 bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-white/70 hover:text-white transition-all"
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>

      {/* Decorative corners */}
      <div className="absolute top-8 left-8 w-12 h-12 border-t-2 border-l-2 border-indigo-500/30 pointer-events-none" />
      <div className="absolute top-8 right-8 w-12 h-12 border-t-2 border-r-2 border-indigo-500/30 pointer-events-none" />
      <div className="absolute bottom-8 left-8 w-12 h-12 border-b-2 border-l-2 border-indigo-500/30 pointer-events-none" />
      <div className="absolute bottom-8 right-8 w-12 h-12 border-b-2 border-r-2 border-indigo-500/30 pointer-events-none" />
    </div>
  );
}
