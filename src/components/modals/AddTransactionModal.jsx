import React from "react";
import { X, Calendar, Wallet, Tag, FileText, ChevronDown } from "lucide-react";

const AddTransactionModal = ({ 
  show, setShow, form, setForm, categories, wallets, 
  handleSave, formatRupiah, getDynamicFontSize, t 
}) => {
  if (!show) return null;

  // --- HELPER FORMATTING ---
  const handlePriceInput = (value) => {
    const rawValue = value.replace(/\D/g, "");
    setForm({ ...form, amount: rawValue });
  };

  const getDisplayValue = (val) => {
    if (!val) return "";
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  return (
    <div className="fixed inset-0 z-[9999999] flex items-end justify-center sm:items-center p-0 sm:p-4">
      {/* BACKDROP SOLID PEKAT */}
      <div 
        className="absolute inset-0 bg-slate-950/95 backdrop-blur-2xl" 
        onClick={() => setShow(false)}
      ></div>
      
      <div className="relative w-full max-w-lg bg-[#0F172A] text-white rounded-t-[3.5rem] sm:rounded-[3.5rem] shadow-2xl overflow-hidden h-auto max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-10 border border-white/5">
        
        {/* HEADER */}
        <div className="p-8 flex justify-between items-center border-b border-white/5 bg-slate-900/50 shrink-0">
          <button onClick={() => setShow(false)} className="p-3 bg-white/5 rounded-2xl active:scale-90 border border-white/5 text-slate-400 hover:text-white">
            <X size={20} />
          </button>
          <div className="text-center">
            <h2 className="text-[10px] font-black italic uppercase tracking-[0.4em] text-blue-500">Manual Entry</h2>
            <h1 className="text-sm font-black uppercase tracking-widest">
              {form.type === 'income' ? 'Add Income' : 'Add Expense'}
            </h1>
          </div>
          <div className="w-12"></div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8 pb-10">
          
          {/* 1. MAIN AMOUNT INPUT (Native Keyboard) */}
          <div className="py-8 text-center space-y-3">
            <p className="text-[10px] font-black uppercase text-blue-500/50 tracking-[0.2em]">Transaction Amount</p>
            <div className="relative flex justify-center items-center">
                <span className="text-2xl font-black text-blue-400 mr-2 italic">Rp</span>
                <input 
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={getDisplayValue(form.amount)}
                    onChange={(e) => handlePriceInput(e.target.value)}
                    // FIX: Ditambahkan bg-transparent & outline-none untuk bunuh kotak putih
                    className="bg-transparent border-none text-5xl font-black italic tracking-tighter text-white outline-none w-full max-w-[250px] text-left placeholder:text-white/5 appearance-none"
                    autoFocus
                />
            </div>
          </div>

          {/* 2. FIELDS GRID */}
          <div className="grid grid-cols-1 gap-4 px-2">
            
            {/* Pick Date */}
            <div className="bg-white/5 p-4 rounded-3xl border border-white/5 flex items-center gap-4 transition-all focus-within:border-blue-500/50">
                <div className="w-10 h-10 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 shrink-0">
                    <Calendar size={18}/>
                </div>
                <div className="flex-1">
                    <p className="text-[8px] font-black uppercase text-slate-500 mb-1">Date</p>
                    <input 
                        type="date" 
                        value={form.date || new Date().toISOString().split('T')[0]} 
                        onChange={(e) => setForm({...form, date: e.target.value})}
                        // FIX: appearance-none penting buat ngebunuh default browser styling
                        className="bg-transparent w-full text-xs font-black outline-none text-white appearance-none border-none p-0"
                    />
                </div>
            </div>

            {/* Category & Wallet Grid */}
            <div className="grid grid-cols-2 gap-4">
                {/* Category Select */}
                <div className="bg-white/5 p-4 rounded-3xl border border-white/5 space-y-1 relative group">
                    <div className="flex items-center gap-2 text-indigo-400 mb-1">
                        <Tag size={14}/> <span className="text-[8px] font-black uppercase">Category</span>
                    </div>
                    <select 
                        value={form.category} 
                        onChange={(e) => setForm({...form, category: e.target.value})}
                        // FIX: bg-transparent & forced dark background on options
                        className="bg-transparent w-full text-[11px] font-black outline-none text-white appearance-none uppercase border-none cursor-pointer p-0"
                    >
                        <option value="" className="bg-slate-900 text-white">SELECT...</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.name} className="bg-slate-900 text-white uppercase">{c.name}</option>
                        ))}
                    </select>
                </div>

                {/* Wallet Select */}
                <div className="bg-white/5 p-4 rounded-3xl border border-white/5 space-y-1 relative group">
                    <div className="flex items-center gap-2 text-emerald-400 mb-1">
                        <Wallet size={14}/> <span className="text-[8px] font-black uppercase">Wallet</span>
                    </div>
                    <select 
                        value={form.walletId} 
                        onChange={(e) => setForm({...form, walletId: e.target.value})}
                        // FIX: Menggunakan warna solid pada option agar tidak putih kaku
                        className="bg-transparent w-full text-[11px] font-black outline-none text-white appearance-none uppercase border-none cursor-pointer p-0"
                    >
                        <option value="" className="bg-slate-900 text-white">SELECT...</option>
                        {wallets.map(w => (
                          <option key={w.id} value={w.id} className="bg-slate-900 text-white uppercase">{w.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Note Input */}
            <div className="bg-white/5 p-5 rounded-3xl border border-white/5 flex items-center gap-4 focus-within:border-blue-500/50 transition-all">
                <div className="w-10 h-10 bg-slate-500/10 rounded-2xl flex items-center justify-center text-slate-400 shrink-0">
                    <FileText size={18}/>
                </div>
                <input 
                    placeholder="Notes (optional)..." 
                    value={form.note}
                    onChange={(e) => setForm({...form, note: e.target.value})}
                    className="bg-transparent flex-1 text-xs font-bold outline-none placeholder:text-white/10 border-none p-0 appearance-none"
                />
            </div>
          </div>

          {/* 3. CONFIRM BUTTON */}
          <div className="px-2 pt-4 shrink-0">
            <button 
                onClick={handleSave}
                className="w-full py-5 bg-blue-600 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] active:scale-95 transition-all shadow-xl shadow-blue-500/20 text-white border-none"
            >
                Save Transaction
            </button>
          </div>

        </div>

        {/* Home Indicator Decor */}
        <div className="h-1.5 w-20 bg-white/10 mx-auto mb-4 rounded-full shrink-0"></div>
      </div>
    </div>
  );
};

export default AddTransactionModal;