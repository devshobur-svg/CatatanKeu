import React, { useState, useMemo } from "react";
import { X, Plus, Trash2, Receipt, Truck, Percent, Share2 } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const SplitBillModal = ({ show, setShow, darkMode, formatRupiah }) => {
  // --- 1. HOOKS (ALWAYS AT TOP) ---
  const [members, setMembers] = useState([]);
  const [memberName, setMemberName] = useState("");
  const [items, setItems] = useState([]);
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState(""); 
  const [assignee, setAssignee] = useState("");

  const [tax, setTax] = useState("");
  const [shipping, setShipping] = useState("");
  const [discount, setDiscount] = useState("");

  // --- 2. HELPERS ---
  const formatInput = (val) => {
    if (!val) return "";
    const number = val.toString().replace(/\D/g, "");
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const parseNumber = (val) => {
    if (!val) return 0;
    return Number(val.toString().replace(/\D/g, ""));
  };

  // --- 3. LOGIC CALCULATOR ---
  const totals = useMemo(() => {
    const subtotal = items.reduce((acc, item) => acc + item.price, 0);
    const taxNum = parseNumber(tax);
    const shipNum = parseNumber(shipping);
    const discNum = parseNumber(discount);
    const grandTotal = subtotal + taxNum + shipNum - discNum;

    const memberTotals = members.map(m => {
      const itemsOwned = items.filter(it => it.memberId === m.id);
      const memberSubtotal = itemsOwned.reduce((acc, it) => acc + it.price, 0);
      const ratio = subtotal > 0 ? memberSubtotal / subtotal : 0;
      
      const shareOfTax = ratio * taxNum;
      const shareOfShip = ratio * shipNum;
      const shareOfDisc = ratio * discNum;
      
      return {
        ...m,
        items: itemsOwned,
        subtotal: memberSubtotal,
        taxShare: shareOfTax,
        shipShare: shareOfShip,
        discShare: shareOfDisc,
        finalTotal: memberSubtotal + shareOfTax + shareOfShip - shareOfDisc
      };
    });

    return { subtotal, grandTotal, memberTotals, taxNum, shipNum, discNum };
  }, [items, members, tax, shipping, discount]);

  // --- 4. EXPORT & SHARE PDF LOGIC ---
  const handleShareResult = async () => {
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString('id-ID', { 
        day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
    const fileName = `SplitPower_${new Date().getTime()}.pdf`;

    // Design PDF (Premium Dark Accents)
    doc.setFillColor(15, 23, 42); doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.setFont("helvetica", "bold");
    doc.text("SPLIT POWER REPORT", 15, 20);
    doc.setFontSize(9); doc.setFont("helvetica", "normal");
    doc.text(`Generated on: ${dateStr}`, 15, 28);

    // Summary Box
    doc.setFillColor(248, 250, 252); doc.roundedRect(145, 10, 50, 20, 3, 3, 'F');
    doc.setTextColor(30, 64, 175); doc.setFontSize(8); doc.text("GRAND TOTAL", 150, 17);
    doc.setFontSize(12); doc.text(`Rp ${formatRupiah(totals.grandTotal)}`, 150, 25);

    let currentY = 50;
    totals.memberTotals.forEach((m, index) => {
        doc.setTextColor(15, 23, 42); doc.setFontSize(11); doc.setFont("helvetica", "bold");
        doc.text(`${index + 1}. ${m.name.toUpperCase()}`, 15, currentY);
        
        const body = [
            ...m.items.map(it => [it.name, `Rp ${formatRupiah(it.price)}`]),
            [{content: 'Subtotal', styles: {fontStyle: 'bold'}}, `Rp ${formatRupiah(m.subtotal)}`],
            [{content: 'Tax share (+)', styles: {textColor: [59, 130, 246]}}, `+ Rp ${formatRupiah(Math.round(m.taxShare))}`],
            [{content: 'Ship share (+)', styles: {textColor: [99, 102, 241]}}, `+ Rp ${formatRupiah(Math.round(m.shipShare))}`],
            [{content: 'Disc share (-)', styles: {textColor: [244, 63, 94]}}, `- Rp ${formatRupiah(Math.round(m.discShare))}`],
            [{content: 'TOTAL PAYABLE', styles: {fillColor: [241, 245, 249], fontStyle: 'bold', textColor: [15, 23, 42]}}, `Rp ${formatRupiah(Math.round(m.finalTotal))}`]
        ];

        autoTable(doc, {
            startY: currentY + 4,
            body: body,
            theme: 'plain',
            styles: { fontSize: 8, cellPadding: 3 },
            columnStyles: { 1: { halign: 'right' } },
            margin: { left: 15, right: 15 }
        });
        currentY = doc.lastAutoTable.finalY + 12;
        if (currentY > 260) { doc.addPage(); currentY = 20; }
    });

    // Share Process
    try {
      const pdfBlob = doc.output('blob');
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Split Power Result',
          text: `Halo! Ini rincian tagihan split bill kita. Total: Rp ${formatRupiah(totals.grandTotal)}`,
        });
      } else {
        doc.save(fileName);
      }
    } catch (error) {
      console.error('Error sharing:', error);
      doc.save(fileName);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center sm:items-center p-0 sm:p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={() => setShow(false)}></div>
      
      <div className="relative w-full max-w-lg bg-[#0F172A] text-white rounded-t-[3.5rem] sm:rounded-[3.5rem] shadow-2xl overflow-hidden h-[94vh] flex flex-col animate-in slide-in-from-bottom-10 border border-white/5">
        
        {/* HEADER */}
        <div className="p-8 flex justify-between items-center border-b border-white/5 bg-slate-900/50">
          <button onClick={() => setShow(false)} className="p-3 bg-white/5 rounded-2xl active:scale-90 border border-white/5"><X size={20} /></button>
          <div className="text-center">
            <h2 className="text-[10px] font-black italic uppercase tracking-[0.4em] text-blue-500">Service</h2>
            <h1 className="text-sm font-black uppercase tracking-widest">Split Power</h1>
          </div>
          <button onClick={() => {setMembers([]); setItems([]); setTax(""); setShipping(""); setDiscount("");}} className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl border border-rose-500/10"><Trash2 size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-10 pb-40">
          
          {/* 1. EXTRA COSTS INPUTS */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Tax (+)', val: tax, set: setTax, icon: <Receipt size={14}/>, color: 'text-blue-400', bg: 'bg-blue-400/5' },
              { label: 'Ship (+)', val: shipping, set: setShipping, icon: <Truck size={14}/>, color: 'text-indigo-400', bg: 'bg-indigo-400/5' },
              { label: 'Disc (-)', val: discount, set: setDiscount, icon: <Percent size={14}/>, color: 'text-rose-400', bg: 'bg-rose-400/5' }
            ].map((f, i) => (
              <div key={i} className={`${f.bg} p-4 rounded-[2rem] border border-white/5 space-y-2`}>
                <div className={`flex items-center gap-2 ${f.color}`}>
                  {f.icon} <span className="text-[8px] font-black uppercase tracking-tighter">{f.label}</span>
                </div>
                <input 
                  type="text" inputMode="numeric" placeholder="0" 
                  value={formatInput(f.val)} onChange={(e) => f.set(e.target.value)} 
                  className="bg-transparent w-full text-xs font-black outline-none" 
                />
              </div>
            ))}
          </div>

          {/* 2. MEMBERS */}
          <div className="space-y-4 px-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">1. Member List</p>
            <div className="flex gap-3">
              <input value={memberName} onChange={(e) => setMemberName(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && setMembers([...members, { id: Date.now(), name: memberName }])} placeholder="Name..." className="flex-1 bg-white/5 border border-white/5 p-5 rounded-3xl outline-none font-bold" />
              <button onClick={() => { if(memberName) setMembers([...members, { id: Date.now(), name: memberName }]); setMemberName(""); }} className="w-16 bg-blue-600 rounded-3xl flex items-center justify-center active:scale-90 transition-all"><Plus size={24} /></button>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
              {members.map(m => (
                <div key={m.id} className="flex items-center gap-3 bg-white/5 px-5 py-2.5 rounded-2xl border border-white/10 shrink-0">
                  <span className="text-[10px] font-black uppercase italic tracking-tighter">{m.name}</span>
                  <button onClick={() => { setMembers(members.filter(x => x.id !== m.id)); setItems(items.filter(it => it.memberId !== m.id)); }} className="text-rose-500"><X size={14}/></button>
                </div>
              ))}
            </div>
          </div>

          {/* 3. ASSIGN ITEMS */}
          <div className="space-y-4 px-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">2. Assign Items</p>
            <div className="bg-slate-900/50 rounded-[3rem] p-8 border border-white/5 space-y-6">
              <div className="space-y-4">
                <input placeholder="Item name..." value={itemName} onChange={(e) => setItemName(e.target.value)} className="w-full bg-transparent border-b border-white/10 p-3 outline-none font-bold text-center italic" />
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" inputMode="numeric" placeholder="Price" value={formatInput(itemPrice)} onChange={(e) => setItemPrice(e.target.value)} className="bg-white/5 p-4 rounded-2xl outline-none font-black text-blue-400 text-center" />
                  <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="bg-white/5 p-4 rounded-2xl outline-none font-black text-[10px] uppercase text-slate-300 text-center">
                    <option value="">Who?</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={() => { if(itemName && itemPrice && assignee) { setItems([...items, { id: Date.now(), name: itemName, price: parseNumber(itemPrice), memberId: Number(assignee) }]); setItemName(""); setItemPrice(""); } }} className="w-full py-5 bg-white text-slate-900 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] active:scale-95 transition-all">Add To List</button>
            </div>
          </div>

          {/* 4. SETTLEMENT DETAILS */}
          <div className="space-y-6 px-2 pb-10">
             <div className="flex justify-between items-end px-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Settlement Details</p>
                <div className="text-right">
                    <p className="text-[8px] font-black uppercase opacity-30 italic">Grand Total</p>
                    <p className="text-2xl font-black italic text-blue-500 tracking-tighter">Rp {formatRupiah(totals.grandTotal)}</p>
                </div>
             </div>

             <div className="space-y-3">
                {totals.memberTotals.map(m => (
                  <div key={m.id} className="bg-slate-900/80 rounded-[2.5rem] p-6 border border-white/5 space-y-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                        <p className="text-sm font-black uppercase italic text-blue-400">{m.name}</p>
                        <p className="text-base font-black italic tracking-tighter text-white">Rp {formatRupiah(Math.round(m.finalTotal))}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-y-2">
                        <div className="text-[9px] font-bold text-slate-500 uppercase">Base Price</div>
                        <div className="text-[9px] font-black text-right text-slate-300">Rp {formatRupiah(m.subtotal)}</div>
                        <div className="text-[9px] font-bold text-slate-500 uppercase">Tax Share (+)</div>
                        <div className="text-[9px] font-black text-right text-blue-500/70">+ Rp {formatRupiah(Math.round(m.taxShare))}</div>
                        <div className="text-[9px] font-bold text-slate-500 uppercase">Ship Share (+)</div>
                        <div className="text-[9px] font-black text-right text-indigo-500/70">+ Rp {formatRupiah(Math.round(m.shipShare))}</div>
                        <div className="text-[9px] font-bold text-slate-500 uppercase">Discount Share (-)</div>
                        <div className="text-[9px] font-black text-right text-rose-500/70">- Rp {formatRupiah(Math.round(m.discShare))}</div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-slate-900/90 backdrop-blur-md border-t border-white/5 flex gap-3">
            <button 
                onClick={handleShareResult}
                disabled={items.length === 0}
                className="w-full bg-blue-600 disabled:bg-slate-800 disabled:text-slate-600 py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-blue-500/20"
            >
                <Share2 size={18} /> Share Settlement Report
            </button>
        </div>

      </div>
    </div>
  );
};

export default SplitBillModal;