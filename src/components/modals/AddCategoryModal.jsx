import React from "react";
import { X, Tag, ChevronLeft, Delete, ShieldCheck } from "lucide-react";

const AddCategoryModal = ({ 
  show, setShow, newCat, setNewCat, 
  handleNumpad, handleSave, formatRupiah, t 
}) => {

  if (!show) return null;

  // Handler khusus untuk menghapus semua (Long press feel)
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
        <div className="p-8 flex items-center justify-between">
          <button 
            onClick={() => setShow(false)} 
            className="p-3 bg-white/5 rounded-2xl text-slate-400 active:scale-90 transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white italic">New Category</h2>
          <div className="w-11" /> {/* Spacer balance */}
        </div>

        <div className="px-8 pb-8 space-y-8">
          
          {/* 1. LIMIT DISPLAY CARD (GLASSMORPHISM) */}
          <div className="relative bg-gradient-to-br from-blue-600/20 to-indigo-600/10 p-10 rounded-[2.5rem] border border-white/10 text-center overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
             <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400 mb-2">Set Monthly Limit</p>
             <h3 className="text-4xl font-black italic tracking-tighter text-white break-all">
               Rp {formatRupiah(newCat.limit || 0)}
             </h3>
          </div>

          {/* 2. CATEGORY NAME INPUT */}
          <div className="relative group">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-500">
              <Tag size={18} />
            </div>
            <input 
              type="text"
              placeholder="CATEGORY NAME..."
              value={newCat.name}
              onChange={(e) => setNewCat({ ...newCat, name: e.target.value.toUpperCase() })}
              className="w-full bg-white/5 border border-white/5 p-5 pl-14 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-600"
            />
          </div>

          {/* 3. MAESTRO NUMPAD */}
          <div className="grid grid-cols-3 gap-y-4 gap-x-8 py-2">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0", "delete"].map((key) => (
              <button
                key={key}
                onClick={() => handleNumpad(key, 'cat')}
                onContextMenu={(e) => {
                    if(key === 'delete') { e.preventDefault(); clearLimit(); }
                }}
                className={`flex items-center justify-center py-4 rounded-2xl transition-all active:scale-75 ${
                  key === "delete" 
                  ? "text-rose-500 hover:bg-rose-500/10" 
                  : "text-white text-xl font-black hover:bg-white/5"
                }`}
              >
                {key === "delete" ? <Delete size={24} /> : key}
              </button>
            ))}
          </div>

          {/* 4. SAVE BUTTON */}
          <button 
            onClick={handleSave}
            className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] shadow-xl shadow-blue-600/30 active:scale-95 transition-all flex items-center justify-center gap-3 border-none"
          >
            <ShieldCheck size={18} /> Save Category
          </button>

        </div>
      </div>
    </div>
  );
};

export default AddCategoryModal;