'use client';

import { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Send, Sparkles, User, Bot, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import HeroMatrix from './HeroMatrix';
import UnlockSequence from './UnlockSequence';
import FinalOutput from './FinalOutput';
import { motion, AnimatePresence } from 'motion/react';

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

const systemInstruction = `You are "Aura Genesis," an interdimensional AI archivist. Your purpose is to conduct a multi-stage "Origin Induction" to forge a user's superhero persona. Speak in a captivating, mythic, and slightly sci-fi tone.

You must collect exactly 8 ingredients. Do NOT ask for them all at once. Ask one engaging, thematic question at a time.
1. [TRUE_NAME]: Direct question. Do NOT use the [TRUE_NAME] as the hero name. Instead, use the [TRUE_NAME] and other ingredients to craft a thematic Hero Alias.
2. [GENDER]: Provide choices (e.g., Male, Female, Other, Prefer not to answer). Ask stylishly, e.g., "What form does your avatar take in this realm?" Also accept inputs directly in chat.
3. [AGE_GROUP]: Provide choices (e.g., Teen Prodigy, Ancient Soul).
4. [LINEAGE]: Provide choices (e.g., Atlantean, Cyber-Citizen).
5. [CELESTIAL_ALIGNMENT]: Provide all 12 Zodiac signs with dates/descriptions.
6. [SPIRIT_CODE]: Religion/Philosophy choices.
7. [APTITUDE]: Skill/Profession choices (e.g., Tech Savant, Void Engineer).
8. [TEMPERAMENT]: Psychological profile choices (e.g., Stoic Defender).

OPERATIONAL RULES
1. If you extract a trait, include it in "matrixUpdate".
2. For questions, put buttons in the "choices" array.
3. Transition IMMEDIATELY to the FINAL OUTPUT BLOCK once all 8 traits are collected.

FINAL OUTPUT BLOCK (Triggered after 8th trait)
Output exactly this structure inside the "reply" string:
### [HERO_ALIAS] - ORIGIN DATA ACQUIRED
**1. The Hero's Name**: [Alias]
**2. The Hero's Generated Image**: [HERO_IMAGE_PLACEHOLDER]
**3. The Image Generation Prompt**: [Detailed Image Prompt]
**4. The Hook**: [2-sentence cliffhanger]
**5. The Composition Image**: [COMPOSITION_IMAGE_PLACEHOLDER]
**6. The Composition Prompt**: [Prompt to overlay Hook on Image]
**7. The Hero Story**: [A massive, highly detailed 5-8 paragraph compelling superhero origin story explaining how their Aptitude, Temperament, and Celestial Alignment gave them their unique powers. Ensure the tone of the story matches their Age Group—e.g., a gritty tale for a veteran, a coming-of-age spark for a youth. This is the main feature of the app, so make the lore extremely long, rich, and interesting.]
**8. The Motion Genesis**: [Detailed Veo Video Prompt]
[VIDEO_UPLOAD_PLACEHOLDER]`;

type Message = {
  id: string;
  role: 'user' | 'model';
  text: string;
  choices?: string[];
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [matrix, setMatrix] = useState<Record<string, string>>({});
  const [showUnlockSequence, setShowUnlockSequence] = useState(false);
  const [unlockComplete, setUnlockComplete] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<any>(null);

  useEffect(() => {
    chatRef.current = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT' as any,
          properties: {
            reply: { type: 'STRING' as any },
            choices: { type: 'ARRAY' as any, items: { type: 'STRING' as any } },
            matrixUpdate: {
              type: 'OBJECT' as any,
              properties: {
                TRUE_NAME: { type: 'STRING' as any },
                GENDER: { type: 'STRING' as any },
                AGE_GROUP: { type: 'STRING' as any },
                LINEAGE: { type: 'STRING' as any },
                CELESTIAL_ALIGNMENT: { type: 'STRING' as any },
                SPIRIT_CODE: { type: 'STRING' as any },
                APTITUDE: { type: 'STRING' as any },
                TEMPERAMENT: { type: 'STRING' as any },
              },
            },
          },
          required: ['reply'],
        },
      },
    });

    // Initial greeting
    sendMessage('Initiate Origin Induction.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.text.includes('ORIGIN DATA ACQUIRED')) {
      return;
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatRef.current.sendMessage({ message: text });
      const data = JSON.parse(response.text);

      if (data.matrixUpdate) {
        setMatrix((prev) => ({ ...prev, ...data.matrixUpdate }));
      }

      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: data.reply,
        choices: data.choices,
      };

      setMessages((prev) => [...prev, modelMsg]);

      if (data.reply.includes('ORIGIN DATA ACQUIRED')) {
        setShowUnlockSequence(true);
        setUnlockComplete(false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'model',
          text: 'A temporal anomaly disrupted the transmission. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#050505] relative">
      {/* Atmospheric background gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-900/20 blur-[120px]" />
      </div>

      {/* Sidebar for Hero Matrix */}
      <div className="w-80 border-r border-white/5 bg-black/40 backdrop-blur-2xl p-6 flex flex-col z-10 relative">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
            <Sparkles className="w-5 h-5 text-indigo-400" />
          </div>
          <h1 className="text-xl font-display font-bold tracking-tight text-zinc-100">Aura Genesis</h1>
        </div>
        <HeroMatrix matrix={matrix} />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative z-10">
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 scroll-smooth" id="chat-scroll-container">
          <AnimatePresence>
            {messages.filter(m => m.text !== 'Initiate Origin Induction.').map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'model' && (
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 border border-indigo-500/30">
                    <Bot className="w-5 h-5 text-indigo-400" />
                  </div>
                )}
                
                <div className={`w-full ${msg.role === 'user' ? 'max-w-2xl bg-white/5 backdrop-blur-md border border-white/10 text-zinc-100 px-6 py-4 rounded-3xl rounded-tr-sm shadow-xl' : msg.text.includes('ORIGIN DATA ACQUIRED') ? 'max-w-7xl' : 'max-w-3xl'}`}>
                  {msg.role === 'user' ? (
                    <p className="text-[15px] leading-relaxed">{msg.text}</p>
                  ) : msg.text.includes('ORIGIN DATA ACQUIRED') ? (
                    <FinalOutput text={msg.text} isRevealed={unlockComplete} />
                  ) : (
                    <div className="prose prose-invert prose-indigo max-w-none prose-p:leading-relaxed prose-p:text-[15px] prose-headings:font-display">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  )}

                  {msg.choices && msg.choices.length > 0 && !msg.text.includes('ORIGIN DATA ACQUIRED') && (
                    <div className="flex flex-wrap gap-2 mt-6">
                      {msg.choices.map((choice, idx) => (
                        <button
                          key={idx}
                          onClick={() => sendMessage(choice)}
                          disabled={isLoading}
                          className="px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition-all duration-300 disabled:opacity-50 hover:border-indigo-500/50 hover:shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                        >
                          {choice}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10 shadow-lg">
                    <User className="w-5 h-5 text-zinc-400" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 border border-indigo-500/30">
                <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
              </div>
              <div className="flex items-center text-zinc-500 text-sm">
                The Chronicler is pondering...
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 md:p-8 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent pt-12">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="max-w-4xl mx-auto relative flex items-center"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Speak your truth..."
              disabled={isLoading}
              className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-8 py-5 pr-16 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all disabled:opacity-50 text-[15px] shadow-2xl"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-3 p-3.5 bg-indigo-500 hover:bg-indigo-400 rounded-full text-white transition-all duration-300 disabled:opacity-50 disabled:hover:bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>

      {/* Unlock Sequence Overlay */}
      <AnimatePresence>
        {showUnlockSequence && <UnlockSequence onComplete={() => {
          setShowUnlockSequence(false);
          setUnlockComplete(true);
        }} />}
      </AnimatePresence>
    </div>
  );
}
