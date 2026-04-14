import React, { useState } from "react";
import { ArrowUpRight, ArrowDownLeft, Clock, Trash2, ChevronDown, FileText, ChevronRight } from "lucide-react";

const HistorySection = ({ 
  allTransactions, historyFilter, setHistoryFilter, 
  showBalance, formatRupiah, t, 
  selectedDate, setSelectedDate,
  handleDeleteTransaction,
  setSelectedTransaction // PROPS BARU UNTUK TRIGGER MODAL
}) => {
  const [showAll, setShowAll] = useState(false);

  // 1. FILTER LOGIC
  const filteredTransactions = allTransactions.filter(tr => {
    const dateObj = tr.createdAt?.seconds ? new Date(tr.createdAt.seconds * 1000) : new Date(tr.createdAt);
    const trDate = dateObj.toISOString().split('T')[0];
    const matchType = historyFilter === "all" || tr.type === historyFilter;
    const matchDate = !selectedDate || trDate === selectedDate;
    return matchType && matchDate;
  });

  // 2. DISPLAY LIMIT
  const displayTransactions = showAll ? filteredTransactions : filteredTransactions.slice(0, 3);

  // 3. DATE & TIME FORMATTER
  const formatFullDate = (timestamp) => {
    if (!timestamp) return { date: "-", time: "-" };
    const dateObj = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return {
      date: dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
      time: dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <div className="space-y-4">
      {/* --- SEGMENTED CONTROL FILTER --- */}
      <div className="px-4 pt-4">
        <div className="relative bg-slate-100 dark:bg-slate-900/60 p-1 rounded-2xl flex items-center border border-slate-200/50 dark:border-white/5 h-12">
          <div 
            className="absolute top-1 bottom-1 bg-white dark:bg-blue-600 rounded-xl shadow-sm transition-all duration-300 ease-out z-0"
            style={{
              width: 'calc(33.33% - 4px)',
              left: historyFilter === 'all' ? '4px' : historyFilter === 'income' ? '33.33%' : '66.66%'
            }}
          />
          
          {['all', 'income', 'expense'].map((f) => (
            <button
              key={f}
              onClick={() => { setHistoryFilter(f); setShowAll(false); }}
              className={`relative z-10 flex-1 h-full text-[9px] font-black uppercase tracking-widest transition-colors duration-300 ${
                historyFilter === f 
                ? 'text-blue-600 dark:text-white' 
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
              }`}
            >
              {f === 'all' ? 'Everything' : f}
            </button>
          ))}
        </div>
      </div>

      {/* --- TRANSACTION LIST (CLICKABLE) --- */}
      <div className="space-y-1">
        {displayTransactions.length > 0 ? (
          <>
            {displayTransactions.map((tr) => {
              const { date, time } = formatFullDate(tr.createdAt);
              const isIncome = tr.type === 'income';

              return (
                <div 
                  key={tr.id} 
                  onClick={() => setSelectedTransaction(tr)} // TRIGGER DETAIL MODAL
                  className="flex items-center justify-between p-4 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40 active:bg-slate-100 dark:active:bg-slate-800/60 transition-all rounded-[2rem] group border-b border-slate-50 dark:border-white/5 last:border-none cursor-pointer"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Icon Indicator */}
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${isIncome ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                      {isIncome ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                    </div>

                    {/* Info */}
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-[11px] font-black uppercase text-slate-900 dark:text-white truncate tracking-tight">
                        {tr.category}
                      </span>
                      
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex items-center gap-1 opacity-40 shrink-0">
                          <Clock size={10} />
                          <span className="text-[8px] font-bold uppercase">{time}</span>
                        </div>
                        {tr.note && (
                          <>
                            <span className="text-[8px] opacity-20">|</span>
                            <div className="flex items-center gap-1 flex-1 min-w-0 text-blue-500">
                              <FileText size={10} className="shrink-0" />
                              <span className="text-[9px] font-bold truncate italic tracking-tight uppercase opacity-80">
                                {tr.note.replace("Voice:", "").replace("AI Voice:", "").trim()}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Amount & Date */}
                  <div className="flex items-center gap-2 ml-4">
                    <div className="text-right">
                      <p className={`text-[13px] font-black italic tracking-tighter ${isIncome ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
                        {isIncome ? '+' : '-'} {showBalance ? `Rp ${formatRupiah(tr.amount)}` : 'Rp ••••••'}
                      </p>
                      <p className="text-[8px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-tighter">{date}</p>
                    </div>
                    <ChevronRight size={14} className="text-slate-300 dark:text-slate-700 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}

            {/* --- SEE ALL CONTROL --- */}
            <div className="px-4 pb-4">
              {!showAll && filteredTransactions.length > 3 ? (
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowAll(true); }}
                  className="w-full py-4 mt-2 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 bg-blue-500/5 dark:bg-blue-500/10 rounded-[1.5rem] active:scale-95 transition-all border border-blue-500/10"
                >
                  See All ({filteredTransactions.length})
                  <ChevronDown size={14} />
                </button>
              ) : showAll && filteredTransactions.length > 3 ? (
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowAll(false); }}
                  className="w-full py-4 mt-2 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 italic text-center"
                >
                  - Show Less -
                </button>
              ) : null}
            </div>
          </>
        ) : (
          <div className="py-20 text-center">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 opacity-20">
              <FileText size={20} className="text-slate-400" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 dark:text-slate-600 italic">No activity found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistorySection;