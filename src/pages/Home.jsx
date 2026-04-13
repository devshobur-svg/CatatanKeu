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

  // LOGIC: Responsive Font Scaling (Lebih Agresif buat HP kecil)
  const getBalanceFontSize = (len) => {
    if (!showBalance) return "text-2xl";
    if (len > 25) return "text-lg"; // Triliunan keatas
    if (len > 20) return "text-xl";
    if (len > 15) return "text-2xl";
    return "text-3xl";
  };

  const sensor = (val) => showBalance ? val : "••••••";

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-32 px-1">
      
      {/* 1. THE HERO CARD (Optimized Padding for Small Screens) */}
      <div className="relative bg-[#0F172A] dark:bg-slate-900 rounded-[2.5rem] p-6 text-white shadow-2xl shadow-blue-900/20 overflow-hidden border border-white/5">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/20 rounded-full blur-[80px]"></div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-6">
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-400 italic opacity-80">Total Wealth</span>
              <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest mt-0.5">READY TO FLEX?</p>
            </div>
            <button 
              onClick={() => setShowBalance(!showBalance)} 
              className="bg-white/5 hover:bg-white/10 p-3 rounded-2xl active:scale-90 transition-all border border-white/10 backdrop-blur-xl"
            >
              {showBalance ? <EyeOff size={14} className="text-blue-400"/> : <Eye size={14} className="text-blue-400"/>}
            </button>
          </div>

          {/* MAIN BALANCE: Ukuran font lebih proporsional */}
          <div className="text-center mb-8 overflow-hidden">
            <h2 className={`${getBalanceFontSize(formatRupiah(stats.balance).length)} font-black tracking-tighter italic leading-tight transition-all duration-300`}>
              {showBalance ? `Rp ${formatRupiah(stats.balance)}` : "Rp ••••••"}
            </h2>
          </div>
          
          {/* INCOME & EXPENSE: Lebih ramping & kompak */}
          <div className="space-y-2.5">
            <div className="bg-white/5 backdrop-blur-md rounded-[1.5rem] p-4 border border-white/5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 shrink-0">
                <div className="p-1.5 bg-emerald-500/20 rounded-xl text-emerald-400"><ArrowDownLeft size={14}/></div>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 italic">In</span>
              </div>
              <div className="text-right flex-1 min-w-0">
                <p className="text-sm font-black italic text-emerald-400 truncate tracking-wide">
                  <span className="text-[9px] mr-1 opacity-60">Rp</span> 
                  {sensor(formatRupiah(stats.income))}
                </p>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-[1.5rem] p-4 border border-white/5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 shrink-0">
                <div className="p-1.5 bg-rose-500/20 rounded-xl text-rose-400"><ArrowUpRight size={14}/></div>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 italic">Out</span>
              </div>
              <div className="text-right flex-1 min-w-0">
                <p className="text-sm font-black italic text-rose-400 truncate tracking-wide">
                  <span className="text-[9px] mr-1 opacity-60">Rp</span> 
                  {sensor(formatRupiah(stats.expense))}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. BENTO QUICK MENU (Slightly Smaller) */}
      <div className="grid grid-cols-4 gap-3 px-2">
        {[
          { icon: <Camera size={18}/>, label: "Scan", color: "text-indigo-500", action: () => setShowScanner(true) },
          { icon: <Scissors size={18}/>, label: "Split", color: "text-rose-500", action: () => setShowSplitModal(true) },
          { icon: <PieChartIcon size={18}/>, label: "Insight", color: "text-teal-500", action: () => setShowInsight(true) },
          { icon: <Download size={18}/>, label: "Export", color: "text-blue-500", action: shareWhatsApp },
        ].map((item, i) => (
          <button key={i} onClick={item.action} className="flex flex-col items-center gap-2 group">
            <div className="w-full aspect-square bg-white dark:bg-slate-800 rounded-[1.8rem] shadow-lg flex items-center justify-center group-active:scale-90 transition-all border border-transparent dark:border-white/5 relative overflow-hidden">
                <div className={item.color}>{item.icon}</div>
            </div>
            <span className="text-[7px] font-black uppercase text-slate-500 tracking-widest">{item.label}</span>
          </button>
        ))}
      </div>

      {/* 3. BUDGET PULSE (Reduced Height) */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-4">
          <h3 className="text-[9px] font-black italic uppercase tracking-[0.2em] text-slate-500">Budget Pulse</h3>
        </div>

        <div className="bg-white dark:bg-slate-800/50 p-6 rounded-[2.5rem] border border-white dark:border-white/5 shadow-xl space-y-6">
          {categories.length > 0 ? categories.slice(0, 4).map(c => {
            const spent = allTransactions
              .filter(tr => tr.category === c.name && String(tr.type).toLowerCase() === 'expense')
              .reduce((a, b) => a + Number(b.amount), 0);
            
            const perc = Math.min(100, (spent / c.limit) * 100);
            const isOver = spent > c.limit;

            return (
              <div key={c.id} className="group">
                <div className="flex justify-between items-end mb-2 px-1">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-slate-800 dark:text-white tracking-tight leading-none">{c.name}</span>
                    <span className={`text-[7px] font-black uppercase italic mt-1 ${isOver ? 'text-rose-500' : 'text-slate-500'}`}>
                        {perc.toFixed(0)}% Used
                    </span>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className={`text-[10px] font-black italic ${isOver ? 'text-rose-500' : 'text-blue-500'}`}>
                      Rp {sensor(formatRupiah(spent))}
                    </span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden border border-slate-50 dark:border-white/5">
                  <div 
                    className={`h-full rounded-full shadow-lg ${isOver ? 'bg-rose-500' : 'bg-blue-600'}`} 
                    style={{ width: `${perc}%` }}
                  ></div>
                </div>
              </div>
            );
          }) : null}
        </div>
      </div>

      {/* 4. HISTORY SECTION (Minimalist Wrapper) */}
      <div className="px-1">
        <div className="bg-white dark:bg-slate-800/40 rounded-[2.5rem] p-1 border border-white dark:border-white/5 shadow-xl">
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