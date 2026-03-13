'use client';

import { motion } from 'motion/react';

const traits = [
  { key: 'TRUE_NAME', label: 'True Name' },
  { key: 'AGE_GROUP', label: 'Age Group' },
  { key: 'LINEAGE', label: 'Lineage' },
  { key: 'CELESTIAL_ALIGNMENT', label: 'Celestial Alignment' },
  { key: 'SPIRIT_CODE', label: 'Spirit Code' },
  { key: 'APTITUDE', label: 'Aptitude' },
  { key: 'TEMPERAMENT', label: 'Temperament' },
];

export default function HeroMatrix({ matrix }: { matrix: Record<string, string> }) {
  return (
    <div className="space-y-4 flex-1 overflow-y-auto pr-2">
      {traits.map(({ key, label }) => {
        const value = matrix[key];
        const isFilled = !!value;

        return (
          <div key={key} className="relative">
            <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
              {label}
            </div>
            <div
              className={`p-3 rounded-lg border ${
                isFilled
                  ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-200'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-600 border-dashed'
              }`}
            >
              {isFilled ? (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="font-medium"
                >
                  {value}
                </motion.div>
              ) : (
                <span className="italic text-sm">Awaiting input...</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
