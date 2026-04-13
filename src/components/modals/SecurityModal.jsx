import React, { useState } from "react";
import { X, Delete, ShieldCheck, KeyRound, Lock, CheckCircle2 } from "lucide-react";

const SecurityModal = ({ show, setShow, onUpdatePin }) => {
  const [step, setStep] = useState(1); // 1: Old PIN, 2: New PIN, 3: Confirm PIN
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState(false);

  if (!show) return null;

  const storedPin = localStorage.getItem("user_pin") || "1234";

  const handleNumpad = (num) => {
    setError(false);
    if (step === 1) {
      if (oldPin.length < 4) {
        const val = oldPin + num;
        setOldPin(val);
        if (val.length === 4) {
          if (val === storedPin) {
            setTimeout(() => setStep(2), 300);
          } else {
            triggerError(() => setOldPin(""));
          }
        }
      }
    } else if (step === 2) {
      if (newPin.length < 4) {
        const val = newPin + num;
        setNewPin(val);
        if (val.length === 4) setTimeout(() => setStep(3), 300);
      }
    } else if (step === 3) {
      if (confirmPin.length < 4) {
        const val = confirmPin + num;
        setConfirmPin(val);
        if (val.length === 4) {
          if (val === newPin) {
            onUpdatePin(val); // Execute update in App.jsx
            resetAll();
          } else {
            triggerError(() => setConfirmPin(""));
          }
        }
      }
    }
  };

  const triggerError = (callback) => {
    setError(true);
    if (navigator.vibrate) navigator.vibrate(200);
    setTimeout(() => {
      setError(false);
      callback();
    }, 500);
  };

  const resetAll = () => {
    setStep(1);
    setOldPin("");
    setNewPin("");
    setConfirmPin("");
    setError(false);
    setShow(false);
  };

  const currentVal = step === 1 ? oldPin : step === 2 ? newPin : confirmPin;
  const labels = {
    1: { title: "Verify Access", sub: "Enter your current 4-digit PIN" },
    2: { title: "New Security", sub: "Set your new 4-digit PIN" },
    3: { title: "Confirmation", sub: "Re-enter your new PIN to confirm" }
  };

  return (
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4">
      {/* BACKDROP */}
      <div className="absolute inset-0 bg-slate-950/98 backdrop-blur-2xl" onClick={resetAll} />

      <div className="relative w-full max-w-sm bg-[#0F172A] border border-white/10 rounded-[3.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-8 space-y-8">
          
          {/* HEADER */}
          <div className="flex justify-between items-center">
            <button onClick={resetAll} className="p-2 text-slate-500 hover:text-white"><X size={20}/></button>
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 italic">Security Maestro</h2>
            <div className="w-9" />
          </div>

          {/* STATUS DISPLAY */}
          <div className="text-center space-y-3">
            <div className={`mx-auto w-16 h-16 rounded-3xl flex items-center justify-center transition-all duration-300 ${error ? 'bg-rose-500/20 text-rose-500 animate-shake' : 'bg-blue-600/10 text-blue-500'}`}>
              {step === 1 ? <Lock size={28}/> : step === 2 ? <KeyRound size={28}/> : <CheckCircle2 size={28}/>}
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-widest text-white">{labels[step].title}</h1>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">{labels[step].sub}</p>
            </div>
          </div>

          {/* PIN DOTS */}
          <div className="flex justify-center gap-5 my-4">
            {[1, 2, 3, 4].map((dot) => (
              <div 
                key={dot} 
                className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-300 ${
                  currentVal.length >= dot 
                    ? 'bg-blue-500 border-blue-500 scale-110 shadow-[0_0_15px_rgba(59,130,246,0.5)]' 
                    : 'border-slate-800'
                } ${error ? 'bg-rose-500 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]' : ''}`}
              />
            ))}
          </div>

          {/* NUMPAD */}
          <div className="grid grid-cols-3 gap-y-4 gap-x-10 py-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "delete"].map((key, i) => (
              <button
                key={i}
                onClick={() => key === "delete" ? (step === 1 ? setOldPin(oldPin.slice(0,-1)) : step === 2 ? setNewPin(newPin.slice(0,-1)) : setConfirmPin(confirmPin.slice(0,-1))) : key !== "" && handleNumpad(key.toString())}
                className={`flex items-center justify-center py-4 rounded-2xl transition-all active:scale-75 ${
                  key === "delete" ? "text-slate-600 hover:text-rose-500" : "text-white text-xl font-black italic hover:bg-white/5"
                }`}
              >
                {key === "delete" ? <Delete size={22} /> : key}
              </button>
            ))}
          </div>

          {/* INDICATOR STEP */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-1 rounded-full transition-all duration-500 ${step === i ? 'w-8 bg-blue-600' : 'w-2 bg-slate-800'}`} />
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default SecurityModal;