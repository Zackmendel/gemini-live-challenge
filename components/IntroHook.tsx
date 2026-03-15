'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX, Play } from 'lucide-react';

export default function IntroHook({ onComplete }: { onComplete: () => void }) {
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false); // Track if video actually started
  const [showSkip, setShowSkip] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startVideo = async () => {
    if (!videoRef.current) return;
    try {
      await videoRef.current.play();
      setIsPlaying(true);
    } catch (err) {
      console.log("Playback blocked: Interaction required.");
    }
  };

  useEffect(() => {
    // Attempt unmuted autoplay on mount
    startVideo();

    const skipTimer = setTimeout(() => setShowSkip(true), 3000);
    return () => clearTimeout(skipTimer);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden">
      <video
        ref={videoRef}
        playsInline
        preload="auto"
        muted={isMuted}
        onEnded={onComplete}
        onPlay={() => setIsPlaying(true)}
        className="w-full h-full object-cover"
      >
        <source src="/aura_genesis_intro.mp4" type="video/mp4" />
      </video>

      {/* THE GHOST TRIGGER: Captures the first click to enable audio/play */}
      <AnimatePresence>
        {!isPlaying && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={startVideo}
            className="absolute inset-0 z-[110] bg-black/20 flex flex-col items-center justify-center cursor-pointer group"
          >
            <div className="p-6 rounded-full bg-white/10 backdrop-blur-md border border-white/20 group-hover:scale-110 transition-transform">
              <Play className="w-8 h-8 text-white fill-white" />
            </div>
            <p className="mt-4 text-white/60 font-display tracking-[0.2em] uppercase text-xs animate-pulse">
              Click to Initialize
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Cinematic Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 pointer-events-none" />
      
      {/* Controls */}
      <div className="absolute bottom-12 left-12 right-12 flex justify-between items-center z-[120]">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsMuted(!isMuted);
          }}
          className="p-3 bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-white/70 hover:text-white transition-all"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>

        <AnimatePresence>
          {showSkip && (
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={onComplete}
              className="px-8 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full text-white text-sm font-display tracking-widest uppercase transition-all group"
            >
              Skip Induction
              <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Decorative corners (Indigo Accents) */}
      <div className="absolute top-8 left-8 w-12 h-12 border-t-2 border-l-2 border-indigo-500/30 pointer-events-none" />
      <div className="absolute top-8 right-8 w-12 h-12 border-t-2 border-r-2 border-indigo-500/30 pointer-events-none" />
      <div className="absolute bottom-8 left-8 w-12 h-12 border-b-2 border-l-2 border-indigo-500/30 pointer-events-none" />
      <div className="absolute bottom-8 right-8 w-12 h-12 border-b-2 border-r-2 border-indigo-500/30 pointer-events-none" />
    </div>
  );
}
