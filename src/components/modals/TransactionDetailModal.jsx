import React from "react";
import { 
  X, Calendar, Wallet, Tag, FileText, 
  Trash2, ArrowUpRight, ArrowDownLeft, Clock, ShieldCheck
} from "lucide-react";

const TransactionDetailModal = ({ 
  transaction, onClose, onDelete, formatRupiah, wallets 
}) => {
  if (!transaction) return null;

  const isIncome = transaction.type === "income";
  const walletName = wallets.find(w => w.id === transaction.walletId)?.name || "Unknown Wallet";
  
  // Formatter Waktu & Tanggal
  const dateObj = transaction.createdAt?.seconds 
    ? new Date(transaction.createdAt.seconds * 1000) 
    : new Date(transaction.createdAt);
    
  const fullDate = dateObj.toLocaleDateString('id-ID', { 
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' 
  });
  const fullTime = dateObj.toLocaleTimeString('id-ID', { 
    hour: '2-digit', minute: '2-digit' 
  });

  return (
    <div className="fixed inset-0 z-[9999999] flex items-end sm:items-center justify-center p-4">
      {/* BACKDROP */}
      <div 
        className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300" 
        onClick={onClose} 
      />

      {/* MODAL CONTENT (BOTTOM SHEET STYLE ON MOBILE) */}
      <div className="relative w-full max-w-sm bg-[#0F172A] border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 duration-500">
        
        {/* TOP DECOR */}
        <div className={`h-2 w-full ${isIncome ? 'bg-emerald-500' : 'bg-rose-500'}`} />

        <div className="p-8 space-y-8">
          
          {/* HEADER & CLOSE */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${isIncome ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                    {isIncome ? <ArrowDownLeft size={16}/> : <ArrowUpRight size={16}/>}
                </div>
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Transaction Detail</h2>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 bg-white/5 rounded-full text-slate-500 hover:text-white transition-all"
            >
              <X size={18} />
            </button>
          </div>

          {/* MAIN AMOUNT (THE HERO) */}
          <div className="text-center py-4">
            <p className={`text-4xl font-black italic tracking-tighter ${isIncome ? 'text-emerald-500' : 'text-white'}`}>
                {isIncome ? '+' : '-'} Rp {formatRupiah(transaction.amount)}
            </p>
            <div className="mt-2 flex items-center justify-center gap-2 text-slate-500">
                <Clock size={12}/>
                <span className="text-[9px] font-black uppercase tracking-widest">{fullTime} WIB</span>
            </div>
          </div>

          {/* INFO GRID (THE RECEIPT) */}
          <div className="space-y-4 bg-white/5 p-6 rounded-[2rem] border border-white/5 shadow-inner">
            
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3 text-slate-400">
                    <Tag size={14}/>
                    <span className="text-[9px] font-black uppercase tracking-widest italic">Category</span>
                </div>
                <span className="text-[11px] font-black text-white uppercase tracking-tight">{transaction.category}</span>
            </div>

            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3 text-slate-400">
                    <Wallet size={14}/>
                    <span className="text-[9px] font-black uppercase tracking-widest italic">Payment Method</span>
                </div>
                <span className="text-[11px] font-black text-blue-500 uppercase tracking-tight">{walletName}</span>
            </div>

            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3 text-slate-400">
                    <Calendar size={14}/>
                    <span className="text-[9px] font-black uppercase tracking-widest italic">Date</span>
                </div>
                <span className="text-[10px] font-black text-white uppercase tracking-tight">{fullDate}</span>
            </div>

            {/* NOTE SECTION */}
            <div className="pt-4 border-t border-white/5 mt-4">
                <div className="flex items-center gap-3 text-slate-400 mb-2">
                    <FileText size={14}/>
                    <span className="text-[9px] font-black uppercase tracking-widest italic">Note / Record</span>
                </div>
                <p className="text-[11px] text-slate-300 font-medium italic leading-relaxed bg-black/20 p-4 rounded-2xl border border-white/5">
                    {transaction.note ? transaction.note.replace("AI Voice:", "🎙️ AI:").replace("Voice:", "🎙️:") : "No additional notes provided for this transaction."}
                </p>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => onDelete(transaction.id)}
              className="w-full py-5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] transition-all flex items-center justify-center gap-3"
            >
              <Trash2 size={16} /> Delete Transaction
            </button>
            <button 
              onClick={onClose}
              className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] shadow-xl shadow-blue-600/30 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <ShieldCheck size={16} /> Mark as Verified
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TransactionDetailModal;