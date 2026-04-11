import React from "react";
import { 
  PieChart as PieChartIcon, Eye, EyeOff, Camera, Scissors, 
  Download, BarChart3 // FileText & MessageCircle dihapus, Download ditambahkan
} from "lucide-react"; 
import HistorySection from "../components/HistorySection";

const HomePage = ({ 
  stats, t, formatRupiah, showBalance, setShowBalance, 
  setShowScanner, setShowSplitModal, setShowInsight, 
  categories, allTransactions, historyFilter, setHistoryFilter,
  shareWhatsApp, setShowNotif, // exportPDF dihapus dari props
  selectedDate, setSelectedDate, 
  handleDeleteTransaction 
}) => {

  const getBalanceFontSize = (len) => {
    if (len > 18) return "text-xl";
    if (len > 14) return "text-2xl";
    return "text-3xl";
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-32 px-1">
      
      {/* 1. CARD SALDO */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-700 dark:to-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-blue-200 dark:shadow-none relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="relative z-10 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mb-2">Available Balance</p>
          <div className="flex flex-col items-center gap-3">
            <h2 className={`${getBalanceFontSize(formatRupiah(stats.balance).length)} font-black tracking-tighter italic`}>
              {showBalance ? `Rp ${formatRupiah(stats.balance)}` : "Rp ••••••"}
            </h2>
            <button onClick={() => setShowBalance(!showBalance)} className="bg-white/20 px-5 py-1.5 rounded-full active:scale-90 transition-all flex items-center gap-2 border border-white/10 backdrop-blur-md">
              <span className="text-[8px] font-black uppercase tracking-widest">{showBalance ? 'Hide' : 'Show'}</span>
              {showBalance ? <EyeOff size={12}/> : <Eye size={12}/>}
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-6 mt-6 border-t border-white/20">
            <div className="text-left">
              <p className="text-[8px] font-black uppercase text-white/60">Income</p>
              <p className="text-[13px] font-black italic uppercase text-emerald-300">Rp {formatRupiah(stats.income)}</p>
            </div>
            <div className="text-right">
              <p className="text-[8px] font-black uppercase text-white/60">Expense</p>
              <p className="text-[13px] font-black italic uppercase text-rose-300">Rp {formatRupiah(stats.expense)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. QUICK MENU - Sekarang 4 Kolom & Icon WA diganti Download (Export) */}
      <div className="grid grid-cols-4 gap-2 p-3 bg-white dark:bg-slate-800 rounded-[2.2rem] shadow-xl shadow-slate-200/40 dark:shadow-none border border-white dark:border-slate-700">
        {[
          { icon: <Camera size={18}/>, label: "Scan", color: "text-indigo-600", bg: "bg-indigo-50", action: () => setShowScanner(true) },
          { icon: <Scissors size={18}/>, label: "Split", color: "text-rose-600", bg: "bg-rose-50", action: () => setShowSplitModal(true) },
          { icon: <PieChartIcon size={18}/>, label: "Insight", color: "text-teal-600", bg: "bg-teal-50", action: () => setShowInsight(true) },
          { icon: <Download size={18}/>, label: "Export", color: "text-blue-600", bg: "bg-blue-50", action: shareWhatsApp },
        ].map((item, i) => (
          <button key={i} onClick={item.action} className="flex flex-col items-center gap-1.5 group">
            <div className={`p-4 ${item.bg} dark:bg-opacity-10 ${item.color} rounded-2xl group-active:scale-90 transition-all shadow-sm`}>
              {item.icon}
            </div>
            <span className="text-[7px] font-black uppercase text-slate-400 dark:text-slate-500">{item.label}</span>
          </button>
        ))}
      </div>

      {/* 3. BUDGET TRACKING */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-[10px] font-black italic uppercase tracking-widest text-slate-400 dark:text-slate-500">Budget Tracking</h3>
        </div>

        <div className="bg-white dark:bg-slate-800 p-7 rounded-[3rem] border border-white dark:border-slate-700 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] dark:shadow-none space-y-7">
          {categories.length > 0 ? categories.slice(0, 4).map(c => {
            const spent = allTransactions
              .filter(tr => tr.category === c.name && String(tr.type).toLowerCase() === 'expense')
              .reduce((a, b) => a + Number(b.amount), 0);
            
            const perc = Math.min(100, (spent / c.limit) * 100);
            const isOver = spent > c.limit;

            return (
              <div key={c.id} className="space-y-3">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <span className="text-[11px] font-black uppercase text-slate-800 dark:text-white tracking-tight block">{c.name}</span>
                    <span className="text-[9px] font-black uppercase text-slate-400 italic">{perc.toFixed(0)}% Used</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-[11px] font-black italic ${isOver ? 'text-rose-500' : 'text-emerald-500'}`}>Rp {formatRupiah(spent)}</span>
                    <span className="text-[9px] font-black text-slate-300 block italic">of Rp {formatRupiah(c.limit)}</span>
                  </div>
                </div>
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden p-[2px] border border-slate-50 dark:border-slate-700">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${isOver ? 'bg-gradient-to-r from-rose-500 to-rose-400' : 'bg-gradient-to-r from-emerald-500 to-emerald-400'}`} 
                    style={{ width: `${perc}%` }}
                  ></div>
                </div>
              </div>
            );
          }) : (
            <div className="py-6 text-center opacity-20 italic">
              <p className="text-[10px] font-black uppercase tracking-widest">No budget targets set</p>
            </div>
          )}
        </div>
      </div>

      {/* 4. HISTORY */}
      <div className="space-y-4 pb-4">
        <h3 className="text-[10px] font-black italic uppercase tracking-widest text-slate-400 px-2">{t.history}</h3>
        <div className="bg-white dark:bg-slate-800/40 rounded-[2.5rem] p-1 border border-white dark:border-slate-700/50 shadow-lg shadow-slate-100 dark:shadow-none">
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