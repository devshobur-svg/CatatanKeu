import React, { useState } from "react";
import { X, Download, Calendar, Wallet, Tag } from "lucide-react";

const ExportModal = ({ show, setShow, wallets, categories, onExport }) => {
  const [filter, setFilter] = useState({
    walletId: "all",
    category: "all",
    startDate: "",
    endDate: ""
  });

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4">
      {/* BACKDROP PEKAT */}
      <div className="absolute inset-0 bg-slate-950/98 backdrop-blur-2xl" onClick={() => setShow(false)} />
      
      <div className="relative w-full max-w-sm bg-[#0F172A] border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95">
        <div className="p-8 space-y-6">
          
          {/* HEADER */}
          <div className="flex justify-between items-center">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-blue-500 italic">Export Maestro</h2>
            <button onClick={() => setShow(false)} className="p-2 text-slate-500 hover:text-white transition-all">
              <X size={20}/>
            </button>
          </div>

          <div className="space-y-4">
            
            {/* 1. FILTER WALLET - FIX KOTAK PUTIH */}
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-1 relative group">
              <div className="flex items-center gap-2 text-blue-400 mb-1">
                <Wallet size={14}/> <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Source Wallet</span>
              </div>
              <select 
                value={filter.walletId}
                onChange={(e) => setFilter({...filter, walletId: e.target.value})}
                // appearance-none & border-none adalah kunci bunuh kotak putih
                className="bg-transparent w-full text-[11px] font-black outline-none text-white appearance-none border-none p-0 uppercase cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-white">ALL WALLETS</option>
                {wallets.map(w => (
                  <option key={w.id} value={w.id} className="bg-slate-900 text-white">{w.name}</option>
                ))}
              </select>
            </div>

            {/* 2. FILTER CATEGORY - FIX KOTAK PUTIH */}
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-1 relative group">
              <div className="flex items-center gap-2 text-indigo-400 mb-1">
                <Tag size={14}/> <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Category</span>
              </div>
              <select 
                value={filter.category}
                onChange={(e) => setFilter({...filter, category: e.target.value})}
                className="bg-transparent w-full text-[11px] font-black outline-none text-white appearance-none border-none p-0 uppercase cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-white">ALL CATEGORIES</option>
                {categories.map(c => (
                  <option key={c.id} value={c.name} className="bg-slate-900 text-white">{c.name}</option>
                ))}
              </select>
            </div>

            {/* 3. DATE RANGE - FIX BOX BROWSER STYLE */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-[8px] font-black uppercase text-slate-500 mb-1 tracking-widest">From</p>
                <input 
                  type="date" 
                  value={filter.startDate}
                  onChange={(e) => setFilter({...filter, startDate: e.target.value})}
                  // Menggunakan p-0 dan appearance-none agar input tanggal tidak punya box internal
                  className="bg-transparent w-full text-[10px] font-black outline-none text-white appearance-none border-none p-0"
                />
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-[8px] font-black uppercase text-slate-500 mb-1 tracking-widest">To</p>
                <input 
                  type="date" 
                  value={filter.endDate}
                  onChange={(e) => setFilter({...filter, endDate: e.target.value})}
                  className="bg-transparent w-full text-[10px] font-black outline-none text-white appearance-none border-none p-0"
                />
              </div>
            </div>
          </div>

          {/* ACTION BUTTON */}
          <button 
            onClick={() => onExport(filter)}
            className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] shadow-xl shadow-blue-600/40 active:scale-95 transition-all flex items-center justify-center gap-3 border-none"
          >
            <Download size={16}/> Generate Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;