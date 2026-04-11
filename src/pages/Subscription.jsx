import React from "react";
import { Plus, Bell, Calendar, CreditCard, Trash2, Clock } from "lucide-react";

const SubscriptionPage = ({ subs, formatRupiah, setShowAddSub, handleDeleteSub }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 px-1 pt-12">
      
      {/* HEADER */}
      <div className="flex justify-between items-end px-4">
        <div>
          <h2 className="text-[10px] font-black italic uppercase tracking-[0.3em] text-blue-500">Recurring</h2>
          <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Subscriptions</h1>
        </div>
        <button 
          onClick={() => setShowAddSub(true)}
          className="p-4 bg-blue-600 text-white rounded-[1.8rem] shadow-lg shadow-blue-600/20 active:scale-90 transition-all"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* SUB LIST */}
      <div className="bg-white dark:bg-slate-800/50 rounded-[2.5rem] border border-slate-100 dark:border-white/5 overflow-hidden shadow-sm">
        {subs && subs.length > 0 ? (
          <div className="divide-y divide-slate-50 dark:divide-white/5">
            {subs.map((s) => {
              const today = new Date();
              const dueDate = new Date(today.getFullYear(), today.getMonth(), s.dueDay);
              if (dueDate < today) dueDate.setMonth(dueDate.getMonth() + 1);
              
              const diffTime = Math.abs(dueDate - today);
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

              return (
                <div key={s.id} className="p-5 flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
                      <CreditCard size={20}/>
                    </div>
                    <div>
                      <h3 className="text-[11px] font-black uppercase tracking-tight text-slate-900 dark:text-white">{s.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Clock size={10} className="text-slate-400"/>
                        <span className="text-[9px] font-bold text-slate-400 uppercase italic">Next: {diffDays} Days</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[12px] font-black italic text-slate-900 dark:text-white">Rp {formatRupiah(s.price)}</p>
                      <p className="text-[8px] font-black text-rose-500 uppercase opacity-70 italic">Due Date: {s.dueDay}</p>
                    </div>
                    <button onClick={() => handleDeleteSub(s.id)} className="p-2 text-slate-300 dark:text-slate-700 hover:text-rose-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-20 text-center opacity-20 italic uppercase text-[10px] font-black tracking-[0.3em]">
            No active subscriptions
          </div>
        )}
      </div>

      {/* MONTHLY BURDEN INSIGHT */}
      <div className="px-4 pb-10">
        <div className="bg-rose-500/5 border border-rose-500/10 p-6 rounded-[2rem] space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-500 italic">Total Monthly Burden</span>
                <span className="text-sm font-black italic text-rose-500">
                   Rp {formatRupiah(subs.reduce((a, b) => a + Number(b.price), 0))}
                </span>
            </div>
            <div className="w-full h-1.5 bg-rose-500/10 rounded-full overflow-hidden">
                <div className="w-2/3 h-full bg-rose-500"></div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;