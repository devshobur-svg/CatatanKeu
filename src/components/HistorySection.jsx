import React from "react";
import { ArrowUpRight, ArrowDownLeft, Calendar, Clock } from "lucide-react";

const HistorySection = ({ allTransactions, historyFilter, setHistoryFilter, showBalance, formatRupiah, t }) => {
  
  // Logic Filter
  const filteredTransactions = allTransactions.filter(tr => {
    if (historyFilter === "all") return true;
    return tr.type === historyFilter;
  });

  // Fungsi Format Tanggal & Jam
  const formatFullDate = (timestamp) => {
    if (!timestamp) return { date: "-", time: "-" };
    const dateObj = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    
    return {
      date: dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <div className="space-y-6">
      {/* 1. Filter Chips - Dibuat lebih minimalist */}
      <div className="flex gap-2 px-2 overflow-x-auto no-scrollbar py-2">
        {['all', 'income', 'expense'].map((f) => (
          <button
            key={f}
            onClick={() => setHistoryFilter(f)}
            className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${
              historyFilter === f 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none' 
              : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-100 dark:border-slate-700'
            }`}
          >
            {f === 'all' ? 'Everything' : f}
          </button>
        ))}
      </div>

      {/* 2. Transaction List - Clean Style */}
      <div className="space-y-1">
        {filteredTransactions.length > 0 ? filteredTransactions.map((tr) => {
          const { date, time } = formatFullDate(tr.createdAt);
          const isIncome = tr.type === 'income';

          return (
            <div 
              key={tr.id} 
              className="flex items-center justify-between p-4 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors rounded-3xl group"
            >
              {/* Left Side: Icon & Category */}
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-active:scale-90 ${
                  isIncome 
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' 
                  : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600'
                }`}>
                  {isIncome ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                </div>
                
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-black uppercase text-slate-900 dark:text-white truncate">
                    {tr.category}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex items-center gap-1 opacity-40">
                      <Calendar size={10} />
                      <span className="text-[9px] font-bold uppercase">{date}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-40">
                      <Clock size={10} />
                      <span className="text-[9px] font-bold uppercase">{time}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Amount */}
              <div className="text-right ml-4">
                <p className={`text-[13px] font-black italic tracking-tighter ${
                  isIncome ? 'text-emerald-600' : 'text-slate-900 dark:text-white'
                }`}>
                  {isIncome ? '+' : '-'} {showBalance ? `Rp ${formatRupiah(tr.amount)}` : 'Rp ••••••'}
                </p>
                {tr.note && (
                  <p className="text-[9px] font-bold text-slate-400 uppercase truncate max-w-[100px] mt-0.5 italic">
                    {tr.note}
                  </p>
                )}
              </div>
            </div>
          );
        }) : (
          <div className="py-20 text-center space-y-3 opacity-20">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto">
              <Calendar size={24} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest italic">No activities recorded</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistorySection;