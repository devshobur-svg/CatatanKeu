import React, { useState, useRef } from "react";
import { X, Camera, Sparkles, Loader2, Check } from "lucide-react";
import Tesseract from "tesseract.js";

const ScannerModal = ({ show, setShow, setForm, setShowAddTransaction, showNotice }) => {
  const [scanning, setScanning] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  if (!show) return null;

  const handleCapture = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Tampilkan preview foto
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);

    setScanning(true);
    showNotice("Sedang membaca struk...", "success");

    try {
      // PROSES OCR (Membaca Teks dari Gambar)
      const { data: { text } } = await Tesseract.recognize(file, 'ind+eng', {
        logger: m => console.log(m)
      });

      console.log("Raw OCR Text:", text);
      
      // SMART REGEX: Mencari nominal uang (biasanya setelah kata TOTAL, AMOUNT, atau Rp)
      const cleanedText = text.replace(/[,.]/g, ""); // Hilangkan pemisah ribuan biar gampang di-regex
      const moneyMatches = cleanedText.match(/\d{4,}/g); // Cari deretan angka minimal 4 digit

      if (moneyMatches) {
        // Ambil angka terbesar (biasanya Total ada di angka paling besar di struk)
        const totalAmount = Math.max(...moneyMatches.map(Number));
        
        setForm(prev => ({ ...prev, amount: totalAmount.toString(), note: "Scanned from Receipt" }));
        showNotice(`Berhasil! Terdeteksi: Rp ${totalAmount}`, "success");
        
        // Tutup scanner & buka modal transaksi
        setTimeout(() => {
          setShow(false);
          setShowAddTransaction(true);
          setPreview(null);
          setScanning(false);
        }, 1500);
      } else {
        showNotice("Gagal mendeteksi nominal, input manual ya bro!", "error");
        setScanning(false);
      }
    } catch (error) {
      console.error("OCR Error:", error);
      showNotice("Error saat membaca struk", "error");
      setScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/98 backdrop-blur-2xl" onClick={() => !scanning && setShow(false)} />
      
      <div className="relative w-full max-w-sm bg-[#0F172A] border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95">
        
        <div className="p-8 text-center space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-blue-500">Magic Scanner</h2>
            <button onClick={() => setShow(false)} className="text-slate-500"><X size={20}/></button>
          </div>

          <div className="aspect-[3/4] bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-white/10 flex flex-col items-center justify-center overflow-hidden relative">
            {preview ? (
              <img src={preview} alt="Receipt" className="w-full h-full object-cover opacity-50" />
            ) : (
              <Camera size={48} className="text-slate-700 mb-4" />
            )}

            {scanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-blue-600/20 backdrop-blur-sm">
                <Loader2 size={40} className="text-white animate-spin mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white animate-pulse">AI Processing...</p>
              </div>
            )}

            {!preview && !scanning && (
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Ambil foto struk lo</p>
            )}
          </div>

          <button 
            disabled={scanning}
            onClick={() => fileInputRef.current.click()}
            className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] shadow-xl shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {scanning ? "Processing..." : "Capture Receipt"}
          </button>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleCapture} 
            accept="image/*" 
            capture="environment" // Langsung buka kamera di HP
            className="hidden" 
          />
        </div>
      </div>
    </div>
  );
};

export default ScannerModal;