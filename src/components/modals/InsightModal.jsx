import React from "react";
import { X, Sparkles, PieChart } from "lucide-react";

const InsightModal = ({ show, setShow, darkMode, categories, allTransactions, stats, formatRupiah }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[999] bg-black/40 backdrop-blur-sm flex items-end animate-in fade-in">
      <div className={`w-full h-[85vh] rounded-t-[3.5rem] p-8 animate-in slide-in-from-bottom duration-500 shadow-2xl overflow-y-auto no-scrollbar ${darkMode ? 'bg-slate-900 text-white' : 'bg-[#F8F9FE] text-slate-900'}`}>
        <div className="flex justify-between items-center mb-8 px-2">
          <h2 className="text-xl font-black italic uppercase tracking-tighter">Finance Analytics</h2>
          <button onClick={() => setShow(false)} className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm"><X/></button>
        </div>
        
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm">
            <p className="text-[10px] font-black uppercase opacity-40 mb-4 tracking-[0.2em]">Spending by Category</p>
            <div className="space-y-5">
              {categories.map(cat => {
                const totalExp = allTransactions.filter(tr => tr.category === cat.name && tr.type === 'expense').reduce((a, b) => a + Number(b.amount), 0);
                const percentage = stats.expense > 0 ? (totalExp / stats.expense) * 100 : 0;
                if (totalExp === 0) return null;
                return (
                  <div key={cat.id}>
                    <div className="flex justify-between text-[10px] font-black uppercase mb-1">
                      <span>{cat.name}</span>
                      <span className="text-blue-600 font-black">{percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-50 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-blue-600 rounded-[2.5rem] p-6 text-white shadow-xl">
            <div className="flex gap-4 items-center mb-4">
              <div className="p-3 bg-white/20 rounded-2xl"><Sparkles size={20}/></div>
              <h3 className="text-xs font-black uppercase italic">Financial Health</h3>
            </div>
            <p className="text-[11px] font-bold leading-relaxed opacity-90">
              {stats.expense > stats.income 
                ? "Pengeluaran lo lebih besar dari pemasukan bulan ini bro! Hati-hati jebol." 
                : "Gokil! Arus kas lo positif. Pertahankan terus manajemen keuangannya."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsightModal;