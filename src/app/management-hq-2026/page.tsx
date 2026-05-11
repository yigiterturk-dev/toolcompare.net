"use client";

import { useState, useEffect } from "react";
import { 
  Settings, Plus, Trash2, Save, LogOut, 
  Database, Layout, Activity, CheckCircle, Mail, Zap, Cloud, BarChart3, Shield,
  Loader2, Check, AlertCircle
} from "lucide-react";

const ICON_OPTIONS = ["Zap", "Cloud", "BarChart3", "Database", "Activity", "CheckCircle", "Layout", "Mail", "Shield"];

export default function AdminPanel() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [tools, setTools] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  
  // Form State for adding/editing
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<any>({
    slug: "", name: "", category: "", iconName: "Zap",
    color1: "#6366f1", color2: "#a855f7",
    ease: 90, featuresScore: 90, basePrice: 20, isFlat: false,
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
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "toolpass99") { // In production, this check happens on API too
      setIsLoggedIn(true);
    } else {
      alert("Incorrect Password");
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
      setStatus({ type: "success", message: "Data saved successfully!" });
      fetchTools();
      setEditMode(false);
      resetForm();
    } else {
      setStatus({ type: "error", message: "Error saving data." });
    }
    setLoading(false);
    setTimeout(() => setStatus({ type: "", message: "" }), 3000);
  };

  const handleDelete = async (slug: string) => {
    if (!confirm("Are you sure you want to delete this tool?")) return;
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
        shortDescription: "", longDescription: "", targetAudience: "", verdict: "",
        pros: ["", "", ""], cons: ["", ""],
        keyFeatures: [{title: "", description: ""}]
    });
  };

  if (!isLoggedIn) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#050505' }}>
        <form onSubmit={handleLogin} style={{ background: '#111', padding: '3rem', borderRadius: '24px', border: '1px solid #222', width: '400px' }}>
          <h2 style={{ color: 'white', marginBottom: '2rem', textAlign: 'center' }}>Secure Admin Access</h2>
          <input 
            type="password" 
            placeholder="Enter Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '1rem', borderRadius: '12px', background: '#050505', border: '1px solid #333', color: 'white', marginBottom: '1.5rem' }} 
          />
          <button type="submit" style={{ width: '100%', padding: '1rem', borderRadius: '12px', background: 'white', color: 'black', fontWeight: 700, border: 'none', cursor: 'pointer' }}>Login</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: 'white', padding: '3rem 5%' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><Settings /> ToolCompare Admin</h1>
        <button onClick={() => setIsLoggedIn(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.6rem 1.2rem', borderRadius: '10px', cursor: 'pointer' }}><LogOut size={18} /> Logout</button>
      </header>

      {/* AI Generator Section */}
      <section style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1))', border: '1px solid var(--brand-primary)', borderRadius: '24px', padding: '2rem', marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Zap color="var(--brand-primary)" /> AI Content Factory</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Enter a category to bulk-generate high-quality reviews and tools instantly.</p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <input 
            type="text" 
            placeholder="e.g. Email Marketing, CRM, Video Editors..." 
            id="ai-category"
            style={{ flex: 1, padding: '1rem', borderRadius: '12px', background: '#050505', border: '1px solid #333', color: 'white' }} 
          />
          <button 
            onClick={async () => {
              const cat = (document.getElementById('ai-category') as HTMLInputElement).value;
              if (!cat) return alert("Please enter a category");
              setLoading(true);
              const res = await fetch("/api/tools/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ category: cat, count: 5, password })
              });
              const data = await res.json();
              setLoading(false);
              if (data.success) {
                alert(`Successfully added ${data.addedCount} tools!`);
                fetchTools();
              } else {
                alert("Error: " + data.error);
              }
            }}
            disabled={loading}
            style={{ padding: '0 2rem', borderRadius: '12px', background: 'white', color: 'black', fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {loading ? <Loader2 className="animate-spin" /> : "Generate 5 Tools"}
          </button>
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '3rem' }}>
        
        {/* List of Tools */}
        <section>
          <h2 style={{ marginBottom: '2rem' }}>Manage Existing Tools</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {tools.map(tool => (
              <div key={tool.slug} style={{ background: '#111', padding: '1.2rem', borderRadius: '16px', border: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{tool.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>{tool.slug}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => { setFormData(tool); setEditMode(true); }} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #333', color: 'white', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => handleDelete(tool.slug)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer' }}><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Editor Form */}
        <section style={{ background: '#111', padding: '3rem', borderRadius: '24px', border: '1px solid #222' }}>
          <h2 style={{ marginBottom: '2rem' }}>{editMode ? "Edit Tool" : "Add New Tool"}</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>Name</label>
              <input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', background: '#050505', border: '1px solid #333', color: 'white' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>Slug (URL)</label>
              <input value={formData.slug} onChange={(e) => setFormData({...formData, slug: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', background: '#050505', border: '1px solid #333', color: 'white' }} />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
             <label style={{ display: 'block', fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>Short Description</label>
             <textarea value={formData.shortDescription} onChange={(e) => setFormData({...formData, shortDescription: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', background: '#050505', border: '1px solid #333', color: 'white', minHeight: '60px' }} />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
             <label style={{ display: 'block', fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>Full Review (Markdown-ish)</label>
             <textarea value={formData.longDescription} onChange={(e) => setFormData({...formData, longDescription: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', background: '#050505', border: '1px solid #333', color: 'white', minHeight: '150px' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
             <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>Base Price ($)</label>
                <input type="number" value={formData.basePrice} onChange={(e) => setFormData({...formData, basePrice: parseInt(e.target.value)})} style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', background: '#050505', border: '1px solid #333', color: 'white' }} />
             </div>
             <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>Price Type</label>
                <select value={formData.isFlat ? "true" : "false"} onChange={(e) => setFormData({...formData, isFlat: e.target.value === "true"})} style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', background: '#050505', border: '1px solid #333', color: 'white' }}>
                   <option value="false">Per User / Mo</option>
                   <option value="true">Flat Rate / Mo</option>
                </select>
             </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
            <button onClick={resetForm} style={{ flex: 1, padding: '1rem', borderRadius: '12px', background: 'transparent', border: '1px solid #333', color: 'white', cursor: 'pointer' }}>Reset</button>
            <button onClick={handleSave} disabled={loading} style={{ flex: 2, padding: '1rem', borderRadius: '12px', background: 'var(--brand-primary)', border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
               {loading ? <Loader2 className="animate-spin" /> : <Save />} {editMode ? "Update Tool" : "Save Tool"}
            </button>
          </div>

          {status.message && (
            <div style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '12px', background: status.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: status.type === 'success' ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {status.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />} {status.message}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
