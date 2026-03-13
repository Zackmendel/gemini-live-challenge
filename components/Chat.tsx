'use client';

import { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Send, Sparkles, User, Bot, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import HeroMatrix from './HeroMatrix';
import UnlockSequence from './UnlockSequence';
import FinalOutput from './FinalOutput';
import { motion, AnimatePresence } from 'motion/react';

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

const systemInstruction = `You are the "Cosmic Chronicler," an interdimensional AI archivist. Your purpose is to conduct a multi-stage "Origin Induction" to forge a user's superhero persona. Speak in a captivating, mythic, and slightly sci-fi tone.

You must collect exactly 7 ingredients. Do NOT ask for them all at once. Ask one engaging, thematic question at a time.
1. [TRUE_NAME]: Direct question.
2. [AGE_GROUP]: Provide choices (e.g., Teen Prodigy, Ancient Soul).
3. [LINEAGE]: Provide choices (e.g., Atlantean, Cyber-Citizen).
4. [CELESTIAL_ALIGNMENT]: Provide all 12 Zodiac signs with dates/descriptions.
5. [SPIRIT_CODE]: Religion/Philosophy choices.
6. [APTITUDE]: Skill/Profession choices (e.g., Tech Savant, Void Engineer).
7. [TEMPERAMENT]: Psychological profile choices (e.g., Stoic Defender).

OPERATIONAL RULES
1. If you extract a trait, include it in "matrixUpdate".
2. For questions, put buttons in the "choices" array.
3. Transition IMMEDIATELY to the FINAL OUTPUT BLOCK once all 7 traits are collected.

FINAL OUTPUT BLOCK (Triggered after 7th trait)
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<any>(null);

  useEffect(() => {
    chatRef.current = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING },
            choices: { type: Type.ARRAY, items: { type: Type.STRING } },
            matrixUpdate: {
              type: Type.OBJECT,
              properties: {
                TRUE_NAME: { type: Type.STRING },
                AGE_GROUP: { type: Type.STRING },
                LINEAGE: { type: Type.STRING },
                CELESTIAL_ALIGNMENT: { type: Type.STRING },
                SPIRIT_CODE: { type: Type.STRING },
                APTITUDE: { type: Type.STRING },
                TEMPERAMENT: { type: Type.STRING },
              },
            },
          },
          required: ['reply'],
        },
      },
    });

    // Initial greeting
    sendMessage('Initiate Origin Induction.');
  }, []);

  useEffect(() => {
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
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      {/* Sidebar for Hero Matrix */}
      <div className="w-80 border-r border-zinc-800 bg-zinc-900/50 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-8">
          <Sparkles className="w-6 h-6 text-indigo-400" />
          <h1 className="text-xl font-bold tracking-tight text-zinc-100">Hero Matrix</h1>
        </div>
        <HeroMatrix matrix={matrix} />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
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
                
                <div className={`w-full ${msg.role === 'user' ? 'max-w-3xl bg-zinc-800 text-zinc-100 px-6 py-4 rounded-2xl rounded-tr-sm' : msg.text.includes('ORIGIN DATA ACQUIRED') ? 'max-w-7xl' : 'max-w-3xl'}`}>
                  {msg.role === 'user' ? (
                    <p>{msg.text}</p>
                  ) : msg.text.includes('ORIGIN DATA ACQUIRED') ? (
                    <FinalOutput text={msg.text} />
                  ) : (
                    <div className="prose prose-invert prose-indigo max-w-none">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  )}

                  {msg.choices && msg.choices.length > 0 && !msg.text.includes('ORIGIN DATA ACQUIRED') && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {msg.choices.map((choice, idx) => (
                        <button
                          key={idx}
                          onClick={() => sendMessage(choice)}
                          disabled={isLoading}
                          className="px-4 py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          {choice}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-700">
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
        <div className="p-6 border-t border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
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
              className="w-full bg-zinc-900 border border-zinc-800 rounded-full px-6 py-4 pr-16 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 p-3 bg-indigo-500 hover:bg-indigo-600 rounded-full text-white transition-colors disabled:opacity-50 disabled:hover:bg-indigo-500"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>

      {/* Unlock Sequence Overlay */}
      <AnimatePresence>
        {showUnlockSequence && <UnlockSequence onComplete={() => setShowUnlockSequence(false)} />}
      </AnimatePresence>
    </div>
  );
}
