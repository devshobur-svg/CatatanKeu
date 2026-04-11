import React from "react";
import { X, Calendar, CreditCard, Tag } from "lucide-react";

const AddSubModal = ({ show, setShow, newSub, setNewSub, handleSave, formatRupiah }) => {
  if (!show) return null;

  const handlePriceInput = (val) => setNewSub({ ...newSub, price: val.replace(/\D/g, "") });

  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center sm:items-center p-0 sm:p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={() => setShow(false)}></div>
      <div className="relative w-full max-w-lg bg-[#0F172A] text-white rounded-t-[3.5rem] sm:rounded-[3.5rem] shadow-2xl h-auto overflow-hidden border border-white/5 animate-in slide-in-from-bottom-10">
        <div className="p-8 flex justify-between items-center bg-slate-900/50">
          <button onClick={() => setShow(false)} className="p-3 bg-white/5 rounded-2xl border border-white/5"><X size={20}/></button>
          <h1 className="text-sm font-black uppercase tracking-widest text-blue-500">New Subscription</h1>
          <div className="w-12"></div>
        </div>

        <div className="p-8 space-y-6">
          <div className="text-center">
            <p className="text-[10px] font-black uppercase opacity-40 mb-1">Monthly Cost</p>
            <div className="flex justify-center items-center gap-2">
                <span className="text-xl font-black italic text-blue-500">Rp</span>
                <input type="text" inputMode="numeric" placeholder="0" value={newSub.price.replace(/\B(?=(\d{3})+(?!\d))/g, ".")} onChange={(e) => handlePriceInput(e.target.value)} className="bg-transparent text-4xl font-black italic outline-none w-1/2"/>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white/5 p-5 rounded-3xl border border-white/5 flex items-center gap-4">
                <Tag size={18} className="text-blue-500"/>
                <input placeholder="Service Name (Netflix, Spotify...)" value={newSub.name} onChange={(e) => setNewSub({...newSub, name: e.target.value})} className="bg-transparent flex-1 text-xs font-black uppercase outline-none"/>
            </div>
            <div className="bg-white/5 p-5 rounded-3xl border border-white/5 flex items-center gap-4">
                <Calendar size={18} className="text-rose-500"/>
                <input type="number" placeholder="Payment Date (1-31)" value={newSub.dueDay} onChange={(e) => setNewSub({...newSub, dueDay: e.target.value})} className="bg-transparent flex-1 text-xs font-black outline-none"/>
            </div>
          </div>

          <button onClick={handleSave} className="w-full py-5 bg-blue-600 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] shadow-xl">Activate Tracking</button>
        </div>
      </div>
    </div>
  );
};

export default AddSubModal;