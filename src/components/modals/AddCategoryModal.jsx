import React from "react";
import { Tag, ChevronLeft, Delete, ShieldCheck, Zap } from "lucide-react";

const AddCategoryModal = ({ 
  show, setShow, newCat, setNewCat, 
  handleNumpad, handleSave, formatRupiah, t 
}) => {

  if (!show) return null;

  // Logic hapus semua (Long press feel)
  const clearLimit = () => setNewCat({ ...newCat, limit: "" });

  return (
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4">
      {/* BACKDROP PEKAT DNA MAESTRO */}
      <div 
        className="absolute inset-0 bg-slate-950/98 backdrop-blur-2xl" 
        onClick={() => setShow(false)} 
      />

      <div className="relative w-full max-w-sm bg-[#0F172A] border border-white/10 rounded-[3.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 duration-500">
        
        {/* HEADER NAVIGATION */}
        <div className="p-8 pb-4 flex items-center justify-between">
          <button 
            onClick={() => setShow(false)} 
            className="p-3 bg-white/5 rounded-2xl text-slate-400 active:scale-90 transition-all border border-white/5"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex flex-col items-center">
             <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white italic">Maestro Engine</h2>
             <div className="h-1 w-6 bg-blue-600 rounded-full mt-1 animate-pulse" />
          </div>
          <div className="w-11" />
        </div>

        <div className="px-8 pb-8 space-y-7">
          
          {/* 1. HERO CARD: SET LIMIT (DNA SUBSCRIPTION) */}
          <div className="relative bg-gradient-to-br from-slate-900 to-black p-8 rounded-[2.5rem] border border-white/10 text-center overflow-hidden shadow-inner">
             {/* Glow Effect */}
             <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl" />
             
             <div className="relative z-10">
               <p className="text-[9px] font-black uppercase tracking-[0.25em] text-blue-500/80 mb-3 flex items-center justify-center gap-2">
                 <Zap size={10} fill="currentColor" /> Set Monthly Limit
               </p>
               <h3 className="text-3xl font-black italic tracking-tighter text-white break-all leading-none">
                 <span className="text-sm mr-1 opacity-50 not-italic">Rp</span>
                 {formatRupiah(newCat.limit || 0)}
               </h3>
             </div>
          </div>

          {/* 2. CATEGORY NAME INPUT (GLASSMORPHISM) */}
          <div className="relative group">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-500 group-focus-within:animate-bounce">
              <Tag size={18} />
            </div>
            <input 
              type="text"
              placeholder="CATEGORY NAME..."
              value={newCat.name}
              onChange={(e) => setNewCat({ ...newCat, name: e.target.value.toUpperCase() })}
              className="w-full bg-white/5 border border-white/5 p-5 pl-14 rounded-[1.8rem] text-[11px] font-black uppercase tracking-widest text-white outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-700"
            />
          </div>

          {/* 3. PREMIUM NUMPAD GRID */}
          <div className="grid grid-cols-3 gap-y-2 gap-x-8">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0", "delete"].map((key) => (
              <button
                key={key}
                onClick={() => handleNumpad(key, 'cat')}
                onContextMenu={(e) => {
                    if(key === 'delete') { e.preventDefault(); clearLimit(); }
                }}
                className={`flex items-center justify-center py-4 rounded-2xl transition-all active:scale-75 active:bg-white/5 ${
                  key === "delete" 
                  ? "text-rose-500" 
                  : "text-white text-xl font-black italic tracking-tighter"
                }`}
              >
                {key === "delete" ? <Delete size={24} /> : key}
              </button>
            ))}
          </div>

          {/* 4. ACTION BUTTON (GLOW STYLE) */}
          <button 
            onClick={handleSave}
            className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] shadow-[0_15px_30px_-10px_rgba(37,99,235,0.5)] active:scale-95 transition-all flex items-center justify-center gap-3 border-none"
          >
            <ShieldCheck size={18} /> Save Category
          </button>

        </div>
      </div>
    </div>
  );
};

export default AddCategoryModal;