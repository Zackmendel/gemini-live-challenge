'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { GoogleGenAI } from '@google/genai';
import { Loader2, Upload, PlayCircle, Copy, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

// Helper to convert raw PCM to WAV URL
function createWavUrl(base64Data: string, sampleRate = 24000): string {
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const buffer = new ArrayBuffer(44 + bytes.length);
  const view = new DataView(buffer);

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + bytes.length, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, bytes.length, true);

  const dataArray = new Uint8Array(buffer, 44);
  dataArray.set(bytes);

  const blob = new Blob([buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

export default function FinalOutput({ text, isRevealed }: { text: string, isRevealed?: boolean }) {
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [isGeneratingHero, setIsGeneratingHero] = useState(false);
  
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isPreparingSimulation, setIsPreparingSimulation] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Extract data
  const nameMatch = text.match(/\*\*1\.\s*The Hero's Name\*\*:\s*([^\n]+)/i);
  const heroName = nameMatch ? nameMatch[1].trim() : 'Unknown Hero';

  const heroPromptMatch = text.match(/\*\*3\.\s*The Image Generation Prompt\*\*:\s*([\s\S]*?)(?=\*\*4\.)/i);
  const heroPrompt = heroPromptMatch ? heroPromptMatch[1].replace(/```text|```/g, '').trim() : '';

  const hookMatch = text.match(/\*\*4\.\s*The Hook\*\*:\s*([\s\S]*?)(?=\*\*5\.)/i);
  const hook = hookMatch ? hookMatch[1].trim() : '';

  const compPromptMatch = text.match(/\*\*6\.\s*The Composition Prompt\*\*:\s*([\s\S]*?)(?=\*\*7\.)/i);
  const compPrompt = compPromptMatch ? compPromptMatch[1].replace(/```text|```/g, '').trim() : '';

  const storyMatch = text.match(/\*\*7\.\s*The Hero Story\*\*:\s*([\s\S]*?)(?=\*\*8\.)/i);
  const story = storyMatch ? storyMatch[1].trim() : '';

  const motionMatch = text.match(/\*\*8\.\s*The Motion Genesis\*\*:\s*([\s\S]*?)(?=\[VIDEO_UPLOAD_PLACEHOLDER\]|$)/i);
  const motionPrompt = motionMatch ? motionMatch[1].replace(/```text|```/g, '').trim() : '';

  useEffect(() => {
    if (isRevealed) {
      const container = document.getElementById('chat-scroll-container');
      const finalOutputElement = document.getElementById('final-output-container');
      
      if (container && finalOutputElement) {
        // Scroll to top of final output immediately
        container.scrollTo({
          top: finalOutputElement.offsetTop - 40,
          behavior: 'smooth'
        });
        
        let animationFrameId: number;
        let isCancelled = false;
        
        const cancelScroll = () => { isCancelled = true; };
        
        container.addEventListener('wheel', cancelScroll, { passive: true });
        container.addEventListener('touchstart', cancelScroll, { passive: true });
        container.addEventListener('mousedown', cancelScroll, { passive: true });

        let startTime: number | null = null;
        const duration = 25000; // 25 seconds for a slow cinematic pan

        const step = (timestamp: number) => {
          if (isCancelled) return;
          if (!startTime) startTime = timestamp;
          const progress = timestamp - startTime;
          const percentage = Math.min(progress / duration, 1);
          
          // Easing function (easeInOutQuad)
          const easeInOutQuad = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
          const ease = easeInOutQuad(percentage);

          const targetScrollTop = container.scrollHeight - container.clientHeight;
          const startScrollTop = finalOutputElement.offsetTop - 40;
          const distance = targetScrollTop - startScrollTop;

          if (distance > 0) {
            container.scrollTop = startScrollTop + (distance * ease);
          }

          if (progress < duration) {
            animationFrameId = window.requestAnimationFrame(step);
          }
        };

        // Start the cinematic pan after 4 seconds
        const timeoutId = setTimeout(() => {
          if (!isCancelled) {
            animationFrameId = window.requestAnimationFrame(step);
          }
        }, 4000);

        return () => {
          isCancelled = true;
          clearTimeout(timeoutId);
          if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
          container.removeEventListener('wheel', cancelScroll);
          container.removeEventListener('touchstart', cancelScroll);
          container.removeEventListener('mousedown', cancelScroll);
        };
      }
    }
  }, [isRevealed]);

  useEffect(() => {
    const generateHeroImage = async () => {
      if (heroPrompt && !heroImage && !isGeneratingHero) {
        setIsGeneratingHero(true);
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: heroPrompt }] },
            config: {
              imageConfig: { aspectRatio: '3:4', imageSize: '1K' }
            }
          });
          
          for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
              setHeroImage(`data:image/png;base64,${part.inlineData.data}`);
              break;
            }
          }
        } catch (error) {
          console.error('Failed to generate hero image:', error);
        } finally {
          setIsGeneratingHero(false);
        }
      }
    };

    generateHeroImage();
  }, [heroPrompt, heroImage, isGeneratingHero]);

  const copyToClipboard = (textToCopy: string, id: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInitialize = async () => {
    if (!audioSrc && story) {
      setIsPreparingSimulation(true);
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-preview-tts',
          contents: [{ parts: [{ text: `${heroName}. ${story}` }] }],
          config: {
            responseModalities: ['AUDIO' as any],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Charon' } // Deep, cinematic voice
              }
            }
          }
        });
        
        const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
        if (inlineData?.data) {
          if (inlineData.mimeType === 'audio/wav') {
            setAudioSrc(`data:audio/wav;base64,${inlineData.data}`);
          } else {
            setAudioSrc(createWavUrl(inlineData.data, 24000));
          }
        }
      } catch (error) {
        console.error('TTS generation failed:', error);
      } finally {
        setIsPreparingSimulation(false);
        setIsSimulating(true);
      }
    } else {
      setIsSimulating(true);
    }
  };

  useEffect(() => {
    if (isSimulating && audioRef.current) {
      audioRef.current.play().catch(e => console.error('Audio autoplay failed:', e));
    }
  }, [isSimulating, audioSrc]);

  if (isSimulating && videoFile) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black overflow-hidden flex items-center justify-center"
      >
        {/* Background Video */}
        <video 
          src={URL.createObjectURL(videoFile)} 
          autoPlay 
          loop 
          muted 
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        
        {/* TTS Audio */}
        {audioSrc && (
          <audio 
            ref={audioRef} 
            src={audioSrc} 
            onEnded={() => setIsSimulating(false)} 
            onLoadedMetadata={(e) => {
              const duration = e.currentTarget.duration;
              if (duration && duration > 0 && duration !== Infinity) {
                setAudioDuration(duration);
              }
            }}
          />
        )}

        {/* Scrolling Text */}
        {(!audioSrc || audioDuration) && (
          <motion.div
            initial={{ y: '50vh' }}
            animate={{ y: 'calc(-100% + 50vh)' }}
            transition={{ duration: audioDuration || 90, ease: 'linear' }}
            className="absolute top-0 inset-x-0 flex flex-col items-center justify-start pointer-events-none z-10"
          >
            <div className="max-w-5xl px-8 text-center">
              <h2 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500 uppercase tracking-[0.2em] mb-16 drop-shadow-2xl">
                {heroName}
              </h2>
              <div className="prose prose-invert prose-2xl prose-p:leading-relaxed text-zinc-200 font-serif text-center drop-shadow-2xl mx-auto">
                <ReactMarkdown>{story}</ReactMarkdown>
              </div>
            </div>
          </motion.div>
        )}

        {/* Abort Button */}
        <button 
          onClick={() => setIsSimulating(false)}
          className="absolute top-8 right-8 z-50 p-4 bg-red-500/20 hover:bg-red-500/40 text-red-100 rounded-full backdrop-blur-md transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </motion.div>
    );
  }

  return (
    <div id="final-output-container" className="space-y-16 bg-black/40 backdrop-blur-3xl p-6 md:p-16 rounded-[2.5rem] border border-white/10 relative overflow-hidden mt-12 shadow-2xl">
      {/* 1. The Hero Name */}
      <div className="text-center relative z-10">
        <motion.h1 
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', bounce: 0.5, duration: 1 }}
          className="text-6xl md:text-8xl font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-500 uppercase tracking-[0.15em] drop-shadow-2xl"
        >
          {heroName}
        </motion.h1>
        <div className="h-0.5 w-48 bg-gradient-to-r from-transparent via-indigo-500 to-transparent mx-auto mt-8 rounded-full opacity-50" />
      </div>

      {/* 2. Hero Image & Prompt */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 relative z-10">
        <div className="aspect-[3/4] rounded-3xl overflow-hidden bg-white/5 border border-white/10 relative shadow-2xl flex items-center justify-center group">
          {isGeneratingHero ? (
            <div className="flex flex-col items-center gap-4 text-zinc-500">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
              <span className="text-xs font-mono uppercase tracking-[0.2em]">Forging Portrait...</span>
            </div>
          ) : heroImage ? (
            <img src={heroImage} alt={heroName} className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105" />
          ) : (
            <span className="text-zinc-600 font-mono text-sm uppercase tracking-widest">Image generation failed</span>
          )}
        </div>
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 flex flex-col shadow-xl">
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10">
            <h3 className="text-indigo-400 font-mono font-bold tracking-[0.2em] uppercase text-xs flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
              Hero Generation Prompt
            </h3>
            <button 
              onClick={() => copyToClipboard(heroPrompt, 'hero')}
              className="p-2.5 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white transition-all duration-300"
            >
              {copiedId === 'hero' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
            <p className="text-zinc-300 font-mono text-[13px] leading-relaxed whitespace-pre-wrap opacity-80">
              {heroPrompt}
            </p>
          </div>
        </div>
      </div>

      {/* 3. The Hook */}
      <div className="text-center px-4 relative z-10 py-12">
        <h3 className="text-indigo-500 font-mono font-bold tracking-[0.2em] uppercase text-xs mb-8">The Hook</h3>
        <p className="text-3xl md:text-5xl font-display italic text-white leading-tight drop-shadow-lg max-w-5xl mx-auto font-light">
          &quot;{hook}&quot;
        </p>
      </div>

      {/* 4. Hook Image (Composition) & Prompt */}
      <div className="flex flex-col gap-10 relative z-10">
        <div className="w-full aspect-video rounded-3xl overflow-hidden bg-white/5 border border-white/10 relative shadow-2xl group">
          {heroImage ? (
            <>
              <img src={heroImage} alt="Background" className="absolute inset-0 w-full h-full object-cover opacity-30 blur-xl scale-110 transition-transform duration-1000 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-10 md:p-20 text-center z-10">
                <h2 className="text-5xl md:text-7xl font-display font-black text-white uppercase tracking-[0.2em] drop-shadow-2xl mb-6">
                  {heroName}
                </h2>
                <p className="text-xl md:text-3xl font-display italic text-zinc-300 drop-shadow-xl font-light max-w-4xl mx-auto">
                  &quot;{hook}&quot;
                </p>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center w-full h-full text-zinc-600 font-mono text-sm uppercase tracking-widest">
              Awaiting Hero Image...
            </div>
          )}
        </div>
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 flex flex-col shadow-xl">
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10">
            <h3 className="text-indigo-400 font-mono font-bold tracking-[0.2em] uppercase text-xs flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
              Hook Image Prompt
            </h3>
            <button 
              onClick={() => copyToClipboard(compPrompt, 'comp')}
              className="p-2.5 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white transition-all duration-300"
            >
              {copiedId === 'comp' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
            <p className="text-zinc-300 font-mono text-[13px] leading-relaxed whitespace-pre-wrap opacity-80">
              {compPrompt}
            </p>
          </div>
        </div>
      </div>

      {/* 5. Origin Story */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 md:p-16 rounded-[2.5rem] relative z-10 shadow-2xl">
        <h3 className="text-indigo-500 font-mono font-bold tracking-[0.2em] uppercase text-xs mb-12 text-center">Origin Story</h3>
        <div className="prose prose-invert prose-lg md:prose-xl max-w-4xl mx-auto text-zinc-300 leading-relaxed font-sans prose-headings:font-display prose-p:text-[17px] prose-p:leading-[1.8]">
          <ReactMarkdown>{story}</ReactMarkdown>
        </div>
      </div>

      {/* 6. Cinematic Frame */}
      <div className="bg-[#050505] border border-indigo-500/20 p-10 md:p-16 rounded-[2.5rem] relative z-10 shadow-[0_0_50px_rgba(99,102,241,0.05)]">
        <h3 className="text-indigo-400 font-mono font-bold tracking-[0.2em] uppercase text-xs mb-12 text-center flex items-center justify-center gap-3">
          <PlayCircle className="w-5 h-5" />
          Cinematic Frame Simulation
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Video Prompt */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <span className="text-zinc-400 text-[10px] font-mono font-bold uppercase tracking-[0.2em]">Video Generation Prompt</span>
              <button 
                onClick={() => copyToClipboard(motionPrompt, 'motion')}
                className="flex items-center gap-2 text-[10px] font-mono font-bold tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                {copiedId === 'motion' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedId === 'motion' ? 'COPIED' : 'COPY'}
              </button>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex-1 overflow-y-auto custom-scrollbar">
              <p className="text-zinc-300 font-mono text-[13px] leading-relaxed whitespace-pre-wrap opacity-80">
                {motionPrompt}
              </p>
            </div>
          </div>

          {/* Upload & Init */}
          <div className="flex flex-col justify-center">
            <label className="flex flex-col items-center justify-center w-full h-56 border border-indigo-500/30 border-dashed rounded-3xl cursor-pointer bg-indigo-500/5 hover:bg-indigo-500/10 transition-all duration-500 group">
              <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-6">
                <div className="p-4 bg-indigo-500/10 rounded-full mb-6 group-hover:scale-110 transition-transform duration-500">
                  <Upload className="w-8 h-8 text-indigo-400" />
                </div>
                <p className="mb-3 text-sm text-zinc-300 font-medium">
                  <span className="text-indigo-400">Upload Generated Video</span> to initialize
                </p>
                <p className="text-[11px] font-mono tracking-widest uppercase text-zinc-500">Standard Horizontal (16:9) MP4 or WebM</p>
              </div>
              <input 
                type="file" 
                className="hidden" 
                accept="video/*"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setVideoFile(e.target.files[0]);
                  }
                }}
              />
            </label>

            <AnimatePresence>
              {videoFile && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-8 flex flex-col gap-5"
                >
                  <div className="p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                    <span className="text-zinc-300 text-sm truncate max-w-[70%] font-medium">{videoFile.name}</span>
                    <span className="text-emerald-400 text-[10px] font-mono font-bold tracking-[0.2em] uppercase">Ready</span>
                  </div>
                  
                  <button 
                    onClick={handleInitialize}
                    disabled={isPreparingSimulation}
                    className="w-full flex items-center justify-center gap-3 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-mono font-bold text-xs tracking-[0.2em] uppercase transition-all duration-300 shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_40px_rgba(99,102,241,0.6)] disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isPreparingSimulation ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Synthesizing Audio...
                      </>
                    ) : (
                      <>
                        <PlayCircle className="w-5 h-5" />
                        Initialize Simulation
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
