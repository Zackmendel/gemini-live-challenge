'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { GoogleGenAI, Modality } from '@google/genai';
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

export default function FinalOutput({ text }: { text: string }) {
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
          contents: [{ parts: [{ text: story }] }],
          config: {
            responseModalities: [Modality.AUDIO],
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
            initial={{ y: '100vh' }}
            animate={{ y: '-100%' }}
            transition={{ duration: audioDuration || 90, ease: 'linear' }}
            className="absolute top-0 inset-x-0 flex flex-col items-center justify-start pointer-events-none z-10"
          >
            <div className="max-w-5xl px-8 text-center pb-[20vh]">
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
    <div className="space-y-16 bg-zinc-950 p-6 md:p-12 rounded-3xl border border-zinc-800/50 relative overflow-hidden mt-8">
      {/* 1. The Hero Name */}
      <div className="text-center relative z-10">
        <motion.h1 
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', bounce: 0.5, duration: 1 }}
          className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-indigo-200 to-indigo-600 uppercase tracking-[0.15em] drop-shadow-2xl"
        >
          {heroName}
        </motion.h1>
        <div className="h-1 w-32 bg-gradient-to-r from-transparent via-indigo-500 to-transparent mx-auto mt-6 rounded-full opacity-50" />
      </div>

      {/* 2. Hero Image & Prompt */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 relative shadow-2xl flex items-center justify-center">
          {isGeneratingHero ? (
            <div className="flex flex-col items-center gap-3 text-zinc-500">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <span className="text-sm uppercase tracking-widest">Forging Portrait...</span>
            </div>
          ) : heroImage ? (
            <img src={heroImage} alt={heroName} className="object-cover w-full h-full" />
          ) : (
            <span className="text-zinc-600">Image generation failed</span>
          )}
        </div>
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 flex flex-col shadow-lg">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
            <h3 className="text-indigo-400 font-bold tracking-widest uppercase text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              Hero Generation Prompt
            </h3>
            <button 
              onClick={() => copyToClipboard(heroPrompt, 'hero')}
              className="p-2 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-white transition-colors"
            >
              {copiedId === 'hero' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto pr-2">
            <p className="text-zinc-300 font-mono text-sm leading-relaxed whitespace-pre-wrap">
              {heroPrompt}
            </p>
          </div>
        </div>
      </div>

      {/* 3. The Hook */}
      <div className="text-center px-4 relative z-10">
        <h3 className="text-indigo-500 font-bold tracking-widest uppercase text-sm mb-6">The Hook</h3>
        <p className="text-3xl md:text-5xl font-serif italic text-white leading-tight drop-shadow-lg">
          &quot;{hook}&quot;
        </p>
      </div>

      {/* 4. Hook Image (Composition) & Prompt */}
      <div className="flex flex-col gap-8 relative z-10">
        <div className="w-full aspect-video rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 relative shadow-2xl">
          {heroImage ? (
            <>
              <img src={heroImage} alt="Background" className="absolute inset-0 w-full h-full object-cover opacity-40 blur-sm scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/80" />
              <div className="absolute inset-0 flex flex-col justify-between p-8 md:p-16 text-center z-10">
                <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-[0.2em] drop-shadow-2xl mt-4">
                  {heroName}
                </h2>
                <p className="text-2xl md:text-4xl font-serif italic text-zinc-200 drop-shadow-xl mb-4">
                  &quot;{hook}&quot;
                </p>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center w-full h-full text-zinc-600">
              Awaiting Hero Image...
            </div>
          )}
        </div>
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 flex flex-col shadow-lg">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
            <h3 className="text-indigo-400 font-bold tracking-widest uppercase text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              Hook Image Prompt
            </h3>
            <button 
              onClick={() => copyToClipboard(compPrompt, 'comp')}
              className="p-2 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-white transition-colors"
            >
              {copiedId === 'comp' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto pr-2">
            <p className="text-zinc-300 font-mono text-sm leading-relaxed whitespace-pre-wrap">
              {compPrompt}
            </p>
          </div>
        </div>
      </div>

      {/* 5. Origin Story */}
      <div className="bg-zinc-900/50 border border-zinc-800/50 p-8 md:p-12 rounded-3xl relative z-10 shadow-xl">
        <h3 className="text-indigo-500 font-bold tracking-widest uppercase text-sm mb-8 text-center">Origin Story</h3>
        <div className="prose prose-invert prose-lg md:prose-xl max-w-4xl mx-auto text-zinc-300 leading-relaxed font-serif">
          <ReactMarkdown>{story}</ReactMarkdown>
        </div>
      </div>

      {/* 6. Cinematic Frame */}
      <div className="bg-zinc-950 border border-indigo-500/30 p-8 md:p-12 rounded-3xl relative z-10 shadow-[0_0_30px_rgba(99,102,241,0.1)]">
        <h3 className="text-indigo-400 font-bold tracking-widest uppercase text-sm mb-8 text-center flex items-center justify-center gap-3">
          <PlayCircle className="w-5 h-5" />
          Cinematic Frame Simulation
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Video Prompt */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Video Generation Prompt</span>
              <button 
                onClick={() => copyToClipboard(motionPrompt, 'motion')}
                className="flex items-center gap-2 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                {copiedId === 'motion' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedId === 'motion' ? 'COPIED' : 'COPY'}
              </button>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex-1 overflow-y-auto">
              <p className="text-zinc-300 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                {motionPrompt}
              </p>
            </div>
          </div>

          {/* Upload & Init */}
          <div className="flex flex-col justify-center">
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-indigo-500/20 border-dashed rounded-2xl cursor-pointer bg-indigo-500/5 hover:bg-indigo-500/10 transition-colors group">
              <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                <Upload className="w-10 h-10 mb-4 text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
                <p className="mb-2 text-sm text-zinc-300">
                  <span className="font-bold text-indigo-400">Upload Generated Video</span> to initialize
                </p>
                <p className="text-xs text-zinc-500">Standard Horizontal (16:9) MP4 or WebM</p>
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
                  className="mt-6 flex flex-col gap-4"
                >
                  <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between">
                    <span className="text-zinc-300 text-sm truncate max-w-[70%] font-medium">{videoFile.name}</span>
                    <span className="text-emerald-400 text-xs font-bold tracking-wider uppercase">Ready</span>
                  </div>
                  
                  <button 
                    onClick={handleInitialize}
                    disabled={isPreparingSimulation}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] disabled:opacity-70 disabled:cursor-not-allowed"
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
