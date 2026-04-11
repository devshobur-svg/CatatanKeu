import React, { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { 
  User, Wallet, Tag, FileText, Moon, Globe, LogOut, ChevronRight, ShieldCheck, Key, Check, ShieldAlert
} from "lucide-react";

const ProfilePage = ({ user, t, lang, setLang, darkMode, setDarkMode, setActiveTab, shareWhatsApp }) => {
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [pinSaved, setPinSaved] = useState(false);

  // Ambil status PIN saat ini
  const currentPin = localStorage.getItem("user_pin");

  const handleSavePin = () => {
    if (newPin.length === 4) {
      localStorage.setItem("user_pin", newPin);
      setPinSaved(true);
      setTimeout(() => {
        setPinSaved(false);
        setShowPinSetup(false);
        setNewPin("");
      }, 1500);
    }
  };

  return (
    <div className="animate-in slide-in-from-right duration-500 space-y-4 pb-12">
      
      {/* 1. PROFILE HEADER - High Contrast Navy/Blue DNA */}
      <div className="px-6 pt-16 pb-12 bg-white dark:bg-slate-800 rounded-b-[4rem] shadow-xl shadow-slate-200/50 dark:shadow-none border-b border-slate-100 dark:border-slate-700 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-blue-50 dark:bg-blue-900/10 rounded-full -ml-16 -mt-16 blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="w-28 h-28 mx-auto mb-6 rounded-[3rem] bg-gradient-to-tr from-blue-600 to-blue-400 p-1.5 shadow-2xl shadow-blue-200 dark:shadow-none">
            <img 
              src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.email}&background=2563eb&color=fff`} 
              className="w-full h-full object-cover rounded-[2.5rem] border-4 border-white dark:border-slate-800" 
              alt="profile"
            />
          </div>
          <h3 className="text-2xl font-black italic uppercase text-slate-900 dark:text-white tracking-tighter">
            {user?.displayName || user?.email?.split('@')[0] || "User"}
          </h3>
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mt-2 italic">
            {user?.email}
          </p>
        </div>
      </div>

      {/* 2. MENU GROUPS */}
      <div className="px-6 space-y-8 pt-6">
        
        {/* General Section */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-600 px-4 tracking-[0.2em]">General Dashboard</h4>
          <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-3 shadow-xl shadow-slate-200/40 dark:shadow-none border border-slate-50 dark:border-slate-700">
            <MenuLink icon={<Wallet size={18}/>} label={t.wallet} color="text-blue-600" bg="bg-blue-50" onClick={() => setActiveTab('wallet')} />
            <MenuLink icon={<Tag size={18}/>} label={t.category} color="text-orange-500" bg="bg-orange-50" onClick={() => setActiveTab('category')} isBorder />
            <MenuLink icon={<FileText size={18}/>} label={t.report} color="text-indigo-600" bg="bg-indigo-50" onClick={shareWhatsApp} isBorder />
          </div>
        </div>

        {/* Security Section (NEW) */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-600 px-4 tracking-[0.2em]">Privacy & Safety</h4>
          <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-3 shadow-xl shadow-slate-200/40 dark:shadow-none border border-slate-50 dark:border-slate-700">
            <button 
                onClick={() => setShowPinSetup(!showPinSetup)} 
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-white/5 rounded-[2rem] transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 rounded-2xl group-active:scale-90 transition-all`}>
                  <Key size={18}/>
                </div>
                <div className="text-left">
                    <span className="block text-xs font-black uppercase tracking-tight text-slate-800 dark:text-white">Security PIN</span>
                    <span className="text-[8px] font-bold uppercase italic text-slate-400 tracking-widest">
                        {currentPin ? 'Protected' : 'Not Configured'}
                    </span>
                </div>
              </div>
              <ChevronRight size={16} className={`text-slate-300 transition-transform ${showPinSetup ? 'rotate-90' : ''}`}/>
            </button>

            {showPinSetup && (
                <div className="p-6 pt-2 space-y-4 animate-in slide-in-from-top-4 duration-300 border-t border-slate-50 dark:border-white/5">
                    <div className="flex flex-col items-center gap-4">
                        <input 
                            type="password" 
                            maxLength={4} 
                            inputMode="numeric" 
                            placeholder="----" 
                            value={newPin} 
                            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                            className="bg-slate-100 dark:bg-white/5 w-32 py-4 rounded-2xl text-center text-2xl font-black tracking-[0.5em] outline-none border border-transparent focus:border-blue-500 dark:text-white"
                        />
                        <button 
                            onClick={handleSavePin}
                            disabled={newPin.length < 4}
                            className={`w-full py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${
                                pinSaved ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white disabled:opacity-30'
                            }`}
                        >
                            {pinSaved ? <span className="flex items-center justify-center gap-2"><Check size={14}/> PIN Updated</span> : "Set New PIN"}
                        </button>
                    </div>
                </div>
            )}
          </div>
        </div>

        {/* Settings Section */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-600 px-4 tracking-[0.2em]">Preferences</h4>
          <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-3 shadow-xl shadow-slate-200/40 dark:shadow-none border border-slate-50 dark:border-slate-700">
            
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 rounded-2xl">
                  <Moon size={18}/>
                </div>
                <span className="text-xs font-black uppercase tracking-tight text-slate-800 dark:text-white">{t.appearance}</span>
              </div>
              <button 
                onClick={() => setDarkMode(!darkMode)} 
                className={`w-14 h-7 rounded-full p-1 transition-all duration-300 flex items-center ${darkMode ? 'bg-blue-600' : 'bg-slate-200'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-all duration-300 ${darkMode ? 'translate-x-7' : 'translate-x-0'}`}></div>
              </button>
            </div>

            <button 
              onClick={() => setLang(lang === 'id' ? 'en' : 'id')} 
              className="w-full flex items-center justify-between p-4 border-t border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-white/5 rounded-b-[2rem] transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-teal-50 dark:bg-teal-500/10 text-teal-600 rounded-2xl group-active:scale-90 transition-all">
                  <Globe size={18}/>
                </div>
                <span className="text-xs font-black uppercase tracking-tight text-slate-800 dark:text-white">{t.lang}</span>
              </div>
              <div className="flex items-center gap-2">
                 <span className="text-[10px] font-black uppercase text-blue-600 italic">{lang === 'id' ? 'Indonesia' : 'English'}</span>
                 <ChevronRight size={14} className="text-slate-300" />
              </div>
            </button>
          </div>
        </div>

        {/* Logout Section */}
        <button 
          onClick={() => signOut(auth)} 
          className="w-full p-7 bg-white dark:bg-red-500/10 text-red-500 rounded-[2.5rem] flex items-center justify-center gap-3 font-black text-xs uppercase italic tracking-[0.1em] border-2 border-red-50 dark:border-red-500/20 shadow-xl shadow-red-100/50 dark:shadow-none active:scale-95 transition-all"
        >
          <LogOut size={18}/> {t.logout}
        </button>
      </div>
    </div>
  );
};

const MenuLink = ({ icon, label, color, bg, onClick, isBorder }) => (
  <button 
    onClick={onClick} 
    className={`w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-white/5 rounded-[1.5rem] transition-all group ${isBorder ? 'border-t border-slate-50 dark:border-slate-700' : ''}`}
  >
    <div className="flex items-center gap-4">
      <div className={`p-3 ${bg} ${color} dark:bg-opacity-20 rounded-2xl group-active:scale-90 transition-all`}>
        {icon}
      </div>
      <span className="text-xs font-black uppercase tracking-tight text-slate-800 dark:text-white">
        {label}
      </span>
    </div>
    <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:translate-x-1 transition-transform"/>
  </button>
);

export default ProfilePage;