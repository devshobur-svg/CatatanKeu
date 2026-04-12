import React, { useState, useMemo } from "react";
import { X, Plus, Trash2, Receipt, Truck, Percent, Share2, Calculator, Download, Landmark, Users } from "lucide-react";
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

  // --- LOGIC CALCULATOR ---
  const totals = useMemo(() => {
    const subtotal = items.reduce((acc, item) => acc + item.price, 0);
    const taxNum = Number(tax.replace(/\D/g, "")) || 0;
    const shipNum = Number(shipping.replace(/\D/g, "")) || 0;
    const discNum = Number(discount.replace(/\D/g, "")) || 0;
    const grandTotal = subtotal + taxNum + shipNum - discNum;

    const memberTotals = members.map(m => {
      const itemsOwned = items.filter(it => it.memberId === m.id);
      const memberSubtotal = itemsOwned.reduce((acc, it) => acc + it.price, 0);
      const ratio = subtotal > 0 ? memberSubtotal / subtotal : 0;
      return {
        ...m,
        items: itemsOwned,
        subtotal: memberSubtotal,
        finalTotal: memberSubtotal + (ratio * taxNum) + (ratio * shipNum) - (ratio * discNum)
      };
    });
    return { subtotal, grandTotal, memberTotals };
  }, [items, members, tax, shipping, discount]);

  // --- POWERFULL PDF EXPORT ---
  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF();
      const fileName = `SplitBill_Report_${new Date().getTime()}.pdf`;

      // Brand Header
      doc.setFillColor(15, 23, 42); doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.setFont("helvetica", "bold");
      doc.text("SPLIT POWER REPORT", 15, 25);
      
      let yPos = 55;
      totals.memberTotals.forEach((m, index) => {
        doc.setTextColor(37, 99, 235); doc.setFontSize(14); doc.text(`${index + 1}. ${m.name.toUpperCase()}`, 15, yPos);
        
        const rows = [
          ...m.items.map(it => [it.name, `Rp ${formatRupiah(it.price)}`]),
          [{ content: 'Total Payable', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } }, `Rp ${formatRupiah(Math.round(m.finalTotal))}`]
        ];

        autoTable(doc, {
          startY: yPos + 5,
          head: [['Item Description', 'Price Share']],
          body: rows,
          theme: 'grid',
          headStyles: { fillColor: [15, 23, 42] },
          margin: { left: 15 }
        });
        yPos = doc.lastAutoTable.finalY + 15;
      });

      doc.save(fileName);
    } catch (e) { console.error("PDF Error", e); }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/98 backdrop-blur-3xl" onClick={() => setShow(false)} />

      <div className="relative w-full max-w-lg bg-[#0B1221] border border-white/10 rounded-[3.5rem] shadow-2xl overflow-hidden h-[90vh] flex flex-col animate-in zoom-in-95">
        
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <Calculator className="text-blue-500" />
            <h2 className="text-xs font-black uppercase text-white tracking-[0.3em]">Split Power</h2>
          </div>
          <button onClick={() => setShow(false)} className="p-3 bg-white/5 rounded-2xl text-slate-500 hover:text-white transition-all"><X size={20} /></button>
        </div>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-10">
          
          {/* 1. EXTRA COSTS (Fix Kotak Putih: Pake bg-transparent & appearance-none) */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Tax', val: tax, set: setTax, color: 'text-blue-400' },
              { label: 'Ship', val: shipping, set: setShipping, color: 'text-indigo-400' },
              { label: 'Disc', val: discount, set: setDiscount, color: 'text-rose-400' }
            ].map((f, i) => (
              <div key={i} className="bg-white/5 p-4 rounded-3xl border border-white/5 focus-within:border-blue-500/50 transition-all">
                <p className={`text-[8px] font-black uppercase mb-1 ${f.color}`}>{f.label}</p>
                <input 
                  type="text" value={f.val} onChange={(e) => f.set(e.target.value)}
                  className="bg-transparent border-none w-full text-white text-xs font-black outline-none appearance-none p-0"
                  placeholder="0"
                />
              </div>
            ))}
          </div>

          {/* 2. MEMBERS */}
          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic ml-2">1. Add Group Members</p>
            <div className="flex gap-3">
              <input 
                value={memberName} onChange={(e) => setMemberName(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 p-5 rounded-[1.8rem] text-white font-bold outline-none focus:border-blue-500 transition-all appearance-none"
                placeholder="Name..."
              />
              <button onClick={() => { if(memberName) { setMembers([...members, { id: Date.now(), name: memberName }]); setMemberName(""); } }} className="w-16 bg-blue-600 rounded-[1.8rem] flex items-center justify-center text-white shadow-lg active:scale-90 transition-all"><Plus /></button>
            </div>
            <div className="flex flex-wrap gap-2">
              {members.map(m => (
                <div key={m.id} className="bg-blue-600/10 border border-blue-500/20 px-5 py-2.5 rounded-2xl flex items-center gap-3 animate-in fade-in">
                  <span className="text-[10px] font-black uppercase text-blue-400">{m.name}</span>
                  <X size={14} className="text-blue-500 cursor-pointer" onClick={() => setMembers(members.filter(x => x.id !== m.id))} />
                </div>
              ))}
            </div>
          </div>

          {/* 3. ASSIGN ITEMS (Fix Kotak Putih) */}
          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic ml-2">2. Assign Bills</p>
            <div className="bg-white/5 rounded-[3rem] p-8 border border-white/5 space-y-6">
              <input 
                value={itemName} onChange={(e) => setItemName(e.target.value)}
                className="w-full bg-transparent border-b border-white/10 p-2 text-center text-white font-black italic outline-none appearance-none"
                placeholder="Item Name (ex: Pizza)"
              />
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="number" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)}
                  className="bg-slate-900 border border-white/10 p-5 rounded-2xl text-blue-400 font-black text-center outline-none appearance-none"
                  placeholder="Price"
                />
                <select 
                  value={assignee} onChange={(e) => setAssignee(e.target.value)}
                  className="bg-slate-900 border border-white/10 p-5 rounded-2xl text-white font-black text-[10px] uppercase outline-none appearance-none text-center"
                >
                  <option value="" className="bg-[#0B1221]">Owner?</option>
                  {members.map(m => <option key={m.id} value={m.id} className="bg-[#0B1221]">{m.name}</option>)}
                </select>
              </div>
              <button onClick={() => { if(itemName && itemPrice && assignee) { setItems([...items, { id: Date.now(), name: itemName, price: Number(itemPrice), memberId: Number(assignee) }]); setItemName(""); setItemPrice(""); } }} className="w-full py-5 bg-white text-slate-950 rounded-[2rem] font-black uppercase text-[11px] tracking-widest active:scale-95 transition-all">Add To Bill List</button>
            </div>
          </div>

          {/* 4. SETTLEMENT (Tampilan Akhir) */}
          <div className="space-y-6 pb-10">
            <div className="flex justify-between items-end border-b border-white/5 pb-4">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Settlement</p>
                <p className="text-2xl font-black text-blue-500 italic tracking-tighter">Rp {formatRupiah(totals.grandTotal)}</p>
            </div>
            <div className="space-y-4">
              {totals.memberTotals.map(m => (
                <div key={m.id} className="bg-slate-900/80 border border-white/5 p-6 rounded-[2.5rem] flex justify-between items-center group">
                  <div>
                    <p className="text-[10px] font-black uppercase text-blue-400 mb-1">{m.name}</p>
                    <p className="text-xs font-bold text-slate-500">{m.items.length} Items</p>
                  </div>
                  <p className="text-lg font-black text-white italic">Rp {formatRupiah(Math.round(m.finalTotal))}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-8 bg-slate-900 border-t border-white/5 flex gap-4 shrink-0">
          <button onClick={handleDownloadPDF} disabled={items.length === 0} className="flex-1 py-5 bg-white/5 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest border border-white/10 flex items-center justify-center gap-3 hover:bg-white/10 disabled:opacity-20"><Download size={18} /> PDF</button>
          <button onClick={() => setShow(false)} className="flex-[2] py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">Done</button>
        </div>
      </div>
    </div>
  );
};

export default SplitBillModal;