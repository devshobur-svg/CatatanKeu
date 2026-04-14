import React, { useState, useEffect } from "react";
import { Delete, Lock, ShieldPlus, ShieldAlert, LogOut, KeyRound } from "lucide-react";
import { auth } from "../lib/firebase"; 

const SecurityLock = ({ onUnlock }) => {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [attempts, setAttempts] = useState(0); 
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const storedPin = localStorage.getItem("user_pin");

  useEffect(() => {
    if (!storedPin) {
      setIsSetupMode(true);
    }
  }, [storedPin]);

  const handleForceLogout = async () => {
    setIsLoggingOut(true);
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    setTimeout(async () => {
      await auth.signOut();
    }, 1500);
  };

  // HANDLER LUPA PIN
  const handleForgotPin = async () => {
    if (window.confirm("Lupa PIN? Lo harus login ulang buat reset keamanan Maestro lo.")) {
      setIsLoggingOut(true);
      // Hapus PIN lama biar pas login lagi langsung masuk mode SETUP
      localStorage.removeItem("user_pin"); 
      await auth.signOut();
    }
  };

  const handleNumpad = (num) => {
    if (isLoggingOut) return;

    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      
      if (newPin.length === 4) {
        if (isSetupMode) {
          localStorage.setItem("user_pin", newPin);
          if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
          onUnlock(); 
        } else {
          if (newPin === storedPin) {
            setAttempts(0);
            onUnlock();
          } else {
            const newAttempts = attempts + 1;
            setAttempts(newAttempts);
            setError(true);
            if (navigator.vibrate) navigator.vibrate(200);

            if (newAttempts >= 3) {
              handleForceLogout();
            } else {
              setTimeout(() => { 
                setPin(""); 
                setError(false); 
              }, 500);
            }
          }
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center p-8 animate-in fade-in duration-500 overflow-y-auto">
      
      {/* HEADER SECTION */}
      <div className="mb-10 text-center space-y-4">
        <div className={`p-6 rounded-[2rem] mx-auto w-fit transition-all duration-300 ${
            isLoggingOut ? 'bg-rose-600 text-white animate-bounce' :
            error ? 'animate-shake text-rose-500 bg-rose-500/20' : 'bg-blue-600/10 text-blue-500'
        }`}>
          {isLoggingOut ? <LogOut size={40} /> : 
           isSetupMode ? <ShieldPlus size={40} /> : <Lock size={40} />}
        </div>
        
        <div className="space-y-1">
          <h1 className="text-xl font-black uppercase tracking-[0.2em] text-white italic">
            {isLoggingOut ? "Access Denied" : isSetupMode ? "Setup Security" : "Security Check"}
          </h1>
          <p className={`text-[9px] font-bold uppercase tracking-[0.3em] ${attempts > 0 ? 'text-rose-500' : 'text-slate-500'}`}>
            {isLoggingOut ? "Security action in progress..." : 
             attempts > 0 ? `Warning: ${3 - attempts} attempts remaining` :
             isSetupMode ? "Set a 4-digit PIN for your safety" : "Enter PIN to access your data"}
          </p>
        </div>
      </div>

      {/* PIN DOTS */}
      <div className="flex gap-6 mb-12">
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
      <div className={`grid grid-cols-3 gap-6 transition-opacity duration-300 ${isLoggingOut ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button 
            key={num} 
            onClick={() => handleNumpad(num.toString())}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-900/40 text-2xl font-black italic text-white hover:bg-blue-600 active:scale-90 transition-all border border-white/5 backdrop-blur-sm"
          >
            {num}
          </button>
        ))}
        
        <button 
          onClick={handleForgotPin}
          className="w-16 h-16 sm:w-20 sm:h-20 flex flex-col items-center justify-center text-slate-600 hover:text-blue-400 transition-all group"
        >
          <KeyRound size={20} className="group-active:scale-75 transition-all" />
          <span className="text-[7px] font-black uppercase mt-1 tracking-tighter">Forgot?</span>
        </button>
        
        <button 
          onClick={() => handleNumpad("0")}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-900/40 text-2xl font-black italic text-white hover:bg-blue-600 active:scale-90 transition-all border border-white/5"
        >
          0
        </button>

        <button 
          onClick={() => setPin(pin.slice(0, -1))}
          className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center text-slate-500 hover:text-white active:scale-90 transition-all"
        >
          <Delete size={28} />
        </button>
      </div>

      {/* FOOTER INFO */}
      <div className="mt-12 text-center">
        <p className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-800 italic">
          FinansialKu Encryption Active
        </p>
      </div>
    </div>
  );
};

export default SecurityLock;