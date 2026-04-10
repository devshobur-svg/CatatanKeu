import React from "react";
import { ChevronLeft, ShieldCheck, Tag } from "lucide-react";
import Numpad from "../Numpad";

const AddCategoryModal = ({ 
  show, setShow, newCat, setNewCat, 
  handleNumpad, handleSave, formatRupiah, getDynamicFontSize, t 
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col animate-in slide-in-from-bottom duration-500 bg-[#F8F9FE] dark:bg-slate-900">
      <div className="p-6 flex justify-between items-center">
        <button onClick={() => setShow(false)} className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm"><ChevronLeft className="text-blue-600"/></button>
        <h2 className="font-black italic uppercase tracking-widest">New Category</h2>
        <div className="w-12"></div>
      </div>

      <div className="flex-1 px-6 space-y-6">
        <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-[3rem] border shadow-md">
          <p className="text-[10px] font-black uppercase opacity-40 mb-3 italic tracking-widest">Set Limit</p>
          <h1 className={`${getDynamicFontSize ? getDynamicFontSize(formatRupiah(newCat.limit || "0").length) : 'text-4xl'} font-black italic tracking-tighter text-blue-600`}>
            Rp {newCat.limit ? formatRupiah(newCat.limit) : "0"}
          </h1>
        </div>

        <input 
          type="text" 
          placeholder="CATEGORY NAME" 
          value={newCat.name} 
          onChange={(e) => setNewCat({...newCat, name: e.target.value})} 
          className="w-full p-5 rounded-2xl border outline-none font-black text-xs uppercase shadow-sm dark:bg-slate-800 dark:border-slate-700" 
        />
      </div>

      <div className="p-6 bg-white dark:bg-slate-800 rounded-t-[3.5rem] shadow-2xl">
        <Numpad onClick={(val) => handleNumpad(val, 'cat')} />
        <button onClick={handleSave} className="w-full py-6 bg-blue-600 text-white rounded-[2.5rem] font-black uppercase text-sm shadow-xl flex items-center justify-center gap-3">
          <ShieldCheck size={22}/> Save Category
        </button>
      </div>
    </div>
  );
};

export default AddCategoryModal;