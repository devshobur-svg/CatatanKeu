import React, { useState } from "react";
import { 
  User, Shield, Globe, Moon, Sun, LogOut, 
  ChevronRight, Camera, Lock, ShieldCheck // <--- TADI KURANG INI BRO!
} from "lucide-react";
import { auth } from "../lib/firebase"; 

const AVATAR_LIST = ["👤", "🦁", "🦊", "🐻", "🐼", "🦄", "🐲", "🐱"];

const ProfilePage = ({ 
  user, t, lang, setLang, darkMode, setDarkMode, 
  shareWhatsApp, currentAvatar, setUserAvatar,
  setShowSecurityModal 
}) => {
  const [showPicker, setShowPicker] = useState(false);

  const handleSelectAvatar = (ava) => {
    if (setUserAvatar) {
      setUserAvatar(ava);
      localStorage.setItem("fin_avatar", ava);
    }
    setShowPicker(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500 pb-32 px-4 relative z-10">
      
      {/* 1. IDENTITY CARD */}
      <div className="relative pt-10 pb-6 flex flex-col items-center">
        <div className="relative">
          <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-6xl shadow-2xl border-4 border-white dark:border-slate-800">
            {currentAvatar || "👤"}
          </div>
          <button 
            onClick={() => setShowPicker(!showPicker)}
            className="absolute -bottom-2 -right-2 p-3 bg-white dark:bg-slate-700 rounded-2xl shadow-xl text-blue-600 border border-slate-100 dark:border-white/5 active:scale-90 transition-all z-20"
          >
            <Camera size={18} />
          </button>
        </div>

        <div className="mt-6 text-center">
          <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic">
            {user?.displayName || "FINANSIAL MASTER"}
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">
            {user?.email || "shoburasli@gmail.com"}
          </p>
        </div>
      </div>

      {/* 2. AVATAR PICKER */}
      {showPicker && (
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-xl p-6 rounded-[2.5rem] border border-blue-500/20 shadow-xl animate-in zoom-in-95 z-[100] relative">
          <div className="grid grid-cols-4 gap-4">
            {AVATAR_LIST.map((ava) => (
              <button
                key={ava}
                onClick={() => handleSelectAvatar(ava)}
                className={`text-3xl p-3 rounded-2xl transition-all ${currentAvatar === ava ? 'bg-blue-600 scale-110' : 'hover:bg-slate-100 dark:hover:bg-white/5'}`}
              >
                {ava}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. PREFERENCES */}
      <div className="space-y-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 italic">Preferences</p>
        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-white dark:border-white/5 overflow-hidden shadow-xl">
          
          <div className="p-6 flex items-center justify-between border-b border-slate-50 dark:border-white/5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl">
                {darkMode ? <Sun size={20}/> : <Moon size={20}/>}
              </div>
              <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-200">Dark Mode</span>
            </div>
            <button onClick={() => setDarkMode(!darkMode)} className={`w-12 h-6 rounded-full transition-all relative ${darkMode ? 'bg-blue-600' : 'bg-slate-400'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${darkMode ? 'right-1' : 'left-1'}`} />
            </button>
          </div>

          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl">
                <Globe size={20}/>
              </div>
              <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-200">Language</span>
            </div>
            <select 
              value={lang} 
              onChange={(e) => setLang(e.target.value)}
              className="bg-transparent text-[11px] font-black uppercase outline-none text-blue-600 cursor-pointer appearance-none border-none text-right pr-2"
            >
              <option value="id" className="bg-slate-900 text-white">INDONESIA</option>
              <option value="en" className="bg-slate-900 text-white">ENGLISH</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. SECURITY & SESSION */}
      <div className="space-y-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 italic">Security & Session</p>
        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-white dark:border-white/5 overflow-hidden shadow-xl">
          
          <button onClick={shareWhatsApp} className="w-full p-6 flex items-center justify-between border-b border-slate-50 dark:border-white/5 active:bg-slate-50 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl"><ShieldCheck size={20}/></div>
              <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-200">Maestro Report</span>
            </div>
            <ChevronRight size={18} className="text-slate-300"/>
          </button>

          <button 
            onClick={() => setShowSecurityModal(true)}
            className="w-full p-6 flex items-center justify-between border-b border-slate-50 dark:border-white/5 active:bg-slate-100 dark:active:bg-white/5 transition-all relative z-30"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl"><Lock size={20}/></div>
              <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-200">
                Change PIN <span className="text-blue-600 italic">Access</span>
              </span>
            </div>
            <ChevronRight size={18} className="text-slate-300"/>
          </button>

          <button 
            onClick={() => auth.signOut()} 
            className="w-full p-6 flex items-center justify-between text-rose-500 active:bg-rose-50 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-500/10 rounded-2xl"><LogOut size={20}/></div>
              <span className="text-xs font-black uppercase italic tracking-widest">Sign Out Session</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;