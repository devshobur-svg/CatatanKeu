import React from "react";
import { Camera, Loader2, Sparkles, X } from "lucide-react";
import { createWorker } from 'tesseract.js';

const ScannerModal = ({ show, setShow, darkMode, setIsScanning, isScanning, setForm, setShowAddTransaction, showNotice }) => {
  if (!show) return null;

  const handleScan = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsScanning(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(reader.result);
      await worker.terminate();

      // Logic deteksi angka nominal (mencari angka > 1000)
      const detected = Math.max(...(text.replace(/[.,]/g, '').match(/\d+/g)?.map(Number).filter(n => n > 1000) || [0]));
      
      if (detected > 0) setForm(prev => ({ ...prev, amount: detected.toString() }));
      
      setIsScanning(false);
      setShow(false);
      setShowAddTransaction(true);
      showNotice("Struk Terdeteksi!");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in zoom-in">
      <div className={`w-full max-w-sm p-10 rounded-[4rem] text-center ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white shadow-2xl'}`}>
        <h2 className="font-black text-blue-600 text-lg uppercase mb-8 tracking-tighter italic">Receipt Scanner</h2>
        <div className={`w-full aspect-square rounded-[3.5rem] border-4 border-dashed flex flex-col items-center justify-center gap-4 transition-all ${isScanning ? 'border-blue-500 animate-pulse' : 'border-slate-300 dark:border-slate-700 opacity-40'}`}>
          {isScanning ? (
            <><Loader2 size={50} className="animate-spin text-blue-600" /><p className="text-[10px] font-black text-blue-600 uppercase">Scanning...</p></>
          ) : (
            <Camera size={50} className="text-slate-300" />
          )}
        </div>
        <label className="w-full bg-blue-600 text-white py-6 rounded-[2.5rem] font-black uppercase text-[11px] shadow-xl mt-10 cursor-pointer flex items-center justify-center gap-3 active:scale-95 transition-all">
          <Sparkles size={18}/> Scan Receipt
          <input type="file" accept="image/*" className="hidden" onChange={handleScan} disabled={isScanning} />
        </label>
        <button onClick={() => setShow(false)} className="w-full mt-6 text-[10px] font-black uppercase opacity-30 text-slate-500">Close</button>
      </div>
    </div>
  );
};

export default ScannerModal;