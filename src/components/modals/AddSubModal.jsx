import React from "react";
import { X, Calendar, CreditCard, Tag } from "lucide-react";

const AddSubModal = ({ show, setShow, newSub, setNewSub, handleSave, formatRupiah }) => {
  if (!show) return null;

  const handlePriceInput = (val) => setNewSub({ ...newSub, price: val.replace(/\D/g, "") });

  return (
    <div className="fixed inset-0 z-[9999999] flex items-end justify-center sm:items-center p-0 sm:p-4 animate-in fade-in duration-300">
      {/* BACKDROP SOLID PEKAT */}
      <div 
        className="absolute inset-0 bg-slate-950/95 backdrop-blur-2xl" 
        onClick={() => setShow(false)}
      ></div>

      <div className="relative w-full max-w-lg bg-[#0F172A] text-white rounded-t-[3.5rem] sm:rounded-[3.5rem] shadow-2xl h-auto overflow-hidden border border-white/5 animate-in slide-in-from-bottom-10">
        
        {/* HEADER */}
        <div className="p-8 flex justify-between items-center bg-slate-900/50 border-b border-white/5 shrink-0">
          <button onClick={() => setShow(false)} className="p-3 bg-white/5 rounded-2xl border border-white/5 text-slate-400 hover:text-white active:scale-90 transition-all">
            <X size={20}/>
          </button>
          <div className="text-center">
            <h2 className="text-[10px] font-black italic uppercase tracking-[0.4em] text-blue-500">Service</h2>
            <h1 className="text-sm font-black uppercase tracking-widest text-white">New Subscription</h1>
          </div>
          <div className="w-12"></div>
        </div>

        <div className="p-8 space-y-8">
          {/* 1. PRICE INPUT - FIX KOTAK PUTIH */}
          <div className="text-center space-y-2">
            <p className="text-[10px] font-black uppercase opacity-40 tracking-[0.2em]">Monthly Cost</p>
            <div className="flex justify-center items-center gap-2 border-b border-white/5 focus-within:border-blue-500 pb-2 transition-all">
                <span className="text-xl font-black italic text-blue-500">Rp</span>
                <input 
                  type="text" 
                  inputMode="numeric" 
                  placeholder="0" 
                  value={newSub.price.replace(/\B(?=(\d{3})+(?!\d))/g, ".")} 
                  onChange={(e) => handlePriceInput(e.target.value)} 
                  // FIX: appearance-none & border-none untuk bunuh kotak putih browser
                  className="bg-transparent text-4xl font-black italic outline-none w-full max-w-[200px] text-left appearance-none border-none p-0 placeholder:text-white/5"
                />
            </div>
          </div>

          {/* 2. FIELDS LIST */}
          <div className="space-y-4">
            {/* Service Name Input */}
            <div className="bg-white/5 p-5 rounded-3xl border border-white/5 flex items-center gap-4 focus-within:border-blue-500/50 transition-all">
                <div className="w-10 h-10 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 shrink-0">
                    <Tag size={18}/>
                </div>
                <input 
                  placeholder="SERVICE NAME (E.G. NETFLIX)" 
                  value={newSub.name} 
                  onChange={(e) => setNewSub({...newSub, name: e.target.value})} 
                  // FIX: Forced bg-transparent & p-0
                  className="bg-transparent flex-1 text-xs font-black uppercase outline-none border-none p-0 placeholder:text-white/10 appearance-none"
                />
            </div>

            {/* Payment Date Input */}
            <div className="bg-white/5 p-5 rounded-3xl border border-white/5 flex items-center gap-4 focus-within:border-blue-500/50 transition-all">
                <div className="w-10 h-10 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-400 shrink-0">
                    <Calendar size={18}/>
                </div>
                <div className="flex-1">
                  <p className="text-[8px] font-black uppercase text-slate-500 mb-0.5">Billing Date</p>
                  <input 
                    type="number" 
                    placeholder="1-31" 
                    value={newSub.dueDay} 
                    onChange={(e) => setNewSub({...newSub, dueDay: e.target.value})} 
                    // FIX: Ngebunuh spin-button (panah angka) yang sering bikin kotak putih muncul
                    className="bg-transparent w-full text-xs font-black outline-none border-none p-0 appearance-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
            </div>
          </div>

          {/* 3. SUBMIT ACTION */}
          <button 
            onClick={handleSave} 
            className="w-full py-5 bg-blue-600 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] shadow-xl shadow-blue-600/20 active:scale-95 transition-all text-white border-none"
          >
            Activate Tracking
          </button>
        </div>

        {/* Decorative Home Indicator */}
        <div className="h-1.5 w-20 bg-white/10 mx-auto mb-4 rounded-full shrink-0"></div>
      </div>
    </div>
  );
};

export default AddSubModal;