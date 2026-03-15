'use client';

import { motion } from 'motion/react';

const traits = [
  { key: 'TRUE_NAME', label: 'True Name' },
  { key: 'GENDER', label: 'Gender' },
  { key: 'AGE_GROUP', label: 'Age Group' },
  { key: 'LINEAGE', label: 'Lineage' },
  { key: 'CELESTIAL_ALIGNMENT', label: 'Celestial Alignment' },
  { key: 'SPIRIT_CODE', label: 'Spirit Code' },
  { key: 'APTITUDE', label: 'Aptitude' },
  { key: 'TEMPERAMENT', label: 'Temperament' },
];

export default function HeroMatrix({ matrix }: { matrix: Record<string, string> }) {
  return (
    <div className="space-y-5 flex-1 overflow-y-auto pr-2">
      {traits.map(({ key, label }) => {
        const value = matrix[key];
        const isFilled = !!value;

        return (
          <div key={key} className="relative group">
            <div className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-[0.2em] mb-1.5 flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${isFilled ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]' : 'bg-zinc-700'}`} />
              {label}
            </div>
            <div
              className={`p-3.5 rounded-xl border transition-all duration-500 ${
                isFilled
                  ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-100 shadow-[inset_0_0_20px_rgba(99,102,241,0.05)]'
                  : 'bg-white/5 border-white/10 text-zinc-600 border-dashed group-hover:border-white/20'
              }`}
            >
              {isFilled ? (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="font-mono text-sm tracking-wide"
                >
                  {value}
                </motion.div>
              ) : (
                <span className="font-mono text-xs tracking-widest uppercase opacity-50">Awaiting...</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
