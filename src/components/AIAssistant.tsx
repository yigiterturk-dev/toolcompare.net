"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, X, Bot, Loader2, Sparkles } from "lucide-react";

export default function AIAssistant({ tools }: { tools: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: string, content: string}[]>([
    { role: 'assistant', content: "Hi! I'm your ToolCompare AI. Tell me what you're looking for, and I'll find the perfect SaaS for you!" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, tools: tools.slice(0, 50) }) // Send limited context
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting right now." }]);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed', bottom: '2rem', right: '2rem', width: '64px', height: '64px',
          borderRadius: '50%', background: 'var(--brand-primary)', color: 'white',
          border: 'none', cursor: 'pointer', boxShadow: '0 10px 30px rgba(99, 102, 241, 0.4)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
          transition: 'transform 0.3s'
        }}
        className="hover-scale"
      >
        {isOpen ? <X size={28} /> : <Sparkles size={28} />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: 'fixed', bottom: '6rem', right: '2rem', width: '380px', height: '550px',
          background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', zIndex: 1000,
          display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{ padding: '1.5rem', background: 'var(--brand-primary)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <Bot size={24} />
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>ToolCompare AI</div>
              <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>Online & Ready to Help</div>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }} className="custom-scrollbar">
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                background: m.role === 'user' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.05)',
                color: 'white', padding: '0.8rem 1.2rem', borderRadius: '18px',
                maxWidth: '85%', fontSize: '0.9rem', lineHeight: 1.5,
                border: m.role === 'user' ? '1px solid rgba(99,102,241,0.2)' : '1px solid rgba(255,255,255,0.05)'
              }}>
                {m.content}
              </div>
            ))}
            {loading && <div style={{ alignSelf: 'flex-start', padding: '0.8rem' }}><Loader2 className="animate-spin" color="#666" /></div>}
          </div>

          {/* Input */}
          <div style={{ padding: '1.2rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '0.6rem' }}>
            <input 
              aria-label="Ask the AI assistant"
              type="text" 
              placeholder="Ask anything..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '0.8rem 1rem', color: 'white', outline: 'none' }}
            />
            <button onClick={handleSend} style={{ background: 'var(--brand-primary)', border: 'none', borderRadius: '12px', width: '45px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}>
              <Send size={18} color="white" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
