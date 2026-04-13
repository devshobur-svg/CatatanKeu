import React, { useState, useMemo } from "react";
import { X, Plus, Trash2, Calculator, Download, ShoppingBag } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const AVATAR_OPTIONS = ["👤", "🦁", "🦊", "🐻", "🐼", "🦄", "🐲", "🐱"];

const SplitBillModal = ({ show, setShow, formatRupiah, showNotice }) => {
  const [members, setMembers] = useState([]);
  const [memberName, setMemberName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  
  const [items, setItems] = useState([]);
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState(""); // Disimpan sebagai string mentah
  const [assignee, setAssignee] = useState("");

  const [tax, setTax] = useState("");
  const [shipping, setShipping] = useState("");
  const [discount, setDiscount] = useState("");

  // Helper untuk membersihkan titik sebelum kalkulasi
  const cleanNum = (val) => Number(val.toString().replace(/\D/g, "")) || 0;

  // --- 1. LOGIC CALCULATOR (CLEAN DATA ONLY) ---
  const totals = useMemo(() => {
    const subtotal = items.reduce((acc, item) => acc + item.price, 0);
    const taxNum = cleanNum(tax);
    const shipNum = cleanNum(shipping);
    const discNum = cleanNum(discount);
    const grandTotal = subtotal + taxNum + shipNum - discNum;

    const memberTotals = members.map(m => {
      const itemsOwned = items.filter(it => it.memberId === m.id);
      const memberSubtotal = itemsOwned.reduce((acc, it) => acc + it.price, 0);
      const ratio = subtotal > 0 ? memberSubtotal / subtotal : 0;
      
      return {
        ...m,
        items: itemsOwned,
        subtotal: memberSubtotal,
        taxShare: ratio * taxNum,
        shipShare: ratio * shipNum,
        discShare: ratio * discNum,
        finalTotal: memberSubtotal + (ratio * taxNum) + (ratio * shipNum) - (ratio * discNum)
      };
    });
    return { subtotal, grandTotal, memberTotals };
  }, [items, members, tax, shipping, discount]);

  const handleAddMember = () => {
    if (!memberName) return showNotice?.("Nama member jangan kosong!", "error");
    setMembers([...members, { id: Date.now(), name: memberName, avatar: selectedAvatar }]);
    setMemberName("");
    setSelectedAvatar(AVATAR_OPTIONS[0]);
  };

  const handleAddItem = () => {
    const rawPrice = cleanNum(itemPrice);
    if (!itemName || rawPrice <= 0 || !assignee) return showNotice?.("Lengkapi data item!", "error");
    setItems([...items, { id: Date.now(), name: itemName, price: rawPrice, memberId: Number(assignee) }]);
    setItemName("");
    setItemPrice("");
  };

  const handleShareResult = () => {
    if (items.length === 0) return;
    try {
      const doc = new jsPDF();
      const fileName = `SplitPower_${new Date().getTime()}.pdf`;
      doc.setFillColor(15, 23, 42); doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.setFont("helvetica", "bold");
      doc.text("SPLIT POWER REPORT", 15, 25);
      
      let yPos = 55;
      totals.memberTotals.forEach((m, index) => {
        doc.setTextColor(37, 99, 235); doc.setFontSize(14); 
        doc.text(`${m.avatar} ${index + 1}. ${m.name.toUpperCase()}`, 15, yPos);
        const rows = [
          ...m.items.map(it => [it.name, `Rp ${formatRupiah(it.price)}`]),
          [{ content: 'Tax Share (+)', styles: { textColor: [59, 130, 246] } }, `+ Rp ${formatRupiah(Math.round(m.taxShare))}`],
          [{ content: 'Ship Share (+)', styles: { textColor: [99, 102, 241] } }, `+ Rp ${formatRupiah(Math.round(m.shipShare))}`],
          [{ content: 'Disc Share (-)', styles: { textColor: [244, 63, 94] } }, `- Rp ${formatRupiah(Math.round(m.discShare))}`],
          [{ content: 'TOTAL PAYABLE', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } }, `Rp ${formatRupiah(Math.round(m.finalTotal))}`]
        ];
        autoTable(doc, { startY: yPos + 5, head: [['Description', 'Amount']], body: rows, theme: 'grid', headStyles: { fillColor: [15, 23, 42] } });
        yPos = doc.lastAutoTable.finalY + 15;
        if (yPos > 260) { doc.addPage(); yPos = 20; }
      });
      doc.save(fileName);
    } catch (e) { console.error(e); }
  };

  if (!show) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundColor: '#020617', opacity: 0.98, backdropFilter: 'blur(20px)' }} onClick={() => setShow(false)} />

      <div style={{ position: 'relative', width: '100%', maxWidth: '480px', backgroundColor: '#0B1221', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden' }}>
        
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-3">
            <Calculator className="text-blue-500" />
            <h2 className="text-xs font-black uppercase text-white tracking-[0.3em]">Split Power</h2>
          </div>
          <button onClick={() => setShow(false)} className="p-2 text-slate-500 hover:text-white transition-all"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-10">
          {/* EXTRA COSTS (FIXED FORMATTING) */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Tax', val: tax, set: setTax, color: 'text-blue-400' },
              { label: 'Ship', val: shipping, set: setShipping, color: 'text-indigo-400' },
              { label: 'Disc', val: discount, set: setDiscount, color: 'text-rose-400' }
            ].map((f, i) => (
              <div key={i} className="bg-white/5 p-4 rounded-3xl border border-white/5 group active:scale-95 transition-all">
                <p className={`text-[8px] font-black uppercase mb-1 ${f.color}`}>{f.label}</p>
                <input 
                   type="text" 
                   value={f.val ? formatRupiah(cleanNum(f.val)) : ""} 
                   onChange={(e) => f.set(e.target.value.replace(/\D/g, ""))}
                   style={{ backgroundColor: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%', fontWeight: '900', fontSize: '11px' }}
                   placeholder="Rp 0"
                />
              </div>
            ))}
          </div>

          {/* ADD MEMBER */}
          <div className="space-y-4">
             <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic ml-2">1. Add Members & Avatar</p>
             <div className="flex flex-wrap gap-2 mb-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                {AVATAR_OPTIONS.map(ava => (
                  <button key={ava} onClick={() => setSelectedAvatar(ava)} className={`text-xl p-2 rounded-xl transition-all ${selectedAvatar === ava ? 'bg-blue-600 scale-110 shadow-lg' : 'opacity-30 hover:opacity-100'}`}>
                    {ava}
                  </button>
                ))}
             </div>
             <div className="flex gap-3">
               <div className="flex-1 relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">{selectedAvatar}</span>
                  <input 
                    value={memberName} onChange={(e) => setMemberName(e.target.value)}
                    style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '18px 18px 18px 45px', borderRadius: '20px', color: 'white', fontWeight: '700', outline: 'none' }}
                    placeholder="Member Name..."
                  />
               </div>
               <button onClick={handleAddMember} style={{ width: '60px', backgroundColor: '#2563eb', borderRadius: '20px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus /></button>
             </div>
             <div className="flex flex-wrap gap-2">
                {members.map(m => (
                  <div key={m.id} className="bg-blue-600/10 border border-blue-500/20 px-4 py-2 rounded-xl flex items-center gap-2 animate-in zoom-in-90">
                    <span className="text-sm">{m.avatar}</span>
                    <span className="text-[10px] font-black uppercase text-blue-400">{m.name}</span>
                    <X size={12} className="text-blue-500 cursor-pointer" onClick={() => setMembers(members.filter(x => x.id !== m.id))} />
                  </div>
                ))}
             </div>
          </div>

          {/* ASSIGN ITEMS (FIXED PRICE FORMATTING) */}
          <div className="bg-white/5 rounded-[2.5rem] p-7 border border-white/5 space-y-5">
             <div className="relative group">
               <ShoppingBag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
               <input 
                 value={itemName} onChange={(e) => setItemName(e.target.value)}
                 style={{ width: '100%', backgroundColor: '#020617', border: '1px solid rgba(255,255,255,0.05)', padding: '16px 16px 16px 50px', borderRadius: '20px', color: 'white', fontWeight: '700', outline: 'none' }}
                 placeholder="Item Name..."
               />
             </div>
             <div className="grid grid-cols-2 gap-3">
                <input 
                  type="text" 
                  value={itemPrice ? formatRupiah(cleanNum(itemPrice)) : ""} 
                  onChange={(e) => setItemPrice(e.target.value.replace(/\D/g, ""))}
                  style={{ backgroundColor: '#020617', border: '1px solid rgba(255,255,255,0.1)', padding: '16px', borderRadius: '20px', color: '#3b82f6', fontWeight: '900', textAlign: 'center', outline: 'none' }}
                  placeholder="Rp Price"
                />
                <select 
                  value={assignee} onChange={(e) => setAssignee(e.target.value)}
                  style={{ backgroundColor: '#020617', border: '1px solid rgba(255,255,255,0.1)', padding: '16px', borderRadius: '20px', color: 'white', outline: 'none', fontSize: '10px', textTransform: 'uppercase' }}
                >
                  <option value="">Owner?</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.avatar} {m.name}</option>)}
                </select>
             </div>
             <button onClick={handleAddItem} style={{ width: '100%', padding: '20px', backgroundColor: 'white', color: '#020617', borderRadius: '22px', fontWeight: '900', textTransform: 'uppercase', fontSize: '11px', boxShadow: '0 10px 20px -10px rgba(255,255,255,0.2)' }}>Add to List</button>
          </div>

          {/* SETTLEMENT LIST */}
          <div className="space-y-4 pb-10">
            <div className="flex justify-between items-end border-b border-white/5 pb-4">
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Settlement</p>
               <p className="text-2xl font-black text-blue-500 italic tracking-tighter">Rp {formatRupiah(totals.grandTotal)}</p>
            </div>
            <div className="space-y-4">
              {totals.memberTotals.map(m => (
                <div key={m.id} className="bg-slate-900/40 border border-white/5 p-7 rounded-[2.5rem] shadow-inner">
                  <div className="flex justify-between mb-4 border-b border-white/5 pb-3">
                    <div className="flex items-center gap-3">
                       <span className="text-2xl">{m.avatar}</span>
                       <span className="text-[11px] font-black text-blue-400 uppercase tracking-tight">{m.name}</span>
                    </div>
                    <span className="text-base font-black text-white italic">Rp {formatRupiah(Math.round(m.finalTotal))}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-y-2 text-[9px] font-bold uppercase text-slate-500">
                    <span>Base Items</span><span className="text-right text-slate-300">Rp {formatRupiah(m.subtotal)}</span>
                    <span className="text-blue-500/70">Tax Share (+)</span><span className="text-right">Rp {formatRupiah(Math.round(m.taxShare))}</span>
                    <span className="text-indigo-500/70">Ship Share (+)</span><span className="text-right">Rp {formatRupiah(Math.round(m.shipShare))}</span>
                    <span className="text-rose-500/70">Disc Share (-)</span><span className="text-right">Rp {formatRupiah(Math.round(m.discShare))}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-8 bg-slate-900 border-t border-white/5 flex gap-4 shrink-0">
          <button onClick={handleShareResult} disabled={items.length === 0} className="flex-1 py-5 bg-white/5 text-white rounded-[2rem] font-black uppercase text-[9px] tracking-[0.2em] border border-white/10 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-10 transition-all">
            <Download size={16} /> Detail PDF
          </button>
          <button onClick={() => setShow(false)} className="flex-[1.5] py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-[9px] tracking-[0.2em] shadow-2xl shadow-blue-600/30 active:scale-95 transition-all">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SplitBillModal;