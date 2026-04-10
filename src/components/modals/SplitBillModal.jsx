import React, { useState, useMemo } from "react";
import { ChevronLeft, Trash2, Plus, X, Delete } from "lucide-react";

const SplitBillModal = ({ show, setShow, darkMode, formatRupiah, getDynamicFontSize }) => {
  // 1. HOOKS (Urutan tetap terjaga)
  const [members, setMembers] = useState([]);
  const [items, setItems] = useState([]);
  const [extra, setExtra] = useState({ tax: "", shipping: "", discount: "" });
  const [newMemberName, setNewMemberName] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");

  const splitCalc = useMemo(() => {
    const subtotal = items.reduce((a, b) => a + b.price, 0);
    const tax = Number(extra.tax) || 0;
    const ship = Number(extra.shipping) || 0;
    const disc = Number(extra.discount) || 0;
    const grandTotal = subtotal + tax + ship - disc;
    
    const memberBills = members.map(m => {
      const itemTotal = items.filter(i => i.ownerId === m.id).reduce((a, b) => a + b.price, 0);
      const ratio = subtotal > 0 ? itemTotal / subtotal : 0;
      return { 
        ...m, 
        total: itemTotal + (tax * ratio) + (ship * ratio) - (disc * ratio) 
      };
    });
    return { grandTotal, memberBills };
  }, [items, members, extra]);

  // 2. RENDER CHECK
  if (!show) return null;

  return (
    <div className={`fixed inset-0 z-[999] flex flex-col animate-in slide-in-from-bottom duration-500 ${darkMode ? 'bg-slate-900 text-white' : 'bg-[#F8F9FE] text-slate-900'}`}>
      
      {/* HEADER - Dibuat lebih slim */}
      <div className="flex items-center justify-between px-6 py-4 shrink-0 bg-slate-900 text-white rounded-b-[2.5rem] shadow-xl">
        <button onClick={() => setShow(false)} className="p-2 bg-white/10 rounded-xl active:scale-90"><ChevronLeft size={20}/></button>
        <h2 className="font-black italic uppercase tracking-tighter text-blue-500 text-sm">Split Power</h2>
        <button onClick={() => {setMembers([]); setItems([]); setExtra({tax:"", shipping:"", discount:""})}} className="p-2 bg-red-500/10 text-red-500 rounded-xl active:scale-90"><Trash2 size={18}/></button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-5 space-y-5 no-scrollbar pb-24">
        
        {/* EXTRA INPUTS - Formatting Fix (Tax, Ship, Disc) */}
        <div className="grid grid-cols-3 gap-2">
          {['tax', 'shipping', 'discount'].map(key => (
            <div key={key} className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <span className="text-[7px] font-black uppercase opacity-40 mb-1 block text-center">{key}</span>
              <div className="flex items-center justify-center">
                <span className="text-[8px] font-bold opacity-30 mr-0.5">Rp</span>
                <input 
                  type="text" 
                  inputMode="numeric"
                  placeholder="0"
                  value={extra[key] ? formatRupiah(extra[key]) : ""} 
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setExtra({...extra, [key]: val});
                  }} 
                  className="w-full bg-transparent font-black text-[10px] text-center outline-none" 
                />
              </div>
            </div>
          ))}
        </div>

        {/* MEMBER INPUT - Lebih Padat */}
        <div className="space-y-3">
          <p className="text-[8px] font-black uppercase opacity-40 tracking-widest px-1">1. Add Members</p>
          <div className="flex gap-2">
            <input 
              value={newMemberName} 
              onChange={(e) => setNewMemberName(e.target.value)} 
              placeholder="Who's eating?" 
              className="flex-1 p-4 rounded-xl border outline-none font-black text-[10px] dark:bg-slate-800 dark:border-slate-700" 
            />
            <button 
              onClick={() => { if(!newMemberName) return; setMembers([...members, {id: Date.now(), name: newMemberName}]); setNewMemberName(""); }} 
              className="bg-blue-600 text-white px-5 rounded-xl shadow-lg active:scale-90"
            >
              <Plus size={18}/>
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            {members.map(m => (
              <div key={m.id} className="bg-blue-50 dark:bg-blue-900/20 p-2 px-4 rounded-full border border-blue-100 dark:border-blue-900/30 flex items-center gap-2 shrink-0">
                <span className="text-[8px] font-black uppercase text-blue-600">{m.name}</span>
                <button onClick={() => setMembers(members.filter(x => x.id !== m.id))}><X size={12} className="text-blue-400"/></button>
              </div>
            ))}
          </div>
        </div>

        {/* ITEM ENTRY - Font Responsive & Slim Layout */}
        <div className="space-y-3">
          <p className="text-[8px] font-black uppercase opacity-40 tracking-widest px-1">2. Assign Items</p>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm text-center">
             <p className="text-[7px] font-black opacity-30 uppercase mb-1">Entry Price</p>
             {/* FIX: Font Size diperkecil dengan getDynamicFontSize */}
             <h1 className={`${getDynamicFontSize(formatRupiah(newItemPrice).length)} font-black italic tracking-tighter text-blue-600 leading-none`}>
               Rp {newItemPrice ? formatRupiah(newItemPrice) : "0"}
             </h1>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <input 
              value={newItemName} 
              onChange={(e) => setNewItemName(e.target.value)} 
              placeholder="Item name..." 
              className="p-4 rounded-xl border outline-none font-black text-[10px] dark:bg-slate-800 dark:border-slate-700" 
            />
            <select 
              className="p-4 rounded-xl border font-black text-[9px] uppercase outline-none bg-blue-600 text-white" 
              onChange={(e) => {
                if(!newItemPrice || e.target.value === "") return;
                setItems([...items, {id: Date.now(), name: newItemName || "Menu", price: Number(newItemPrice), ownerId: Number(e.target.value)}]);
                setNewItemName(""); setNewItemPrice("");
              }} 
              value=""
            >
              <option value="">Assign To...</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>

          {/* NUMPAD - Lebih Compact */}
          <div className="grid grid-cols-3 gap-1 px-4">
            {[1,2,3,4,5,6,7,8,9,"00",0].map(n => (
              <button key={n} onClick={() => setNewItemPrice(prev => prev + n.toString())} className="py-2.5 text-lg font-black dark:text-white active:scale-90">{n}</button>
            ))}
            <button onClick={() => setNewItemPrice(prev => prev.slice(0, -1))} className="flex items-center justify-center text-rose-500 active:scale-90"><Delete size={20}/></button>
          </div>
        </div>

        {/* SETTLEMENT CARD - Hasil Perhitungan */}
        <div className="bg-slate-900 text-white p-6 rounded-[2.5rem] space-y-4 shadow-2xl border border-blue-500/20">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
             <span className="text-[8px] font-black uppercase text-blue-500 tracking-widest">Settlement</span>
             <div className="text-right">
                <span className="text-[7px] block opacity-40 font-black uppercase italic">Grand Total</span>
                <span className="text-xs font-black italic">Rp {formatRupiah(splitCalc.grandTotal)}</span>
             </div>
          </div>
          <div className="space-y-2">
            {splitCalc.memberBills.length > 0 ? splitCalc.memberBills.map(m => (
              <div key={m.id} className="flex justify-between items-center animate-in slide-in-from-left">
                <span className="font-black text-[9px] uppercase italic text-white/50">{m.name}</span>
                <span className="font-black text-[10px] text-blue-400">Rp {formatRupiah(Math.round(m.total))}</span>
              </div>
            )) : <p className="text-center text-[8px] font-black opacity-20 py-2 uppercase italic tracking-tighter">No transactions yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplitBillModal;