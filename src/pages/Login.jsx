import React, { useState } from "react";
import { auth } from "../lib/firebase"; // sesuaikan path lib firebase kamu
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { LogIn, UserPlus, Mail, Lock, Sparkles } from "lucide-react";

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 font-sans">
      {/* Dekorasi Background */}
      <div className="fixed top-0 left-0 w-full h-64 bg-sky-500 rounded-b-[4rem] z-0 shadow-lg"></div>
      
      <div className="w-full max-w-md z-10 space-y-8">
        {/* Logo & Header */}
        <div className="text-center space-y-2">
          <div className="w-20 h-20 bg-white rounded-[2rem] shadow-xl flex items-center justify-center mx-auto mb-4 border-4 border-sky-100">
            <Sparkles className="text-sky-500" size={40} />
          </div>
          <h1 className="text-white text-3xl font-black italic tracking-tighter">FinansialKu.</h1>
          <p className="text-sky-100 text-sm font-medium tracking-wide uppercase opacity-80">
            {isRegister ? "Mulai Kelola Uangmu" : "Selamat Datang Kembali"}
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white p-8 rounded-[3rem] shadow-2xl border border-slate-100">
          <form onSubmit={handleAuth} className="space-y-5">
            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 p-4 pl-12 rounded-2xl outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all text-sm font-bold"
                  placeholder="name@email.com"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 p-4 pl-12 rounded-2xl outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all text-sm font-bold"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-sky-500 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-sky-100 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  {isRegister ? <UserPlus size={18}/> : <LogIn size={18}/>}
                  {isRegister ? "Daftar Sekarang" : "Masuk Ke Akun"}
                </>
              )}
            </button>
          </form>

          {/* Switch Auth */}
          <div className="mt-8 text-center">
            <button 
              onClick={() => setIsRegister(!isRegister)}
              className="text-slate-400 text-xs font-bold hover:text-sky-500 transition-colors"
            >
              {isRegister ? "Sudah punya akun? Masuk" : "Belum punya akun? Daftar gratis"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-300 text-[10px] font-bold uppercase tracking-widest">
          Secure & Encrypted by Firebase
        </p>
      </div>
    </div>
  );
};

export default Login;