import React, { useState } from "react";
// 1. IMPORT AUTH & PROVIDER DARI LIB LO
import { auth, googleProvider } from "../lib/firebase";

// 2. IMPORT SEMUA FUNGSI FIREBASE AUTH SECARA EKSPLISIT
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from "firebase/auth";

// 3. IMPORT SEMUA ICON LUCIDE
import { BarChart3, Mail, Lock, ArrowRight, ShieldCheck } from "lucide-react";

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");
    
    // Validasi dasar
    if (!email || !password) {
      setError("Email dan Password wajib diisi.");
      return;
    }

    try {
      if (isRegister) {
        // Fungsi ini yang tadi bikin error karena lupa di-import
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      console.error(err.code);
      if (err.code === 'auth/user-not-found') setError("Email tidak terdaftar.");
      else if (err.code === 'auth/wrong-password') setError("Password salah.");
      else if (err.code === 'auth/email-already-in-use') setError("Email sudah digunakan.");
      else if (err.code === 'auth/weak-password') setError("Password minimal 6 karakter.");
      else setError("Gagal masuk. Cek koneksi & data lo.");
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError("Gagal masuk dengan Google.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-[#F8F9FE] text-slate-900 relative overflow-hidden font-sans">
      
      {/* BACKGROUND ORNAMENTS */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100 rounded-full -mr-32 -mt-32 blur-3xl opacity-50"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-100 rounded-full -ml-32 -mb-32 blur-3xl opacity-50"></div>

      <div className="flex-1 flex flex-col justify-center px-8 relative z-10">
        
        {/* BRANDING LOGO */}
        <div className="flex flex-col items-center mb-10 animate-in fade-in zoom-in duration-700">
          <div className="w-20 h-20 rounded-[2.5rem] bg-blue-600 flex items-center justify-center text-white shadow-2xl shadow-blue-200 mb-6 active:scale-90 transition-all">
            <BarChart3 size={40} />
          </div>
          <h1 className="text-3xl font-black tracking-tighter italic text-slate-900 leading-none uppercase">FinansialKu.</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-3 italic">Smart Money Management</p>
        </div>

        {/* LOGIN CARD */}
        <div className="bg-white p-8 rounded-[3.5rem] shadow-2xl shadow-slate-200/60 border border-white/50 animate-in slide-in-from-bottom duration-700">
          <div className="mb-8 px-2">
            <h2 className="text-xl font-black italic uppercase tracking-tight text-slate-800">
              {isRegister ? "Join Us" : "Welcome Back"}
            </h2>
            <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-tighter opacity-60">
              {isRegister ? "Create your wealth account" : "Manage your budget easily"}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="relative flex items-center group">
              <Mail size={18} className="absolute left-5 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
              <input 
                type="email" 
                placeholder="EMAIL ADDRESS"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-14 pr-6 py-5 bg-slate-50 border-none rounded-3xl outline-none font-black text-[11px] uppercase shadow-inner focus:ring-2 focus:ring-blue-100 transition-all"
                required
              />
            </div>

            <div className="relative flex items-center group">
              <Lock size={18} className="absolute left-5 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
              <input 
                type="password" 
                placeholder="PASSWORD"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-14 pr-6 py-5 bg-slate-50 border-none rounded-3xl outline-none font-black text-[11px] uppercase shadow-inner focus:ring-2 focus:ring-blue-100 transition-all"
                required
              />
            </div>

            {error && (
              <div className="px-4 py-3 bg-red-50 rounded-2xl border border-red-100">
                <p className="text-[9px] font-black text-red-500 uppercase italic tracking-tight leading-relaxed">{error}</p>
              </div>
            )}

            <button 
              type="submit"
              className="w-full py-6 bg-blue-600 text-white rounded-[2.5rem] font-black uppercase italic tracking-widest shadow-xl shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-3 mt-2"
            >
              <span>{isRegister ? "Create Account" : "Sign In"}</span>
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="flex items-center my-8">
            <div className="flex-1 h-[1px] bg-slate-100"></div>
            <span className="px-4 text-[9px] font-black text-slate-300 uppercase italic tracking-widest">Or</span>
            <div className="flex-1 h-[1px] bg-slate-100"></div>
          </div>

          <button 
            type="button"
            onClick={handleGoogle}
            className="w-full py-5 bg-white border border-slate-100 text-slate-700 rounded-[2rem] font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/action/google.svg" className="w-5 h-5" alt="google" />
            Continue with Google
          </button>
        </div>

        <div className="mt-8 text-center">
          <button 
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors italic p-2"
          >
            {isRegister ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
          </button>
        </div>

      </div>

      <div className="p-8 flex items-center justify-center gap-2 opacity-30 mt-auto">
        <ShieldCheck size={14} />
        <span className="text-[9px] font-black uppercase tracking-widest italic tracking-tighter">Encrypted Secure Access</span>
      </div>
    </div>
  );
};

export default Login;