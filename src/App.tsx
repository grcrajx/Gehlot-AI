import { useState, useEffect, useRef } from "react";
import { 
  Send, 
  Plus, 
  Moon, 
  Sun, 
  Brain, 
  BookOpen, 
  Zap, 
  Trash2, 
  User, 
  Bot, 
  ChevronDown,
  Layout,
  MessageSquare,
  Sparkles,
  Settings2,
  ArrowRight,
  Shield,
  Clock,
  Globe,
  Star,
  CheckCircle2,
  Menu,
  X,
  CreditCard,
  Code2,
  Calculator,
  Microscope,
  Languages,
  History as HistoryIcon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import axios from "axios";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// --- Types ---

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface AIProvider {
  id: string;
  name: string;
  type: "native" | "external";
  config?: {
    api_key?: string;
    api_url?: string;
    model?: string;
  };
}

type Subject = "General" | "Math" | "Science" | "English" | "History" | "Coding";

// --- Utils ---

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Constants ---

const SUBJECTS: Subject[] = ["General", "Math", "Science", "English", "History", "Coding"];

const PROVIDERS: AIProvider[] = [
  { id: "gemini", name: "Gemini (Local)", type: "native" },
  { id: "openai", name: "OpenAI API", type: "external" },
];

const SUBJECT_PROMPTS: Record<Subject, string> = {
  General: "You are a helpful learning assistant.",
  Math: "You are a math tutor. Explain concepts clearly and show step-by-step solutions. Use LaTeX/Markdown for equations if necessary.",
  Science: "You are a science teacher. Use analogies and explain complex phenomena simply.",
  English: "You are an English tutor. Help with writing, grammar, and literary analysis.",
  History: "You are a history educator. Provide context, key dates, and explain the significance of events.",
  Coding: "You are a coding mentor. Provide clear code examples and explain logic.",
};

// --- App Component ---

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(PROVIDERS[0]);
  const [selectedSubject, setSelectedSubject] = useState<Subject>("General");
  const [showSettings, setShowSettings] = useState(false);
  const [view, setView] = useState<'landing' | 'chat' | 'developers'>('landing');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isChatSidebarOpen, setIsChatSidebarOpen] = useState(false);
  
  // External Provider Config
  const [externalApiKey, setExternalApiKey] = useState("");
  const [externalModel, setExternalModel] = useState("");
  const [externalUrl, setExternalUrl] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize from LocalStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem("gehlotai_messages");
    if (savedMessages) setMessages(JSON.parse(savedMessages));
    
    const savedTheme = localStorage.getItem("gehlotai_theme");
    if (savedTheme === "dark") setDarkMode(true);
  }, []);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem("gehlotai_messages", JSON.stringify(messages));
    if (messages.length > 0 && view === 'landing') {
       // Only auto-switch if they refresh and had a conversation? 
       // Decided: Keep them on landing for now to show the new professional entry.
    }
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("gehlotai_theme", darkMode ? "dark" : "light");
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (overridePrompt?: string) => {
    const textToSend = overridePrompt || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      let responseText = "";

      const res = await axios.post("/api/chat", {
        messages: newMessages,
        provider: selectedProvider.id,
        systemPrompt: SUBJECT_PROMPTS[selectedSubject],
        config: {
          api_key: externalApiKey,
          model: externalModel,
          api_url: externalUrl,
        }
      });
      responseText = res.data.text;

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: responseText,
          timestamp: Date.now(),
        },
      ]);
    } catch (error: any) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Oops! Something went wrong while connecting to the AI. Please check your settings and try again.",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    if (window.confirm("Clear all messages?")) {
      setMessages([]);
      setView('landing');
    }
  };

  const explainLikeI5 = () => {
    if (messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === "assistant") {
      handleSend(`Explain what you just said more simply, like I'm 5 years old.`);
    }
  };

  const summarize = () => {
    if (messages.length < 2) return;
    handleSend("Please summarize our discussion so far into key takeaways.");
  };

  // --- Sidebar Content (Reusable) ---
  const SidebarContent = () => (
    <>
      <div className="flex items-center justify-between mb-8 px-2 md:block">
        <div 
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => { setView('landing'); setIsChatSidebarOpen(false); }}
        >
          <div className="w-6 h-6 bg-brand rounded-md flex items-center justify-center shadow-[0_0_15px_var(--color-brand-glow)] group-hover:scale-110 transition-transform">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-brand">GehlotAI</h1>
        </div>
        <button 
          className="md:hidden p-2 text-text-dim hover:text-white"
          onClick={() => setIsChatSidebarOpen(false)}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-6 overflow-y-auto no-scrollbar">
        <div>
          <label className="text-[11px] font-bold text-text-dim uppercase tracking-wider px-2 mb-3 block">
            Subjects
          </label>
          <div className="grid grid-cols-2 md:grid-cols-1 gap-1">
            {SUBJECTS.map((s) => (
              <button
                key={s}
                onClick={() => { setSelectedSubject(s); setIsChatSidebarOpen(false); }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all text-left",
                  selectedSubject === s
                    ? "bg-surface text-text-main shadow-sm"
                    : "text-text-dim hover:text-text-main hover:bg-surface/50"
                )}
              >
                <BookOpen className="w-4 h-4 opacity-70" />
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold text-text-dim uppercase tracking-wider px-2 mb-3 block">
            Recent Lessons
          </label>
          <button
            onClick={() => { clearChat(); setIsChatSidebarOpen(false); }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-red-400 hover:bg-red-500/10 transition-all text-left"
          >
            <Trash2 className="w-4 h-4" />
            Clear Conversation
          </button>
        </div>

        <div>
          <label className="text-[11px] font-bold text-text-dim uppercase tracking-wider px-2 mb-3 block">
            Platform
          </label>
          <button
            onClick={() => { setView('developers'); setIsChatSidebarOpen(false); }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-text-dim hover:text-text-main hover:bg-surface/50 transition-all text-left"
          >
            <Code2 className="w-4 h-4" />
            Meet the Developers
          </button>
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-white/5 px-2 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center border border-white/5">
          <User className="w-4 h-4 text-text-dim" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium truncate text-text-main">Learner</p>
          <p className="text-[11px] text-text-dim truncate">Free Plan</p>
        </div>
      </div>
    </>
  );

  if (view === 'developers') {
    return (
      <div className="min-h-screen bg-bg text-text-main font-sans selection:bg-brand/30 pb-20">
        <nav className="fixed top-0 w-full z-50 bg-bg/80 backdrop-blur-lg border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div 
                className="flex items-center gap-2 cursor-pointer group"
                onClick={() => setView('landing')}
              >
                <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center shadow-[0_0_15px_var(--color-brand-glow)]">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight text-white">GehlotAI</span>
              </div>
              <button 
                onClick={() => setView('landing')}
                className="text-sm font-medium text-text-dim hover:text-brand transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        </nav>

        <section className="relative pt-32 lg:pt-48 overflow-hidden px-4">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
            <div className="absolute top-[-10%] left-[10%] w-[40%] h-[40%] bg-brand/10 blur-[120px] rounded-full" />
          </div>

          <div className="max-w-4xl mx-auto text-center relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-bold uppercase tracking-widest mb-8"
            >
              <Code2 className="w-3 h-3" />
              The Minds Behind GehlotAI
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl lg:text-6xl font-bold tracking-tight text-white mb-6"
            >
              Meet Our Developers
            </motion.h1>
            <p className="text-text-dim text-lg mb-16">
              Passionate about education and technology, the team focuses on making AI accessible for every student.
            </p>

            {/* Inspiration Section */}
            <div className="max-w-2xl mx-auto mb-16 px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="relative p-10 rounded-[2.5rem] bg-surface border border-brand/30 shadow-[0_0_40px_rgba(var(--color-brand-rgb),0.15)] text-center group overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 blur-[60px] rounded-full translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand/5 blur-[60px] rounded-full -translate-x-1/2 translate-y-1/2" />
                
                <div className="w-24 h-24 bg-brand/15 rounded-full mx-auto mb-8 border border-brand/30 flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform duration-500 relative z-10">
                  <Star className="w-12 h-12 text-brand fill-brand/20" />
                </div>
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-3 relative z-10">Himanshu Gehlot</h3>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-brand text-sm font-bold uppercase tracking-[0.2em] mb-6 relative z-10">
                  <Zap className="w-3.5 h-3.5" />
                  Inspiration & Vision
                </div>
                <p className="text-text-dim text-lg leading-relaxed italic relative z-10 max-w-lg mx-auto">
                  "The driving force and creative inspiration behind the development of GehlotAI, shaping the vision of a personalized AI future for every learner."
                </p>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { name: "Vamshi", role: "Software Architect", bio: "Tech visionary focusing on scalable AI solutions and seamless platform integration." },
                { name: "gracerajpaul", role: "UI/UX Specialist", bio: "Award-winning designer focusing on immersive interfaces and human-centered design systems." }
              ].map((dev, i) => (
                <motion.div
                  key={dev.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * (i + 1) }}
                  className="p-8 rounded-[2rem] bg-surface border border-white/5 hover:border-brand/30 hover:bg-surface/80 transition-all text-left group"
                >
                  <div className="w-20 h-20 bg-brand/10 rounded-3xl mb-6 border border-brand/20 shadow-inner group-hover:scale-110 transition-transform flex items-center justify-center">
                    <User className="w-10 h-10 text-brand" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{dev.name}</h3>
                  <p className="text-brand font-bold text-sm uppercase tracking-widest mb-4">{dev.role}</p>
                  <p className="text-text-dim leading-relaxed">{dev.bio}</p>
                </motion.div>
              ))}
            </div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-20 p-8 rounded-3xl border border-white/5 bg-sidebar/50"
            >
              <h4 className="text-xl font-bold text-white mb-2 italic">"Empowering the next generation of learners through artificial intelligence."</h4>
              <p className="text-brand font-medium">— The GehlotAI Team</p>
            </motion.div>
          </div>
        </section>
      </div>
    );
  }

  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-bg text-text-main font-sans selection:bg-brand/30">
        {/* Navigation */}
        <nav className="fixed top-0 w-full z-50 bg-bg/80 backdrop-blur-lg border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div 
                className="flex items-center gap-2 cursor-pointer group"
                onClick={() => setView('landing')}
              >
                <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center shadow-[0_0_15px_var(--color-brand-glow)] group-hover:scale-110 transition-transform">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight text-white">GehlotAI</span>
              </div>
              
              <div className="hidden md:flex items-center gap-8">
                <a href="#features" className="text-sm font-medium text-text-dim hover:text-brand transition-colors">Features</a>
                <a href="#subjects" className="text-sm font-medium text-text-dim hover:text-brand transition-colors">Subjects</a>
                <button 
                  onClick={() => setView('developers')}
                  className="text-sm font-medium text-text-dim hover:text-brand transition-colors"
                >
                  Developers
                </button>
                <button 
                  onClick={() => setView('chat')}
                  className="px-5 py-2 bg-brand text-white text-sm font-bold rounded-full hover:bg-brand/90 transition-all shadow-[0_0_15px_var(--color-brand-glow)]"
                >
                  Start Learning
                </button>
              </div>

              <div className="md:hidden">
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                  {isMobileMenuOpen ? <X /> : <Menu />}
                </button>
              </div>
            </div>
          </div>
          
          {/* Mobile Menu */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden bg-sidebar border-b border-white/5 overflow-hidden"
              >
                <div className="px-4 py-6 space-y-4">
                  <a href="#features" className="block text-lg font-medium text-text-dim" onClick={() => setIsMobileMenuOpen(false)}>Features</a>
                  <a href="#subjects" className="block text-lg font-medium text-text-dim" onClick={() => setIsMobileMenuOpen(false)}>Subjects</a>
                  <button 
                    onClick={() => { setView('developers'); setIsMobileMenuOpen(false); }}
                    className="block text-lg font-medium text-text-dim"
                  >
                    Developers
                  </button>
                  <button 
                    onClick={() => { setView('chat'); setIsMobileMenuOpen(false); }}
                    className="w-full py-3 bg-brand text-white font-bold rounded-xl"
                  >
                    Start Learning
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        {/* Hero Section */}
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
            <div className="absolute top-[-10%] left-[10%] w-[40%] h-[40%] bg-brand/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[10%] right-[10%] w-[30%] h-[30%] bg-blue-500/5 blur-[100px] rounded-full" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-bold uppercase tracking-widest mb-8"
              >
                <Sparkles className="w-3 h-3" />
                AI-Powered Personalized Learning
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl lg:text-7xl font-bold tracking-tight text-white mb-6"
              >
                Master Any Subject <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-blue-400">With Your AI Tutor.</span>
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="max-w-2xl mx-auto text-lg lg:text-xl text-text-dim mb-10 leading-relaxed"
              >
                GehlotAI is a smart learning companion designed to help students excel. 
                Get step-by-step explanations, summarize lessons, and tackle homework 24/7.
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <button 
                  onClick={() => setView('chat')}
                  className="group w-full sm:w-auto px-8 py-4 bg-brand text-white font-bold rounded-2xl hover:bg-brand/90 transition-all shadow-[0_0_30px_rgba(99,102,241,0.3)] flex items-center justify-center gap-2 text-lg"
                >
                  Start Learning Now
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <a 
                  href="#features"
                  className="w-full sm:w-auto px-8 py-4 bg-surface border border-white/10 text-white font-bold rounded-2xl hover:bg-surface/80 transition-all flex items-center justify-center text-lg"
                >
                  View Features
                </a>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-16 pt-8 border-t border-white/5 flex flex-wrap justify-center gap-8 lg:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all"
              >
                <div className="flex items-center gap-2 font-bold text-xl"><Globe className="w-6 h-6"/> GLOBAL</div>
                <div className="flex items-center gap-2 font-bold text-xl"><Shield className="w-6 h-6"/> SECURE</div>
                <div className="flex items-center gap-2 font-bold text-xl"><Star className="w-6 h-6"/> TRUSTED</div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-sidebar/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Why Choose GehlotAI?</h2>
              <p className="text-text-dim max-w-2xl mx-auto">Built specifically for the modern student's needs.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Zap className="w-8 h-8 text-yellow-400" />,
                  title: "Instant Explanations",
                  desc: "Get immediate help with complex topics, 24/7. No more waiting for office hours."
                },
                {
                  icon: <Sparkles className="w-8 h-8 text-brand" />,
                  title: "Summarize Lessons",
                  desc: "Turn long conversations and notes into concise summaries with a single click."
                },
                {
                  icon: <Calculator className="w-8 h-8 text-blue-400" />,
                  title: "Step-by-Step Solutions",
                  desc: "Don't just get the answer; understand the process behind every problem."
                }
              ].map((f, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -5 }}
                  className="p-8 rounded-3xl bg-surface border border-white/5 hover:border-brand/30 transition-all"
                >
                  <div className="w-16 h-16 bg-bg/50 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                    {f.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                  <p className="text-text-dim leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Subjects Section */}
        <section id="subjects" className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
              <div className="max-w-xl">
                <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Master Your Curriculum</h2>
                <p className="text-text-dim">Choose a specialized tutor mode for your specific subject needs.</p>
              </div>
              <button 
                onClick={() => setView('chat')}
                className="flex items-center gap-2 text-brand font-bold hover:underline"
              >
                Explore all subjects <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {[
                { name: "Math", label: "Mathematics", icon: <Calculator />, color: "bg-blue-500/10 text-blue-400" },
                { name: "Science", label: "Science", icon: <Microscope />, color: "bg-green-500/10 text-green-400" },
                { name: "English", label: "English", icon: <Languages />, color: "bg-purple-500/10 text-purple-400" },
                { name: "History", label: "History", icon: <HistoryIcon />, color: "bg-orange-500/10 text-orange-400" },
                { name: "Coding", label: "Computer Science", icon: <Code2 />, color: "bg-cyan-500/10 text-cyan-400" },
                { name: "General", label: "General Knowledge", icon: <Globe />, color: "bg-brand/10 text-brand" },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => { setSelectedSubject(s.name as Subject); setView('chat'); }}
                  className="cursor-pointer p-6 rounded-3xl bg-surface border border-white/5 flex flex-col items-center justify-center text-center gap-4 hover:bg-surface/80 transition-all"
                >
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shadow-lg", s.color)}>
                    {s.icon}
                  </div>
                  <h4 className="font-bold text-white">{s.label}</h4>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-4">
          <div className="max-w-5xl mx-auto rounded-[3rem] bg-gradient-to-br from-brand to-blue-600 p-12 lg:p-20 relative overflow-hidden text-center">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2" />
            <div className="relative z-10">
              <h2 className="text-3xl lg:text-5xl font-bold text-white mb-8">Ready to elevate your learning?</h2>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button 
                  onClick={() => setView('chat')}
                  className="px-10 py-5 bg-white text-brand font-bold rounded-2xl hover:bg-zinc-100 transition-all shadow-2xl text-lg flex items-center gap-2"
                >
                  Start Chatting Now
                  <MessageSquare className="w-5 h-5" />
                </button>
              </div>
              <p className="mt-8 text-white/80 text-sm font-medium">Free to use. No credit card required.</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-brand rounded flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white uppercase tracking-tighter">GehlotAI</span>
            </div>
            <p className="text-text-dim text-sm">© 2026 GehlotAI. All rights reserved.</p>
            <div className="flex gap-6">
              <button 
                onClick={() => setView('developers')}
                className="text-text-dim hover:text-white transition-colors text-sm"
              >
                Meet the Developers
              </button>
              <a href="#" className="text-text-dim hover:text-white transition-colors text-sm">Privacy</a>
              <a href="#" className="text-text-dim hover:text-white transition-colors text-sm">Terms</a>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-bg font-sans text-text-main animate-in fade-in duration-500 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isChatSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsChatSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {isChatSidebarOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-80 bg-sidebar border-r border-white/5 p-6 z-[70] md:hidden flex flex-col"
          >
            <SidebarContent />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-sidebar border-r border-white/5 p-4 shrink-0 shadow-2xl">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-white/5 bg-bg/80 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsChatSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 text-text-dim hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div 
              className="md:hidden flex items-center gap-2 cursor-pointer"
              onClick={() => setView('landing')}
            >
              <Brain className="w-6 h-6 text-brand" />
              <span className="font-bold text-brand">GehlotAI</span>
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-white/10 text-xs font-medium text-text-main hover:bg-surface/80 transition-all shadow-sm"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="max-w-[100px] md:max-w-[150px] truncate">{selectedProvider.name}</span>
                <ChevronDown className="w-4 h-4 opacity-50" />
              </button>
              
              <AnimatePresence>
                {showSettings && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full left-0 mt-2 w-64 bg-surface border border-white/10 rounded-xl shadow-2xl p-4 space-y-4 z-50 overflow-hidden"
                  >
                    <div>
                      <label className="text-[10px] font-bold text-text-dim uppercase mb-2 block">AI Provider</label>
                      <div className="space-y-1">
                        {PROVIDERS.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => { setSelectedProvider(p); setShowSettings(false); }}
                            className={cn(
                              "w-full text-left px-3 py-2 rounded-lg text-sm transition-all",
                              selectedProvider.id === p.id 
                                ? "bg-brand text-white" 
                                : "hover:bg-white/5 text-text-dim hover:text-text-main"
                            )}
                          >
                            {p.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {selectedProvider.type === "external" && (
                      <div className="space-y-3 pt-4 border-t border-white/5 animate-in fade-in zoom-in-95">
                        <div>
                          <label className="text-[10px] font-bold text-text-dim uppercase mb-1 block">API Key</label>
                          <input 
                            type="password"
                            placeholder="Your secret key..."
                            className="w-full bg-bg border border-white/10 rounded-lg px-3 py-2 text-sm text-text-main focus:ring-1 ring-brand outline-none"
                            value={externalApiKey}
                            onChange={(e) => setExternalApiKey(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-text-dim uppercase mb-1 block">Model ID</label>
                          <input 
                            type="text"
                            placeholder="e.g. gpt-4, llama-3"
                            className="w-full bg-bg border border-white/10 rounded-lg px-3 py-2 text-sm text-text-main focus:ring-1 ring-brand outline-none"
                            value={externalModel}
                            onChange={(e) => setExternalModel(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 rounded-full hover:bg-surface transition-all text-text-dim hover:text-text-main">
              <Settings2 className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 md:py-8 md:px-0 scroll-smooth chat-gradient relative">
          <div className="max-w-3xl mx-auto space-y-6 md:space-y-8 pb-40">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 md:py-20 text-center">
                <motion.div 
                   initial={{ scale: 0.8, opacity: 0 }}
                   animate={{ scale: 1, opacity: 1 }}
                   className="w-12 h-12 md:w-16 md:h-16 bg-brand/10 rounded-2xl flex items-center justify-center mb-6 md:mb-8 shadow-[0_0_20px_var(--color-brand-glow)]"
                >
                  <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-brand" />
                </motion.div>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <h2 className="text-2xl md:text-4xl font-bold mb-3 md:mb-4 tracking-tight text-white px-4">How can I help you learn today?</h2>
                  <p className="text-text-dim max-w-sm mx-auto mb-10 md:mb-12 text-base md:text-lg px-6">
                    I'm your smart tutor. Pick a subject in the menu and let's start.
                  </p>
                </motion.div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl px-6">
                  {[
                    { icon: <Zap className="w-4 h-4" />, text: "Explain photosynthesis with analogies" },
                    { icon: <Zap className="w-4 h-4" />, text: "How to solve x² + 5x + 6 = 0?" },
                    { icon: <Zap className="w-4 h-4" />, text: "Summarize the major causes of WW1" },
                    { icon: <Zap className="w-4 h-4" />, text: "Help me write a persuasive essay intro" }
                  ].map((preset, i) => (
                    <motion.button
                      key={preset.text}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.05 }}
                      onClick={() => { setInput(preset.text); }}
                      className="text-left px-5 py-4 rounded-xl bg-surface border border-white/10 hover:border-brand/50 hover:bg-surface/80 transition-all text-[13px] font-medium shadow-sm group relative text-text-main"
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-brand">{preset.icon}</span>
                        <span className="flex-1 opacity-80">{preset.text}</span>
                        <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all text-brand" />
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {messages.map((m) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex gap-4",
                      m.role === "assistant" ? "justify-start" : "justify-end"
                    )}
                  >
                    {m.role === "assistant" && (
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center shadow-lg shadow-brand/20">
                          <Bot className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-1.5 max-w-[85%]">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-text-dim px-1">
                        {m.role === "assistant" ? "GehlotAI — Teacher Mode" : "You"}
                      </span>
                      <div className={cn(
                        "rounded-2xl px-5 py-4 shadow-sm",
                        m.role === "assistant" 
                          ? "bg-ai-bubble border border-white/5 text-text-main"
                          : "bg-user-bubble text-white"
                      )}>
                        <div className={cn(
                          "prose prose-sm prose-invert max-w-none break-words",
                          "prose-strong:text-brand prose-code:text-brand-glow",
                          m.role === "user" && "prose-strong:text-white"
                        )}>
                          <ReactMarkdown>{m.content}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4"
              >
                <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div className="bg-ai-bubble border border-white/5 rounded-2xl p-5 shadow-sm min-w-[80px]">
                  <p className="text-xs italic text-text-dim">GehlotAI is thinking...</p>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>

        {/* Input area */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-12 pb-6 md:pb-10 bg-gradient-to-t from-bg via-bg/95 to-transparent z-20">
          <div className="max-w-3xl mx-auto">
            <AnimatePresence>
              {messages.length > 0 && !isLoading && (
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
                  <motion.button 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={explainLikeI5}
                    className="whitespace-nowrap flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-surface border border-white/10 text-[10px] md:text-[11px] font-bold text-brand uppercase tracking-wider hover:bg-brand/10 transition-all shadow-sm shrink-0"
                  >
                    Explain Like I'm 5
                  </motion.button>
                  <motion.button 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    onClick={summarize}
                    className="whitespace-nowrap flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-surface border border-white/10 text-[10px] md:text-[11px] font-bold text-brand uppercase tracking-wider hover:bg-brand/10 transition-all shadow-sm shrink-0"
                  >
                    Summarize Lesson
                  </motion.button>
                </div>
              )}
            </AnimatePresence>
            
            <div className="relative flex items-center bg-surface border border-white/10 rounded-2xl md:rounded-xl px-2 md:px-4 py-2 shadow-2xl focus-within:ring-1 ring-brand/50 transition-all">
              <textarea
                rows={1}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask anything..."
                className="flex-1 bg-transparent border-none text-text-main text-[13px] md:text-sm py-2 px-2 outline-none resize-none placeholder:text-text-dim/50 max-h-[150px] overflow-y-auto"
              />
              <button
                disabled={!input.trim() || isLoading}
                onClick={() => handleSend()}
                className="ml-2 h-9 w-9 md:h-10 md:w-auto md:px-4 flex items-center justify-center bg-brand text-white text-[13px] font-bold rounded-xl md:rounded-lg hover:bg-brand/90 transition-all disabled:opacity-30 shadow-[0_0_15px_var(--color-brand-glow)]"
              >
                <span className="hidden md:inline">Send</span>
                <Send className="w-4 h-4 md:hidden" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
