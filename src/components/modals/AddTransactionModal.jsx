import React from "react";
import { ChevronLeft, ShieldCheck } from "lucide-react";
import Numpad from "../Numpad";

const AddTransactionModal = ({ 
  show, setShow, form, setForm, categories, wallets, 
  handleNumpad, handleSave, formatRupiah, getDynamicFontSize, t 
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[999] flex flex-col animate-in slide-in-from-bottom duration-500 bg-[#F8F9FE] dark:bg-slate-900">
      
      {/* Header */}
      <div className="p-6 flex justify-between items-center">
        <button 
          onClick={() => setShow(false)} 
          className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm active:scale-90 transition-all"
        >
          <ChevronLeft className="text-blue-600"/>
        </button>
        <h2 className="font-black italic uppercase tracking-widest text-slate-900 dark:text-white">
          {t?.addTrans || "Add Transaction"}
        </h2>
        <div className="w-12"></div>
      </div>

      <div className="flex-1 px-6 space-y-6 overflow-y-auto no-scrollbar">
        
        {/* FIX: Warna Toggle dibedakan (Merah vs Hijau) agar jelas mana yang aktif */}
        <div className="flex p-2 bg-white dark:bg-slate-800 rounded-[2.5rem] gap-2 border border-slate-100 dark:border-slate-700 shadow-sm">
          <button 
            onClick={() => setForm({...form, type: 'expense'})} 
            className={`flex-1 py-4 rounded-[2rem] text-[10px] font-black uppercase transition-all ${form.type === 'expense' ? 'bg-rose-600 text-white shadow-md' : 'opacity-30 text-slate-400'}`}
          >
            {t?.expense || "Expense"}
          </button>
          <button 
            onClick={() => setForm({...form, type: 'income'})} 
            className={`flex-1 py-4 rounded-[2rem] text-[10px] font-black uppercase transition-all ${form.type === 'income' ? 'bg-emerald-600 text-white shadow-md' : 'opacity-30 text-slate-400'}`}
          >
            {t?.income || "Income"}
          </button>
        </div>

        {/* Display Amount */}
        <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-md min-h-[160px] flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 dark:bg-blue-900/10 rounded-full -mr-12 -mt-12 blur-2xl"></div>
          <p className="text-[10px] font-black uppercase opacity-40 mb-3 italic tracking-widest relative z-10">{t?.amount || "Amount"}</p>
          <h1 className={`${getDynamicFontSize ? getDynamicFontSize(formatRupiah(form.amount || "0").length) : 'text-4xl'} font-black italic tracking-tighter text-blue-600 break-all relative z-10`}>
            Rp {form.amount ? formatRupiah(form.amount) : "0"}
          </h1>
        </div>

        {/* Inputs */}
        <div className="space-y-4 pb-10">
          <select 
            value={form.category} 
            onChange={(e) => setForm({...form, category: e.target.value})} 
            className="w-full p-5 rounded-2xl border border-slate-100 dark:border-slate-700 outline-none font-black text-xs uppercase shadow-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="">Pilih Kategori</option>
            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>

          <select 
            value={form.walletId} 
            onChange={(e) => setForm({...form, walletId: e.target.value})} 
            className="w-full p-5 rounded-2xl border border-slate-100 dark:border-slate-700 outline-none font-black text-xs uppercase shadow-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="">Pilih Wallet</option>
            {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>

          <input 
            type="text" 
            placeholder="Catatan (Opsional)" 
            value={form.note} 
            onChange={(e) => setForm({...form, note: e.target.value})} 
            className="w-full p-5 rounded-2xl border border-slate-100 dark:border-slate-700 outline-none font-black text-xs shadow-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white" 
          />
        </div>
      </div>

      {/* Footer Numpad */}
      <div className="p-6 bg-white dark:bg-slate-800 rounded-t-[3.5rem] shadow-2xl border-t border-slate-50 dark:border-slate-700">
        <Numpad onClick={(val) => handleNumpad(val, 'form')} />
        <button 
          onClick={handleSave} 
          className="w-full py-6 bg-blue-600 text-white rounded-[2.5rem] font-black uppercase text-sm shadow-xl shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          <ShieldCheck size={22}/> Save Entry
        </button>
      </div>
    </div>
  );
};

export default AddTransactionModal;