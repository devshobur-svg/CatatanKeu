import React from "react";
// FIX: Ganti lucide-center menjadi lucide-react
import { ChevronLeft, ShieldCheck, Landmark, Smartphone, Coins } from "lucide-react";
import Numpad from "../Numpad";

const AddWalletModal = ({ 
  show, setShow, newWallet, setNewWallet, 
  handleNumpad, handleSave, formatRupiah, getDynamicFontSize, t 
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col animate-in slide-in-from-bottom duration-500 bg-[#F8F9FE] dark:bg-slate-900">
      
      {/* Header */}
      <div className="p-6 flex justify-between items-center">
        <button 
          onClick={() => setShow(false)} 
          className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm active:scale-90 transition-all"
        >
          <ChevronLeft className="text-blue-600"/>
        </button>
        <h2 className="font-black italic uppercase tracking-widest text-slate-900 dark:text-white">
          New Wallet
        </h2>
        <div className="w-12"></div>
      </div>

      <div className="flex-1 px-6 space-y-6 overflow-y-auto no-scrollbar">
        
        {/* Type Selector */}
        <div className="flex p-2 bg-white dark:bg-slate-800 rounded-[2.5rem] gap-2 border border-slate-100 dark:border-slate-700 shadow-sm">
          {[
            { id: 'bank', icon: <Landmark size={14}/>, label: 'Bank' },
            { id: 'ewallet', icon: <Smartphone size={14}/>, label: 'E-Wallet' },
            { id: 'cash', icon: <Coins size={14}/>, label: 'Cash' }
          ].map((type) => (
            <button 
              key={type.id}
              onClick={() => setNewWallet({...newWallet, type: type.id})} 
              className={`flex-1 py-4 rounded-[2rem] text-[9px] font-black uppercase transition-all flex items-center justify-center gap-2 ${newWallet.type === type.id ? 'bg-blue-600 text-white shadow-md' : 'opacity-30 text-slate-400'}`}
            >
              {type.icon}
              {type.label}
            </button>
          ))}
        </div>

        {/* Nominal Balance */}
        <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-md min-h-[160px] flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-24 h-24 bg-blue-50 dark:bg-blue-900/10 rounded-full -ml-12 -mt-12 blur-2xl"></div>
          <p className="text-[10px] font-black uppercase opacity-40 mb-3 italic tracking-widest relative z-10">Initial Balance</p>
          
          <h1 className={`${getDynamicFontSize ? getDynamicFontSize(formatRupiah(newWallet.balance || "0").length) : 'text-4xl'} font-black italic tracking-tighter text-blue-600 break-all relative z-10`}>
            Rp {newWallet.balance ? formatRupiah(newWallet.balance) : "0"}
          </h1>
        </div>

        {/* Name Input */}
        <div className="space-y-4 pb-10">
          <input 
            type="text" 
            placeholder="WALLET NAME (E.G. BCA, GOPAY)" 
            value={newWallet.name} 
            onChange={(e) => setNewWallet({...newWallet, name: e.target.value})} 
            className="w-full p-5 rounded-2xl border border-slate-100 dark:border-slate-700 outline-none font-black text-xs uppercase shadow-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-100 transition-all" 
          />
        </div>
      </div>

      {/* Footer Numpad */}
      <div className="p-6 bg-white dark:bg-slate-800 rounded-t-[3.5rem] shadow-2xl border-t border-slate-50 dark:border-slate-700">
        <Numpad onClick={(val) => handleNumpad(val, 'wallet')} />
        <button 
          onClick={handleSave} 
          className="w-full py-6 bg-blue-600 text-white rounded-[2.5rem] font-black uppercase text-sm shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
        >
          <ShieldCheck size={22}/> Create Wallet
        </button>
      </div>
    </div>
  );
};

export default AddWalletModal;