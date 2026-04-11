import React, { useState } from "react";
import { ArrowUpRight, ArrowDownLeft, Calendar, Clock, X, Filter, Trash2, ChevronDown } from "lucide-react";

const HistorySection = ({ 
  allTransactions, historyFilter, setHistoryFilter, 
  showBalance, formatRupiah, t, 
  selectedDate, setSelectedDate,
  handleDeleteTransaction 
}) => {
  const [showAll, setShowAll] = useState(false); // State untuk kontrol "See All"

  // 1. Filter Logic
  const filteredTransactions = allTransactions.filter(tr => {
    const dateObj = tr.createdAt?.seconds ? new Date(tr.createdAt.seconds * 1000) : new Date(tr.createdAt);
    const trDate = dateObj.toISOString().split('T')[0];
    const matchType = historyFilter === "all" || tr.type === historyFilter;
    const matchDate = !selectedDate || trDate === selectedDate;
    return matchType && matchDate;
  });

  // 2. Limit Logic: Jika showAll false, potong jadi 3 saja
  const displayTransactions = showAll ? filteredTransactions : filteredTransactions.slice(0, 3);

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
      {/* FILTER & DATE PICKER */}
      <div className="flex flex-col gap-4 px-2">
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
          {['all', 'income', 'expense'].map((f) => (
            <button
              key={f}
              onClick={() => { setHistoryFilter(f); setShowAll(false); }} // Reset ke limit 3 tiap ganti filter
              className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${
                historyFilter === f 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-100 dark:border-slate-700'
              }`}
            >
              {f === 'all' ? 'Everything' : f}
            </button>
          ))}
        </div>

        <div className="relative">
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => { setSelectedDate(e.target.value); setShowAll(false); }}
            className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3.5 pl-11 rounded-2xl text-[10px] font-black uppercase text-slate-600 dark:text-slate-300 outline-none"
          />
          <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none" />
          {selectedDate && (
            <button onClick={() => setSelectedDate("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* TRANSACTION LIST */}
      <div className="space-y-1">
        {displayTransactions.length > 0 ? (
          <>
            {displayTransactions.map((tr) => {
              const { date, time } = formatFullDate(tr.createdAt);
              const isIncome = tr.type === 'income';

              return (
                <div key={tr.id} className="flex items-center justify-between p-4 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all rounded-[2rem] group">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {isIncome ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] font-black uppercase text-slate-900 dark:text-white truncate">{tr.category}</span>
                      <div className="flex items-center gap-2 mt-0.5 opacity-40">
                        <Clock size={10} />
                        <span className="text-[9px] font-bold uppercase">{time} • {date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className={`text-[13px] font-black italic tracking-tighter ${isIncome ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}`}>
                        {isIncome ? '+' : '-'} {showBalance ? `Rp ${formatRupiah(tr.amount)}` : 'Rp ••••••'}
                      </p>
                    </div>
                    <button onClick={() => handleDeleteTransaction(tr.id)} className="p-2.5 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-xl">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* BUTTON SEE ALL / SHOW LESS */}
            {!showAll && filteredTransactions.length > 3 && (
              <button 
                onClick={() => setShowAll(true)}
                className="w-full py-4 mt-2 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 bg-blue-50/50 dark:bg-blue-900/10 rounded-[1.5rem] active:scale-95 transition-all"
              >
                See All History ({filteredTransactions.length})
                <ChevronDown size={14} />
              </button>
            )}

            {showAll && filteredTransactions.length > 3 && (
              <button 
                onClick={() => setShowAll(false)}
                className="w-full py-4 mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic"
              >
                Show Less
              </button>
            )}
          </>
        ) : (
          <div className="py-20 text-center opacity-20 italic font-black uppercase text-[10px]">No activity</div>
        )}
      </div>
    </div>
  );
};

export default HistorySection;