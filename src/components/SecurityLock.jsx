import React, { useState, useEffect } from "react";
import { Delete, Lock, ShieldPlus, ShieldCheck } from "lucide-react";

const SecurityLock = ({ onUnlock }) => {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [isSetupMode, setIsSetupMode] = useState(false);

  // Ambil data PIN dari storage
  const storedPin = localStorage.getItem("user_pin");

  useEffect(() => {
    // ANALISA: Jika tidak ada data PIN di storage, 
    // sistem otomatis switch ke mode 'Setup' untuk user baru.
    if (!storedPin) {
      setIsSetupMode(true);
    }
  }, [storedPin]);

  const handleNumpad = (num) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      
      if (newPin.length === 4) {
        if (isSetupMode) {
          // --- SCENARIO 1: USER BARU (CREATE PIN) ---
          localStorage.setItem("user_pin", newPin);
          // Beri feedback sukses sebelum unlock
          if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
          onUnlock(); 
        } else {
          // --- SCENARIO 2: USER LAMA (UNLOCK) ---
          if (newPin === storedPin) {
            onUnlock();
          } else {
            // Feedback error
            setError(true);
            if (navigator.vibrate) navigator.vibrate(200);
            setTimeout(() => { 
              setPin(""); 
              setError(false); 
            }, 500);
          }
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
      
      {/* HEADER: Dinamis sesuai mode */}
      <div className="mb-12 text-center space-y-4">
        <div className={`p-6 rounded-[2rem] bg-blue-600/10 text-blue-500 mx-auto w-fit transition-all duration-300 ${error ? 'animate-shake text-rose-500 bg-rose-500/20' : ''}`}>
          {isSetupMode ? <ShieldPlus size={40} /> : <Lock size={40} />}
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-black uppercase tracking-[0.2em] text-white italic">
            {isSetupMode ? "Setup Security" : "Security Check"}
          </h1>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em]">
            {isSetupMode ? "Set a 4-digit PIN for your safety" : "Enter PIN to access your data"}
          </p>
        </div>
      </div>

      {/* PIN DOTS */}
      <div className="flex gap-6 mb-16">
        {[1, 2, 3, 4].map((dot) => (
          <div 
            key={dot} 
            className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
              pin.length >= dot 
                ? 'bg-blue-500 border-blue-500 scale-125 shadow-[0_0_15px_rgba(59,130,246,0.5)]' 
                : 'border-slate-800 bg-transparent'
            } ${error ? 'border-rose-500 bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]' : ''}`}
          />
        ))}
      </div>

      {/* NUMPAD */}
      <div className="grid grid-cols-3 gap-6 sm:gap-8">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button 
            key={num} 
            onClick={() => handleNumpad(num.toString())}
            className="w-20 h-20 rounded-full bg-slate-900/40 text-2xl font-black italic text-white hover:bg-blue-600 active:scale-90 transition-all border border-white/5 backdrop-blur-sm"
          >
            {num}
          </button>
        ))}
        
        <div className="w-20 h-20" />
        
        <button 
          onClick={() => handleNumpad("0")}
          className="w-20 h-20 rounded-full bg-slate-900/40 text-2xl font-black italic text-white hover:bg-blue-600 active:scale-90 transition-all border border-white/5"
        >
          0
        </button>

        <button 
          onClick={() => setPin(pin.slice(0, -1))}
          className="w-20 h-20 flex items-center justify-center text-slate-500 hover:text-white active:scale-90 transition-all"
        >
          <Delete size={28} />
        </button>
      </div>

      {/* FOOTER INFO */}
      <div className="mt-16 text-center">
        <p className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-800 italic">
          {isSetupMode ? "Setup required on first launch" : "FinansialKu Encryption Active"}
        </p>
      </div>
    </div>
  );
};

export default SecurityLock;