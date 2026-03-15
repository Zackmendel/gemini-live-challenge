'use client';

import { useState } from 'react';
import Chat from '@/components/Chat';
import IntroHook from '@/components/IntroHook';

export default function Home() {
  const [showIntro, setShowIntro] = useState(true);

  return (
    <main className="min-h-screen">
      {showIntro ? (
        <IntroHook onComplete={() => setShowIntro(false)} />
      ) : (
        <Chat />
      )}
    </main>
  );
}
