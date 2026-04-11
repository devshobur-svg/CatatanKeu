import React, { useState, useRef } from "react";
import { X, Camera, Sparkles, Loader2, Check, AlertCircle } from "lucide-react";
import Tesseract from "tesseract.js";

const ScannerModal = ({ show, setShow, setForm, setShowAddTransaction, showNotice }) => {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  if (!show) return null;

  const handleScanReceipt = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 1. Tampilkan Preview & Start Loading
    setPreview(URL.createObjectURL(file));
    setLoading(true);

    try {
      // 2. OCR Engine Process
      const { data: { text } } = await Tesseract.recognize(file, 'eng', {
        logger: m => console.log(m) 
      });

      console.log("Raw Scanned Text:", text);

      // 3. Logic "Magic" Penemuan Nominal (Regex)
      // Mencari pola angka yang biasanya ada di struk (misal: Total 50.000 atau 50000)
      const lines = text.split('\n');
      let detectedAmount = "";

      // Cari kata kunci umum struk Indonesia
      const keywords = ["TOTAL", "JUMLAH", "SUBTOTAL", "NET"];
      
      for (let line of lines) {
        const upperLine = line.toUpperCase();
        if (keywords.some(key => upperLine.includes(key))) {
          // Ambil angka saja dari baris tersebut
          const amountMatch = line.replace(/[,.]/g, '').match(/\d+/);
          if (amountMatch) {
            detectedAmount = amountMatch[0];
            break; 
          }
        }
      }

      // Fallback: Kalau keyword gak ketemu, cari angka terbesar di dokumen
      if (!detectedAmount) {
        const allNumbers = text.replace(/[,.]/g, '').match(/\d+/g);
        if (allNumbers) {
          const numbers = allNumbers.map(Number).filter(n => n > 1000); // Filter recehan
          detectedAmount = Math.max(...numbers).toString();
        }
      }

      if (detectedAmount) {
        // 4. Auto-Fill ke Form Utama
        setForm(prev => ({ 
          ...prev, 
          amount: detectedAmount,
          note: "Scanned Receipt " + new Date().toLocaleDateString()
        }));
        
        showNotice("Magic! Nominal terdeteksi: Rp " + detectedAmount);
        
        // Tutup scanner, buka modal transaksi
        setTimeout(() => {
          setShow(false);
          setShowAddTransaction(true);
          resetScanner();
        }, 1500);
      } else {
        showNotice("Gagal baca nominal, coba foto lebih jelas", "error");
      }

    } catch (err) {
      console.error(err);
      showNotice("Gagal memproses gambar", "error");
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setPreview(null);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={() => setShow(false)}></div>
      
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[3rem] overflow-hidden shadow-2xl border border-white/10">
        
        {/* HEADER */}
        <div className="p-6 flex justify-between items-center border-b dark:border-white/5">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">AI Scanner</h2>
          <button onClick={() => setShow(false)} className="p-2 text-slate-400 hover:text-rose-500"><X size={20}/></button>
        </div>

        {/* BODY */}
        <div className="p-8 space-y-6">
          <div className="relative aspect-[3/4] bg-slate-100 dark:bg-slate-800 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center overflow-hidden">
            {preview ? (
              <>
                <img src={preview} className="w-full h-full object-cover opacity-50" alt="receipt" />
                {loading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                    <Loader2 size={40} className="text-blue-500 animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">Reading Receipt...</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mx-auto">
                    <Camera size={30} />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight px-10">
                    Upload atau Foto Struk Belanja Lo
                </p>
              </div>
            )}
          </div>

          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleScanReceipt}
          />

          {!loading && (
            <button 
              onClick={() => fileInputRef.current.click()}
              className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20"
            >
              <Sparkles size={16}/> {preview ? 'Coba Lagi' : 'Ambil Foto'}
            </button>
          )}
        </div>

        {/* TIPS */}
        <div className="p-6 bg-slate-50 dark:bg-white/5 flex items-start gap-3">
          <AlertCircle size={16} className="text-blue-500 shrink-0"/>
          <p className="text-[9px] font-medium text-slate-400 leading-relaxed uppercase">
            Pastikan tulisan "TOTAL" terlihat jelas dan cahaya cukup agar AI bekerja maksimal.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ScannerModal;