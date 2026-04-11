import React, { useMemo } from "react";
import { X, TrendingDown, TrendingUp, AlertCircle, Zap, ShieldAlert, CheckCircle2, Clock, Activity, PieChart as PieIcon } from "lucide-react";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ChartTooltip, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid 
} from "recharts";

const InsightModal = ({ show, setShow, categories, allTransactions, stats, formatRupiah }) => {
  if (!show) return null;

  const analysis = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysRemaining = daysInMonth - currentDay;

    // 1. Logic AI Advisor (STABLE)
    const catData = categories.map(cat => {
      const spent = allTransactions
        .filter(tr => tr.category === cat.name && tr.type === 'expense')
        .reduce((a, b) => a + Number(b.amount), 0);
      const perc = cat.limit > 0 ? (spent / cat.limit) * 100 : 0;
      return { ...cat, spent, perc };
    }).sort((a, b) => b.spent - a.spent);

    const dailyAvg = stats.expense / currentDay;
    const forecastEndMonth = dailyAvg * daysInMonth;
    const runwayDays = dailyAvg > 0 ? Math.floor(stats.balance / dailyAvg) : 99;

    let health = { 
        status: "Safe", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20",
        icon: <CheckCircle2 size={24}/>, desc: "Gaya hidup lo oke, saldo aman sampe akhir bulan." 
    };
    
    if (runwayDays < daysRemaining) {
      health = { 
        status: "Warning", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20",
        icon: <ShieldAlert size={24}/>, desc: "Waspada! Saldo lo bakal abis sebelum bulan selesai." 
      };
    }
    
    if (runwayDays < 3 || stats.balance <= 0) {
      health = { 
        status: "Danger", color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20",
        icon: <AlertCircle size={24}/>, desc: "Darurat! Saldo lo kritis, stop jajan sekarang juga." 
      };
    }

    // 2. Data untuk Charts (NEW IMPROVEMENT)
    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
    
    const pieData = catData.filter(d => d.spent > 0).map(d => ({
        name: d.name,
        value: d.spent
    }));

    const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
        const dayTotal = allTransactions
            .filter(tr => {
                const trDate = tr.createdAt?.seconds ? new Date(tr.createdAt.seconds * 1000) : new Date(tr.createdAt);
                return trDate.toDateString() === d.toDateString() && tr.type === 'expense';
            })
            .reduce((sum, tr) => sum + Number(tr.amount || 0), 0);
        return { name: dateStr, amount: dayTotal };
    });

    return { catData, dailyAvg, forecastEndMonth, runwayDays, health, daysRemaining, pieData, last7Days, COLORS };
  }, [categories, allTransactions, stats]);

  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center sm:items-center p-0 sm:p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={() => setShow(false)}></div>
      
      <div className="relative w-full max-w-lg bg-[#0F172A] text-white rounded-t-[3.5rem] sm:rounded-[3.5rem] shadow-2xl overflow-hidden h-[92vh] flex flex-col animate-in slide-in-from-bottom-10 border border-white/5">
        
        {/* HEADER */}
        <div className="p-8 flex justify-between items-center border-b border-white/5 bg-slate-900/50">
          <button onClick={() => setShow(false)} className="p-3 bg-white/5 rounded-2xl active:scale-90 border border-white/5"><X size={20} /></button>
          <div className="text-center">
            <h2 className="text-[10px] font-black italic uppercase tracking-[0.4em] text-blue-500">AI Advisor</h2>
            <h1 className="text-sm font-black uppercase tracking-widest">Smart Insight</h1>
          </div>
          <div className="w-12"></div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8 pb-32">
          
          {/* 1. FINANCIAL RUNWAY CARD (STABLE) */}
          <div className={`${analysis.health.bg} ${analysis.health.border} p-8 rounded-[3rem] border flex flex-col items-center text-center space-y-4`}>
             <div className={`${analysis.health.color} p-4 bg-white/5 rounded-full`}>{analysis.health.icon}</div>
             <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Financial Runway</p>
                <h2 className={`text-5xl font-black italic tracking-tighter ${analysis.health.color}`}>{analysis.runwayDays} Days</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase italic px-4">{analysis.health.desc}</p>
             </div>
          </div>

          {/* 2. AREA CHART: SPENDING TREND (NEW) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-2">
                <Activity size={14} className="text-blue-500"/>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">7-Day Spending Trend</p>
            </div>
            <div className="h-48 w-full bg-white/5 rounded-[2.5rem] p-4 border border-white/5">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analysis.last7Days}>
                        <defs>
                            <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <ChartTooltip 
                            contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '16px', fontSize: '10px', fontWeight: 'bold' }}
                            itemStyle={{ color: '#3B82F6' }}
                            formatter={(value) => [`Rp ${formatRupiah(value)}`, 'Spent']}
                        />
                        <Area type="monotone" dataKey="amount" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorAmt)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
          </div>

          {/* 3. FORECAST STATS GRID (STABLE) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5 space-y-3">
                <div className="flex items-center gap-2 text-blue-400"><Zap size={14}/> <span className="text-[8px] font-black uppercase">End Month Forecast</span></div>
                <div>
                    <p className="text-sm font-black italic tracking-tight">Rp {formatRupiah(Math.round(analysis.forecastEndMonth))}</p>
                    <p className="text-[8px] font-bold text-slate-500 uppercase italic">Est. Total Spending</p>
                </div>
            </div>
            <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5 space-y-3">
                <div className="flex items-center gap-2 text-indigo-400"><Clock size={14}/> <span className="text-[8px] font-black uppercase">Daily Burn Rate</span></div>
                <div>
                    <p className="text-sm font-black italic tracking-tight">Rp {formatRupiah(Math.round(analysis.dailyAvg))}</p>
                    <p className="text-[8px] font-bold text-slate-500 uppercase italic">Spent Per Day</p>
                </div>
            </div>
          </div>

          {/* 4. PIE CHART: COMPOSITION (NEW) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-2">
                <PieIcon size={14} className="text-emerald-500"/>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Expense Composition</p>
            </div>
            <div className="bg-white/5 rounded-[2.5rem] p-6 border border-white/5 flex flex-col items-center">
                <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={analysis.pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                {analysis.pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={analysis.COLORS[index % analysis.COLORS.length]} stroke="none" />
                                ))}
                            </Pie>
                            <ChartTooltip 
                                contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '16px', fontSize: '10px' }}
                                formatter={(value) => [`Rp ${formatRupiah(value)}`]}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-4">
                    {analysis.pieData.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: analysis.COLORS[index % analysis.COLORS.length] }} />
                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter truncate w-24">{entry.name}</span>
                        </div>
                    ))}
                </div>
            </div>
          </div>

          {/* 5. CATEGORY LEADERBOARD (STABLE) */}
          <div className="space-y-4 px-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic tracking-[0.2em]">Spending Details</p>
            <div className="space-y-3">
                {analysis.catData.slice(0, 5).map(cat => (
                    <div key={cat.id} className="bg-white/5 p-5 rounded-[2rem] border border-white/5 flex items-center justify-between group">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black uppercase italic tracking-tight">{cat.name}</span>
                            <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className={`h-full transition-all duration-1000 ${cat.perc >= 100 ? 'bg-rose-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(100, cat.perc)}%` }} />
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[11px] font-black italic">Rp {formatRupiah(cat.spent)}</p>
                            <p className={`text-[8px] font-black uppercase italic ${cat.perc >= 100 ? 'text-rose-500' : 'text-slate-600'}`}>{cat.perc.toFixed(0)}% Used</p>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        </div>

        {/* FOOTER ACTION */}
        <div className="p-6 bg-slate-900/90 backdrop-blur-md border-t border-white/5">
            <button onClick={() => setShow(false)} className="w-full py-5 bg-blue-600 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] active:scale-95 transition-all shadow-xl shadow-blue-500/20">
                Analyze Complete
            </button>
        </div>
      </div>
    </div>
  );
};

export default InsightModal;