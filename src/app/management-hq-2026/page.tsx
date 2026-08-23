"use client";

import { useState, useEffect } from "react";
import { 
  Settings, Plus, Trash2, Save, LogOut, 
  Database, Layout, Activity, CheckCircle, Mail, Zap, Cloud, BarChart3, Shield,
  Loader2, Check, AlertCircle, ExternalLink, Globe, Award, TrendingUp, Search
} from "lucide-react";
import Link from "next/link";

const ICON_OPTIONS = ["Zap", "Cloud", "BarChart3", "Database", "Activity", "CheckCircle", "Layout", "Mail", "Shield"];

export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [tools, setTools] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [searchTerm, setSearchTerm] = useState("");
  
  // Form State
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<any>({
    slug: "", name: "", category: "", iconName: "Zap",
    color1: "#6366f1", color2: "#a855f7",
    ease: 90, featuresScore: 90, basePrice: 20, isFlat: false,
    websiteUrl: "",
    shortDescription: "", longDescription: "", targetAudience: "", verdict: "",
    pros: ["", "", ""], cons: ["", ""],
    keyFeatures: [{title: "", description: ""}]
  });

  useEffect(() => {
    if (isLoggedIn) fetchTools();
  }, [isLoggedIn]);

  const fetchTools = async () => {
    const res = await fetch("/api/tools");
    const data = await res.json();
    setTools(data);
    
    // Also fetch posts
    const pRes = await fetch("/api/blog/generate", { method: 'GET' }); // I need to create a GET route for this or just use a helper
    // For now I'll just skip the fetch and assume I'll add a proper fetch later
  };

  // Parola artik istemci paketinde tutulmuyor; karari sunucu veriyor.
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok) {
        setIsLoggedIn(true);
      } else {
        alert(data?.error || "Incorrect Password");
      }
    } catch {
      alert("Could not reach the server");
    }
  };

  const handleSave = async () => {
    setLoading(true);
    const res = await fetch("/api/tools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        password,
        action: editMode ? "update" : "add",
        tool: formData
      })
    });
    
    if (res.ok) {
      setStatus({ type: "success", message: "Successfully updated!" });
      fetchTools();
      setEditMode(false);
      resetForm();
    } else {
      setStatus({ type: "error", message: "Save failed." });
    }
    setLoading(false);
    setTimeout(() => setStatus({ type: "", message: "" }), 3000);
  };

  const handleDelete = async (slug: string) => {
    if (!confirm("Are you sure?")) return;
    const res = await fetch("/api/tools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, action: "delete", slug })
    });
    if (res.ok) fetchTools();
  };

  const resetForm = () => {
    setFormData({
        slug: "", name: "", category: "", iconName: "Zap",
        color1: "#6366f1", color2: "#a855f7",
        ease: 90, featuresScore: 90, basePrice: 20, isFlat: false,
        websiteUrl: "",
        shortDescription: "", longDescription: "", targetAudience: "", verdict: "",
        pros: ["", "", ""], cons: ["", ""],
        keyFeatures: [{title: "", description: ""}]
    });
  };

  const filteredTools = tools.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.category.toLowerCase().includes(searchTerm.toLowerCase()));
  const totalCategories = new Set(tools.map(t => t.category)).size;

  if (!isLoggedIn) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#050505', fontFamily: 'Inter, sans-serif' }}>
        <form onSubmit={handleLogin} style={{ background: '#111', padding: '3rem', borderRadius: '32px', border: '1px solid #222', width: '400px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ width: '60px', height: '60px', background: 'var(--brand-primary)', borderRadius: '15px', margin: '0 auto 1rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Shield color="white" size={30} /></div>
            <h2 style={{ color: 'white', fontSize: '1.5rem' }}>Terminal Access</h2>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>Enter security clearance to manage ToolCompare</p>
          </div>
          <input 
            type="password" 
            placeholder="Security Key" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '1.2rem', borderRadius: '14px', background: '#0a0a0a', border: '1px solid #333', color: 'white', marginBottom: '1.5rem', outline: 'none' }} 
          />
          <button type="submit" style={{ width: '100%', padding: '1.2rem', borderRadius: '14px', background: 'white', color: 'black', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: '1rem' }}>Initialize Dashboard</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: 'white', padding: '2rem 4%', fontFamily: 'Inter, sans-serif' }}>
      {/* Top Navbar */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', background: '#111', padding: '1rem 2rem', borderRadius: '20px', border: '1px solid #222' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'var(--brand-primary)', padding: '0.5rem', borderRadius: '10px' }}><Settings size={20} /></div>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 700 }}>ToolCompare <span style={{ color: '#666', fontWeight: 400 }}>/ Admin Control</span></h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/" target="_blank" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', color: 'white', textDecoration: 'none', padding: '0.6rem 1.2rem', borderRadius: '12px', fontSize: '0.9rem', border: '1px solid #333' }}><Globe size={16} /> View Site</Link>
          <button onClick={() => setIsLoggedIn(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.6rem 1.2rem', borderRadius: '12px', cursor: 'pointer', fontSize: '0.9rem' }}><LogOut size={16} /> Exit</button>
        </div>
      </header>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
        <div style={{ background: '#111', padding: '1.5rem', borderRadius: '24px', border: '1px solid #222' }}>
          <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Total Tools</p>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{tools.length}</div>
        </div>
        <div style={{ background: '#111', padding: '1.5rem', borderRadius: '24px', border: '1px solid #222' }}>
          <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Categories</p>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{totalCategories}</div>
        </div>
        <div style={{ background: '#111', padding: '1.5rem', borderRadius: '24px', border: '1px solid #222' }}>
          <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '0.5rem' }}>SEO Health</p>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--success)' }}>Good</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))', padding: '1.5rem', borderRadius: '24px', color: 'white' }}>
          <p style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '0.5rem' }}>Active Year</p>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>2026</div>
        </div>
      </div>

      {/* AI Generator Section */}
      <section style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1))', border: '1px solid var(--brand-primary)', borderRadius: '28px', padding: '2.5rem', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.7rem' }}><Zap color="var(--brand-primary)" fill="var(--brand-primary)" /> AI Content Factory</h2>
            <p style={{ color: '#aaa' }}>Bulk generate professional reviews instantly. Duplicate tools are automatically skipped.</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder="Enter category (e.g. Video Editing, SEO Tools...)" 
            id="ai-category-dashboard"
            style={{ flex: 1, minWidth: '300px', padding: '1.2rem', borderRadius: '16px', background: '#0a0a0a', border: '1px solid #333', color: 'white', outline: 'none' }} 
          />
          <select 
            id="ai-count-selector"
            style={{ padding: '0 1.5rem', borderRadius: '16px', background: '#111', border: '1px solid #333', color: 'white', outline: 'none', cursor: 'pointer' }}
          >
            <option value="5">Generate 5 Tools</option>
            <option value="10">Generate 10 Tools</option>
          </select>
          <button 
            onClick={async () => {
              const cat = (document.getElementById('ai-category-dashboard') as HTMLInputElement).value;
              const count = (document.getElementById('ai-count-selector') as HTMLSelectElement).value;
              if (!cat) return alert("Please enter a category");
              setLoading(true);
              const res = await fetch("/api/tools/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ category: cat, count: parseInt(count), password })
              });
              const data = await res.json();
              setLoading(false);
              if (data.success) {
                alert(`MISSION SUCCESS!\n\nAI found ${data.totalFound} tools.\nAdded ${data.addedCount} new tools.\nSkipped ${data.totalFound - data.addedCount} duplicates.`);
                fetchTools();
              } else {
                alert("Error: " + data.error);
              }
            }}
            disabled={loading}
            style={{ padding: '0 2.5rem', height: '60px', borderRadius: '16px', background: 'white', color: 'black', fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.7rem', transition: 'transform 0.2s' }}
          >
            {loading ? <Loader2 className="animate-spin" /> : <><Plus size={20}/> Start Batch Production</>}
          </button>
        </div>
      </section>

      {/* AI Blog Factory Section */}
      <section style={{ background: 'linear-gradient(135deg, rgba(147,51,234,0.1), rgba(236,72,153,0.1))', border: '1px solid #ec4899', borderRadius: '28px', padding: '2.5rem', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.7rem' }}><Mail color="#ec4899" fill="#ec4899" /> AI Blog Factory</h2>
            <p style={{ color: '#aaa' }}>Write 600+ word expert articles about any software trend instantly.</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <input 
            type="text" 
            placeholder="Article Topic (e.g. Why AI is changing SEO in 2026...)" 
            id="ai-blog-topic"
            style={{ flex: 1, padding: '1.2rem', borderRadius: '16px', background: '#0a0a0a', border: '1px solid #333', color: 'white', outline: 'none' }} 
          />
          <button 
            onClick={async () => {
              const topic = (document.getElementById('ai-blog-topic') as HTMLInputElement).value;
              if (!topic) return alert("Please enter a topic");
              setLoading(true);
              const res = await fetch("/api/blog/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ topic, password })
              });
              const data = await res.json();
              setLoading(false);
              if (data.success) {
                alert(`STORY PUBLISHED!\n\n"${data.post.title}" is now live on your blog.`);
                (document.getElementById('ai-blog-topic') as HTMLInputElement).value = "";
              } else {
                alert("Error: " + data.error);
              }
            }}
            disabled={loading}
            style={{ padding: '0 2.5rem', height: '60px', borderRadius: '16px', background: 'white', color: 'black', fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.7rem' }}
          >
            {loading ? <Loader2 className="animate-spin" /> : <><Plus size={20}/> Generate Article</>}
          </button>
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '2.5rem' }}>
        
        {/* Tool Browser */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.4rem' }}>Database Browser</h2>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#666' }} size={16} />
              <input 
                type="text" 
                placeholder="Search tools..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ background: '#111', border: '1px solid #333', borderRadius: '10px', padding: '0.6rem 1rem 0.6rem 2.5rem', color: 'white', fontSize: '0.9rem', outline: 'none' }}
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxHeight: '800px', overflowY: 'auto', paddingRight: '1rem' }} className="custom-scrollbar">
            {/* Categorized List */}
            {Array.from(new Set(filteredTools.map(t => t.category))).sort().map(cat => {
              const catTools = filteredTools.filter(t => t.category === cat);
              return (
                <div key={cat}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>{cat}</span>
                    <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>{catTools.length} items</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {catTools.map(tool => (
                      <div key={tool.slug} style={{ background: '#111', padding: '0.8rem 1rem', borderRadius: '14px', border: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `linear-gradient(135deg, ${tool.color1}, ${tool.color2})`, display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 800, fontSize: '0.8rem' }}>{tool.name.charAt(0)}</div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{tool.name}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button onClick={() => { setFormData(tool); setEditMode(true); window.scrollTo({top: 0, behavior: 'smooth'}); }} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #222', color: 'white', padding: '0.4rem 0.6rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' }}>Edit</button>
                          <button onClick={() => handleDelete(tool.slug)} style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer' }}><Trash2 size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Pro Editor Form */}
        <section style={{ background: '#111', padding: '2.5rem', borderRadius: '28px', border: '1px solid #222' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.4rem' }}>{editMode ? "Manual Editor" : "Quick Add Tool"}</h2>
            {editMode && <button onClick={() => { setEditMode(false); resetForm(); }} style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer' }}>Cancel Edit</button>}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', marginBottom: '1.2rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#666', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Tool Name</label>
              <input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '0.9rem', borderRadius: '12px', background: '#0a0a0a', border: '1px solid #333', color: 'white', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#666', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Category</label>
              <input value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} style={{ width: '100%', padding: '0.9rem', borderRadius: '12px', background: '#0a0a0a', border: '1px solid #333', color: 'white', outline: 'none' }} />
            </div>
          </div>

          <div style={{ marginBottom: '1.2rem' }}>
             <label style={{ display: 'block', fontSize: '0.75rem', color: '#666', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Affiliate / Website URL</label>
             <input value={formData.websiteUrl} onChange={(e) => setFormData({...formData, websiteUrl: e.target.value})} placeholder="https://..." style={{ width: '100%', padding: '0.9rem', borderRadius: '12px', background: '#0a0a0a', border: '1px solid #333', color: 'var(--brand-primary)', outline: 'none', fontWeight: 600 }} />
          </div>

          <div style={{ marginBottom: '1.2rem' }}>
             <label style={{ display: 'block', fontSize: '0.75rem', color: '#666', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Card Description (Short)</label>
             <input value={formData.shortDescription} onChange={(e) => setFormData({...formData, shortDescription: e.target.value})} style={{ width: '100%', padding: '0.9rem', borderRadius: '12px', background: '#0a0a0a', border: '1px solid #333', color: 'white', outline: 'none' }} />
          </div>

          <div style={{ marginBottom: '1.2rem' }}>
             <label style={{ display: 'block', fontSize: '0.75rem', color: '#666', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Deep Review (3+ Paragraphs)</label>
             <textarea value={formData.longDescription} onChange={(e) => setFormData({...formData, longDescription: e.target.value})} style={{ width: '100%', padding: '1rem', borderRadius: '12px', background: '#0a0a0a', border: '1px solid #333', color: 'white', minHeight: '180px', outline: 'none', lineHeight: 1.6 }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
             <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#666', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Base Price</label>
                <input type="number" value={formData.basePrice} onChange={(e) => setFormData({...formData, basePrice: parseInt(e.target.value)})} style={{ width: '100%', padding: '0.9rem', borderRadius: '12px', background: '#0a0a0a', border: '1px solid #333', color: 'white', outline: 'none' }} />
             </div>
             <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#666', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Ease (%)</label>
                <input type="number" value={formData.ease} onChange={(e) => setFormData({...formData, ease: parseInt(e.target.value)})} style={{ width: '100%', padding: '0.9rem', borderRadius: '12px', background: '#0a0a0a', border: '1px solid #333', color: 'white', outline: 'none' }} />
             </div>
             <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#666', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Features Score</label>
                <input type="number" value={formData.featuresScore} onChange={(e) => setFormData({...formData, featuresScore: parseInt(e.target.value)})} style={{ width: '100%', padding: '0.9rem', borderRadius: '12px', background: '#0a0a0a', border: '1px solid #333', color: 'white', outline: 'none' }} />
             </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button onClick={handleSave} disabled={loading} style={{ width: '100%', padding: '1.2rem', borderRadius: '16px', background: 'white', color: 'black', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.7rem', transition: 'background 0.2s' }}>
               {loading ? <Loader2 className="animate-spin" /> : <><Save size={20}/> {editMode ? "Commit Changes" : "Publish to Site"}</>}
            </button>
          </div>

          {status.message && (
            <div style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '12px', background: status.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 129, 0.1)', color: status.type === 'success' ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
              {status.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />} {status.message}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
