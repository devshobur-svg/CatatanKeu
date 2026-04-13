import React, { useState } from "react";
import { auth, googleProvider } from "../lib/firebase";
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  createUserWithEmailAndPassword 
} from "firebase/auth";
import { 
  Mail, Lock, Chrome, ArrowRight, 
  ShieldCheck, Sparkles, BarChart3 
} from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      alert(err.message);
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center px-8 relative overflow-hidden">
      
      {/* BACKGROUND DECOR (DNA MAESTRO) */}
      <div className="absolute -top-20 -left-20 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px]" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px]" />

      <div className="w-full max-w-sm relative z-10 space-y-10 text-center">
        
        {/* LOGO SECTION */}
        <div className="space-y-4 animate-in fade-in zoom-in duration-700">
          <div className="w-20 h-20 bg-blue-600 rounded-[2.5rem] mx-auto flex items-center justify-center shadow-2xl shadow-blue-600/40 border border-white/10">
            <BarChart3 size={36} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white">
              Finansialku<span className="text-blue-500">.</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] mt-1">
              Smart Money Management
            </p>
          </div>
        </div>

        {/* WELCOME TEXT */}
        <div className="space-y-1">
          <h2 className="text-xl font-black text-white uppercase italic tracking-tight">
            {isRegister ? "Create Maestro Account" : "Welcome Back"}
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {isRegister ? "Start your financial legacy" : "Manage your budget easily"}
          </p>
        </div>

        {/* AUTH FORM */}
        <form onSubmit={handleAuth} className="space-y-4">
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-all" size={18} />
            <input 
              type="email" placeholder="EMAIL ADDRESS" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/5 p-5 pl-14 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest text-white outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-600"
              required
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-all" size={18} />
            <input 
              type="password" placeholder="PASSWORD" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/5 p-5 pl-14 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest text-white outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-600"
              required
            />
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black uppercase text-[11px] tracking-[0.3em] shadow-2xl shadow-blue-600/30 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <Sparkles className="animate-spin" /> : (
              <>
                {isRegister ? "Get Started" : "Sign In"} <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* OR DIVIDER */}
        <div className="flex items-center gap-4 py-2">
          <div className="flex-1 h-[1px] bg-white/5" />
          <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Or Continue With</span>
          <div className="flex-1 h-[1px] bg-white/5" />
        </div>

        {/* GOOGLE AUTH */}
        <button 
          onClick={handleGoogle}
          className="w-full py-5 bg-white/5 border border-white/5 text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 hover:bg-white/10 active:scale-95 transition-all"
        >
          <Chrome size={18} className="text-blue-400" /> Google Account
        </button>

        {/* TOGGLE AUTH MODE */}
        <button 
          onClick={() => setIsRegister(!isRegister)}
          className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-400 transition-all"
        >
          {isRegister ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
        </button>

      </div>

      {/* FOOTER SECURITY INFO */}
      <div className="absolute bottom-10 flex items-center gap-2 text-[8px] font-black text-slate-700 uppercase tracking-[0.3em] italic">
        <ShieldCheck size={12} /> Encrypted Secure Access
      </div>

    </div>
  );
};

export default Login;