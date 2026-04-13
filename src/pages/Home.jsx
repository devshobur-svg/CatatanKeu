import React from "react";
import { 
  PieChart as PieChartIcon, Eye, EyeOff, Camera, Scissors, 
  Download, BarChart3, Calendar as CalendarIcon, ArrowUpRight, ArrowDownLeft
} from "lucide-react"; 
import HistorySection from "../components/HistorySection";

const HomePage = ({ 
  stats, t, formatRupiah, showBalance, setShowBalance, 
  setShowScanner, setShowSplitModal, setShowInsight, 
  categories, allTransactions, historyFilter, setHistoryFilter,
  shareWhatsApp, setShowNotif,
  selectedDate, setSelectedDate, 
  handleDeleteTransaction 
}) => {

  const getBalanceFontSize = (len) => {
    if (len > 25) return "text-xl";
    if (len > 20) return "text-2xl";
    if (len > 15) return "text-3xl";
    return "text-4xl";
  };

  // Helper untuk sensor teks
  const sensor = (val) => showBalance ? val : "••••••";

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-32 px-1">
      
      {/* 1. THE HERO CARD */}
      <div className="relative bg-[#0F172A] dark:bg-slate-900 rounded-[3.5rem] p-8 text-white shadow-2xl shadow-blue-900/20 overflow-hidden border border-white/5">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/20 rounded-full blur-[80px]"></div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-8">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 italic">Total Wealth</span>
              <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-1">Ready to Flex?</p>
            </div>
            <button 
              onClick={() => setShowBalance(!showBalance)} 
              className="bg-white/5 hover:bg-white/10 p-4 rounded-3xl active:scale-90 transition-all border border-white/10 backdrop-blur-xl shadow-inner"
            >
              {showBalance ? <EyeOff size={16} className="text-blue-400"/> : <Eye size={16} className="text-blue-400"/>}
            </button>
          </div>

          <div className="text-center mb-10 overflow-hidden">
            <h2 className={`${getBalanceFontSize(showBalance ? formatRupiah(stats.balance).length : 10)} font-black tracking-tighter italic leading-none`}>
              {showBalance ? `Rp ${formatRupiah(stats.balance)}` : "Rp ••••••"}
            </h2>
          </div>
          
          {/* INCOME & EXPENSE - SENSOR ENABLED */}
          <div className="space-y-3">
            <div className="bg-white/5 backdrop-blur-md rounded-3xl p-5 border border-white/5 shadow-inner flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 shrink-0">
                <div className="p-2.5 bg-emerald-500/20 rounded-2xl text-emerald-400"><ArrowDownLeft size={16}/></div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 italic">Income</span>
              </div>
              <div className="text-right flex-1 min-w-0">
                <p className="text-lg font-black italic text-emerald-400 truncate tracking-widest">
                  <span className="text-[10px] mr-1 opacity-70">Rp</span> 
                  {sensor(formatRupiah(stats.income))}
                </p>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-3xl p-5 border border-white/5 shadow-inner flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 shrink-0">
                <div className="p-2.5 bg-rose-500/20 rounded-2xl text-rose-400"><ArrowUpRight size={16}/></div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 italic">Expense</span>
              </div>
              <div className="text-right flex-1 min-w-0">
                <p className="text-lg font-black italic text-rose-400 truncate tracking-widest">
                  <span className="text-[10px] mr-1 opacity-70">Rp</span> 
                  {sensor(formatRupiah(stats.expense))}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. BENTO QUICK MENU */}
      <div className="grid grid-cols-4 gap-4 px-2">
        {[
          { icon: <Camera size={20}/>, label: "Scan", color: "text-indigo-500", action: () => setShowScanner(true) },
          { icon: <Scissors size={20}/>, label: "Split", color: "text-rose-500", action: () => setShowSplitModal(true) },
          { icon: <PieChartIcon size={20}/>, label: "Insight", color: "text-teal-500", action: () => setShowInsight(true) },
          { icon: <Download size={20}/>, label: "Export", color: "text-blue-500", action: shareWhatsApp },
        ].map((item, i) => (
          <button key={i} onClick={item.action} className="flex flex-col items-center gap-3 group">
            <div className="w-full aspect-square bg-white dark:bg-slate-800 rounded-[2rem] shadow-xl flex items-center justify-center group-active:scale-75 transition-all border border-transparent dark:border-white/5 overflow-hidden relative">
                <div className={`absolute inset-0 opacity-0 group-active:opacity-10 transition-opacity bg-current ${item.color}`}></div>
                <div className={item.color}>{item.icon}</div>
            </div>
            <span className="text-[8px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">{item.label}</span>
          </button>
        ))}
      </div>

      {/* 3. BUDGET PULSE - SENSOR ENABLED */}
      <div className="space-y-6">
        <div className="flex justify-between items-center px-4">
          <h3 className="text-[10px] font-black italic uppercase tracking-widest text-slate-400">Budget Pulse</h3>
        </div>

        <div className="bg-white dark:bg-slate-800/50 p-8 rounded-[3.5rem] border border-white dark:border-white/5 shadow-2xl space-y-8">
          {categories.length > 0 ? categories.slice(0, 4).map(c => {
            const spent = allTransactions
              .filter(tr => tr.category === c.name && String(tr.type).toLowerCase() === 'expense')
              .reduce((a, b) => a + Number(b.amount), 0);
            
            const perc = Math.min(100, (spent / c.limit) * 100);
            const isOver = spent > c.limit;

            return (
              <div key={c.id} className="group">
                <div className="flex justify-between items-end mb-3 px-1">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black uppercase text-slate-800 dark:text-white tracking-tight">{c.name}</span>
                    <span className={`text-[8px] font-black uppercase italic mt-0.5 ${isOver ? 'text-rose-500' : 'text-slate-400'}`}>
                        {perc.toFixed(0)}% Consumed
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-black italic ${isOver ? 'text-rose-500' : 'text-blue-500'} tracking-widest`}>
                      Rp {sensor(formatRupiah(spent))}
                    </span>
                    <span className="text-[8px] font-black text-slate-300 block italic uppercase">
                      / Rp {sensor(formatRupiah(c.limit))}
                    </span>
                  </div>
                </div>
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden p-[2px] border border-slate-50 dark:border-white/5">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out shadow-lg ${isOver ? 'bg-gradient-to-r from-rose-600 to-rose-400' : 'bg-gradient-to-r from-blue-600 to-blue-400'}`} 
                    style={{ width: `${perc}%` }}
                  ></div>
                </div>
              </div>
            );
          }) : null}
        </div>
      </div>

      {/* 4. HISTORY SECTION */}
      <div className="space-y-6 pb-6 px-1">
        <div className="bg-white dark:bg-slate-800/40 rounded-[3rem] p-2 border border-white dark:border-white/5 shadow-2xl">
          <HistorySection 
            allTransactions={allTransactions} 
            historyFilter={historyFilter} 
            setHistoryFilter={setHistoryFilter} 
            showBalance={showBalance} 
            formatRupiah={formatRupiah} 
            t={t}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            handleDeleteTransaction={handleDeleteTransaction}
          />
        </div>
      </div>
    </div>
  );
};

export default HomePage;