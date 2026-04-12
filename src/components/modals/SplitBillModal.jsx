import React, { useState, useMemo } from "react";
import { X, Plus, Trash2, Receipt, Truck, Percent, Share2, Calculator, Download, ShoppingBag } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const SplitBillModal = ({ show, setShow, formatRupiah }) => {
  const [members, setMembers] = useState([]);
  const [memberName, setMemberName] = useState("");
  const [items, setItems] = useState([]);
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState(""); 
  const [assignee, setAssignee] = useState("");

  const [tax, setTax] = useState("");
  const [shipping, setShipping] = useState("");
  const [discount, setDiscount] = useState("");

  // --- 1. LOGIC CALCULATOR (ZERO CONFLICT) ---
  const totals = useMemo(() => {
    const subtotal = items.reduce((acc, item) => acc + item.price, 0);
    const taxNum = Number(tax.toString().replace(/\D/g, "")) || 0;
    const shipNum = Number(shipping.toString().replace(/\D/g, "")) || 0;
    const discNum = Number(discount.toString().replace(/\D/g, "")) || 0;
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

  // --- 2. THE FIXED PDF FUNCTION (Renamed to match button) ---
  const handleShareResult = () => {
    if (items.length === 0) return;
    try {
      const doc = new jsPDF();
      const fileName = `SplitPower_${new Date().getTime()}.pdf`;

      // Header Design
      doc.setFillColor(15, 23, 42); doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.setFont("helvetica", "bold");
      doc.text("SPLIT POWER REPORT", 15, 25);
      
      let yPos = 55;
      totals.memberTotals.forEach((m, index) => {
        doc.setTextColor(37, 99, 235); doc.setFontSize(14); doc.text(`${index + 1}. ${m.name.toUpperCase()}`, 15, yPos);
        
        const rows = [
          ...m.items.map(it => [it.name, `Rp ${formatRupiah(it.price)}`]),
          [{ content: 'Tax Share (+)', styles: { textColor: [59, 130, 246] } }, `+ Rp ${formatRupiah(Math.round(m.taxShare))}`],
          [{ content: 'Ship Share (+)', styles: { textColor: [99, 102, 241] } }, `+ Rp ${formatRupiah(Math.round(m.shipShare))}`],
          [{ content: 'Disc Share (-)', styles: { textColor: [244, 63, 94] } }, `- Rp ${formatRupiah(Math.round(m.discShare))}`],
          [{ content: 'TOTAL PAYABLE', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } }, `Rp ${formatRupiah(Math.round(m.finalTotal))}`]
        ];

        autoTable(doc, {
          startY: yPos + 5,
          head: [['Description', 'Amount']],
          body: rows,
          theme: 'grid',
          headStyles: { fillColor: [15, 23, 42] }
        });
        yPos = doc.lastAutoTable.finalY + 15;
        if (yPos > 260) { doc.addPage(); yPos = 20; }
      });

      doc.save(fileName);
    } catch (e) {
      console.error("PDF Generation failed", e);
    }
  };

  if (!show) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundColor: '#020617', opacity: 0.98, backdropFilter: 'blur(20px)' }} onClick={() => setShow(false)} />

      <div style={{ position: 'relative', width: '100%', maxWidth: '480px', backgroundColor: '#0B1221', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden' }}>
        
        {/* HEADER */}
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-3">
            <Calculator className="text-blue-500" />
            <h2 className="text-xs font-black uppercase text-white tracking-[0.3em]">Split Power</h2>
          </div>
          <button onClick={() => setShow(false)} className="p-2 text-slate-500 hover:text-white transition-all"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-10">
          {/* EXTRA COSTS */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Tax', val: tax, set: setTax, color: 'text-blue-400' },
              { label: 'Ship', val: shipping, set: setShipping, color: 'text-indigo-400' },
              { label: 'Disc', val: discount, set: setDiscount, color: 'text-rose-400' }
            ].map((f, i) => (
              <div key={i} className="bg-white/5 p-4 rounded-3xl border border-white/5">
                <p className={`text-[8px] font-black uppercase mb-1 ${f.color}`}>{f.label}</p>
                <input 
                   type="text" value={f.val} 
                   onChange={(e) => f.set(e.target.value.replace(/\D/g, ""))}
                   style={{ backgroundColor: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%', fontWeight: '900', fontSize: '12px' }}
                   placeholder="0"
                />
              </div>
            ))}
          </div>

          {/* ADD MEMBER */}
          <div className="space-y-4">
             <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic ml-2">1. Add Members</p>
             <div className="flex gap-3">
               <input 
                 value={memberName} onChange={(e) => setMemberName(e.target.value)}
                 style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '18px', borderRadius: '20px', color: 'white', fontWeight: '700', outline: 'none' }}
                 placeholder="Name..."
               />
               <button onClick={() => { if(memberName) { setMembers([...members, { id: Date.now(), name: memberName }]); setMemberName(""); } }} style={{ width: '60px', backgroundColor: '#2563eb', borderRadius: '20px', color: 'white', display: 'flex', alignItems: 'center', justifyCenter: 'center' }}><Plus style={{margin:'auto'}}/></button>
             </div>
             <div className="flex flex-wrap gap-2">
                {members.map(m => (
                  <div key={m.id} className="bg-blue-600/10 border border-blue-500/20 px-4 py-2 rounded-xl flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-blue-400">{m.name}</span>
                    <X size={12} className="text-blue-500 cursor-pointer" onClick={() => setMembers(members.filter(x => x.id !== m.id))} />
                  </div>
                ))}
             </div>
          </div>

          {/* ASSIGN ITEMS */}
          <div className="bg-white/5 rounded-[2.5rem] p-6 border border-white/5 space-y-4">
             <div className="relative group">
               <ShoppingBag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
               <input 
                 value={itemName} onChange={(e) => setItemName(e.target.value)}
                 style={{ width: '100%', backgroundColor: '#020617', border: '1px solid rgba(255,255,255,0.05)', padding: '16px 16px 16px 50px', borderRadius: '18px', color: 'white', fontWeight: '700', outline: 'none' }}
                 placeholder="Item Name..."
               />
             </div>
             <div className="grid grid-cols-2 gap-3">
                <input 
                  type="number" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)}
                  style={{ backgroundColor: '#020617', border: '1px solid rgba(255,255,255,0.05)', padding: '16px', borderRadius: '18px', color: '#3b82f6', fontWeight: '900', textAlign: 'center', outline: 'none' }}
                  placeholder="Price"
                />
                <select 
                  value={assignee} onChange={(e) => setAssignee(e.target.value)}
                  style={{ backgroundColor: '#020617', border: '1px solid rgba(255,255,255,0.05)', padding: '16px', borderRadius: '18px', color: 'white', outline: 'none', fontSize: '10px', textTransform: 'uppercase' }}
                >
                  <option value="">Owner?</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
             </div>
             <button onClick={() => { if(itemName && itemPrice && assignee) { setItems([...items, { id: Date.now(), name: itemName, price: Number(itemPrice), memberId: Number(assignee) }]); setItemName(""); setItemPrice(""); } }} style={{ width: '100%', padding: '18px', backgroundColor: 'white', color: '#020617', borderRadius: '20px', fontWeight: '900', textTransform: 'uppercase', fontSize: '11px' }}>Add to List</button>
          </div>

          {/* SETTLEMENT LIST */}
          <div className="space-y-4 pb-10">
            <div className="flex justify-between items-end border-b border-white/5 pb-4">
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Settlement</p>
               <p className="text-2xl font-black text-blue-500 italic">Rp {formatRupiah(totals.grandTotal)}</p>
            </div>
            <div className="space-y-3">
              {totals.memberTotals.map(m => (
                <div key={m.id} className="bg-slate-900/80 border border-white/5 p-6 rounded-[2.5rem]">
                  <div className="flex justify-between mb-4 border-b border-white/5 pb-2">
                    <span className="text-xs font-black text-blue-400 uppercase">{m.name}</span>
                    <span className="text-base font-black text-white italic">Rp {formatRupiah(Math.round(m.finalTotal))}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-y-1 text-[9px] font-bold uppercase text-slate-500">
                    <span>Base Items</span><span className="text-right">Rp {formatRupiah(m.subtotal)}</span>
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
          <button 
            onClick={handleShareResult} 
            disabled={items.length === 0}
            className="flex-1 py-5 bg-white/5 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest border border-white/10 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-20 transition-all"
          >
            <Download size={18} /> Detail PDF
          </button>
          <button 
            onClick={() => setShow(false)} 
            className="flex-[1.5] py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SplitBillModal;