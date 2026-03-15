'use client';

import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

export default function UnlockSequence({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 100); // Flash
    const t2 = setTimeout(() => setPhase(2), 2000); // Slam text
    const t3 = setTimeout(() => setPhase(3), 4500); // Fade to credits
    const t4 = setTimeout(() => onComplete(), 11000); // Done

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#050505]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 1 } }}
    >
      {/* Flash */}
      {phase === 0 && (
        <motion.div 
          className="absolute inset-0 bg-white"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      )}

      {/* Phase 1: Forging */}
      {phase === 1 && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0, filter: 'blur(20px)' }}
          animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 1.5 }}
          className="text-center"
        >
          <h2 className="text-3xl md:text-5xl tracking-[0.5em] text-indigo-500 uppercase font-display font-light animate-pulse">
            Forging Destiny
          </h2>
        </motion.div>
      )}

      {/* Phase 2: Slam */}
      {phase === 2 && (
        <motion.div
          initial={{ scale: 4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 150 }}
          className="text-center"
        >
          <h1 className="text-7xl md:text-[10rem] leading-none font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-indigo-600 uppercase tracking-tighter drop-shadow-[0_0_60px_rgba(99,102,241,0.6)]">
            HERO<br/>UNLOCKED
          </h1>
        </motion.div>
      )}

      {/* Phase 3: Credits */}
      {phase === 3 && (
        <motion.div
          initial={{ y: '100vh', opacity: 1 }}
          animate={{ y: '-100vh', opacity: 1 }}
          transition={{ duration: 6, ease: 'linear' }}
          className="text-center space-y-20 max-w-2xl px-6 absolute"
        >
          <h2 className="text-5xl md:text-7xl font-display font-black text-indigo-400 mb-8 tracking-[0.2em] uppercase drop-shadow-lg">
            Origin Data Acquired
          </h2>
          <div className="space-y-16">
            <div>
              <h3 className="text-xs font-mono text-zinc-500 uppercase tracking-[0.3em] mb-4">Directed By</h3>
              <p className="text-4xl font-display font-light text-white">Aura Genesis</p>
            </div>
            <div>
              <h3 className="text-xs font-mono text-zinc-500 uppercase tracking-[0.3em] mb-4">Visual Effects</h3>
              <p className="text-4xl font-display font-light text-white">Gemini Vision</p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
