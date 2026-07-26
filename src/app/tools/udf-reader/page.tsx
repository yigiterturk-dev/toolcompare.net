"use client";
import { useState } from "react";
import JSZip from "jszip";
import { FileText, Upload, Download, ArrowLeft, RefreshCw, Shield, Scale, Info, Search, FileCheck } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function UdfReader() {
  const [content, setContent] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".udf")) {
      setError("GEÇERSİZ FORMAT: LÜTFEN .UDF DOKÜMANI YÜKLEYİNİZ");
      return;
    }

    setIsLoading(true);
    setError("");
    setFileName(file.name);

    try {
      const zip = await JSZip.loadAsync(file);
      const contentXml = await zip.file("content.xml")?.async("string");

      if (!contentXml) {
        throw new Error("UDF içeriği (content.xml) bulunamadı.");
      }

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(contentXml, "text/xml");
      const textNodes = xmlDoc.getElementsByTagName("content");
      let extractedText = "";

      if (textNodes.length > 0) {
        for (let i = 0; i < textNodes.length; i++) {
          extractedText += textNodes[i].textContent + "\n";
        }
      } else {
        extractedText = xmlDoc.documentElement.textContent || "";
      }

      setContent(extractedText.trim());
    } catch (err) {
      console.error(err);
      setError("DOSYA ANALİZ HATASI: BELGE OKUNAMADI");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadText = () => {
    const element = document.createElement("a");
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = fileName.replace(".udf", ".txt");
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-[#6366f1]/30 font-sans">
      <Header />
      
      <div className="ambient-bg">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
      </div>

      <div className="container mx-auto max-w-5xl px-6 py-32">
        
        <main>
          <AnimatePresence mode="wait">
            {!content && !isLoading ? (
              <motion.div 
                key="upload"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl mx-auto"
              >
                <div className="text-center mb-12">
                  <h1 className="text-4xl font-bold mb-4 tracking-tight">Legal <span className="text-[#6366f1]">UDF Reader</span></h1>
                  <p className="text-zinc-400 text-lg max-w-sm mx-auto leading-relaxed">
                    UYAP dökümanlarınızı güvenli bir şekilde görüntüleyin ve metin formatına dönüştürün.
                  </p>
                </div>

                <div className="bg-[#111] rounded-3xl shadow-2xl border border-white/5 p-16 text-center cursor-pointer relative group overflow-hidden transition-all hover:border-white/10">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-right from-[#6366f1] to-[#a855f7]"></div>
                  <input 
                    type="file" 
                    aria-label="UDF document"
                    accept=".udf"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  <div className="flex flex-col items-center gap-8">
                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center text-white group-hover:bg-[#6366f1]/10 transition-colors">
                      <Upload className="w-10 h-10 opacity-60 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">UDF Dosyası Yükleyiniz</h3>
                      <p className="text-zinc-500 text-sm">Sürükleyip bırakın veya göz atın</p>
                    </div>
                    <div className="flex items-center gap-2 px-8 py-3 bg-[#6366f1] text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-transform group-hover:scale-105 shadow-lg shadow-[#6366f1]/20">
                      Dosya Seçin
                    </div>
                  </div>
                  {error && <div className="mt-8 p-4 bg-red-500/10 text-red-500 rounded-2xl text-xs font-bold border border-red-500/20">{error}</div>}
                </div>

                <div className="mt-12 grid grid-cols-3 gap-8">
                  {[
                    { icon: Shield, label: "Gizli", desc: "Verileriniz saklanmaz" },
                    { icon: RefreshCw, label: "Hızlı", desc: "Saniyeler içinde" },
                    { icon: FileCheck, label: "Tam", desc: "XML tabanlı analiz" }
                  ].map((item, i) => (
                    <div key={i} className="text-center">
                      <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <item.icon className="w-5 h-5 text-[#6366f1]" />
                      </div>
                      <h4 className="text-[11px] font-bold uppercase tracking-widest mb-1">{item.label}</h4>
                      <p className="text-[10px] text-zinc-500">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : isLoading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-[#111] rounded-3xl shadow-2xl p-24 text-center max-w-2xl mx-auto border border-white/5"
              >
                <div className="w-16 h-16 border-4 border-[#6366f1]/20 border-t-[#6366f1] rounded-full animate-spin mx-auto mb-6"></div>
                <h3 className="text-xl font-bold text-white mb-2">Döküman Çözümleniyor</h3>
                <p className="text-zinc-500 text-xs uppercase tracking-widest">Lütfen bekleyiniz...</p>
              </motion.div>
            ) : (
              <motion.div 
                key="content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Result Control Bar */}
                <div className="bg-[#111] rounded-2xl shadow-xl border border-white/5 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#6366f1]/10 rounded-xl flex items-center justify-center text-[#6366f1]">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-white">{fileName}</h4>
                      <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">İçerik Başarıyla Ayrıştırıldı</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setContent("")}
                      className="px-6 py-3 bg-white/5 text-zinc-300 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5"
                    >
                      Yeni Belge
                    </button>
                    <button 
                      onClick={downloadText}
                      className="flex items-center gap-2 px-8 py-3 bg-[#6366f1] text-white rounded-xl text-[11px] font-bold uppercase tracking-widest hover:scale-105 transition-transform shadow-lg shadow-[#6366f1]/20"
                    >
                      <Download className="w-4 h-4" />
                      METİN OLARAK KAYDET
                    </button>
                  </div>
                </div>

                {/* The Legal Document Viewer */}
                <div className="bg-[#111] rounded-[32px] shadow-2xl border border-white/5 overflow-hidden">
                  <div className="bg-white/5 px-8 py-5 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-[#6366f1]" />
                      <span className="text-[11px] font-bold tracking-[0.2em] text-zinc-400 uppercase">Resmi Doküman Görüntüleyici</span>
                    </div>
                    <div className="flex gap-4">
                      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Görünüm: Standart (A4)</div>
                    </div>
                  </div>
                  <div className="p-12 sm:p-20 bg-white min-h-[600px] max-h-[1000px] overflow-y-auto">
                    <div className="max-w-2xl mx-auto font-serif text-[18px] leading-[1.8] text-[#1e293b] whitespace-pre-wrap text-justify selection:bg-[#6366f1]/30">
                      {content}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <footer className="mt-20 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/5 rounded-full text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-6 border border-white/5">
            <Search className="w-3 h-3 text-[#6366f1]" />
            UYAP v3 / UDF v2 Protokolleri ile uyumludur
          </div>
          <p className="text-zinc-500 text-[11px] leading-relaxed max-w-xs mx-auto opacity-60">
            ToolCompare Hukuk Teknolojileri Birimi tarafından <br />
            güvenli analiz için geliştirilmiştir.
          </p>
        </footer>
      </div>
      <Footer />
    </div>
  );
}
