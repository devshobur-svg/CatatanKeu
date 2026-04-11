import React from "react";
import { Plus, CreditCard, Banknote, Edit2, Trash2, Wallet as WalletIcon } from "lucide-react";

const WalletPage = ({ 
  wallets, allTransactions, formatRupiah, setShowAddWallet, 
  handleDeleteWallet, handleEditWallet 
}) => {
  return (
    // FIX: Nambahin pt-12 supaya sejajar dengan layout Category
    <div className="space-y-8 animate-in fade-in duration-500 px-1 pt-12">
      
      {/* HEADER - Sharp & Clean */}
      <div className="flex justify-between items-end px-4">
        <div>
          <h2 className="text-[10px] font-black italic uppercase tracking-[0.3em] text-blue-500">Accounts</h2>
          <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">My Wallets</h1>
        </div>
        <button 
          onClick={() => setShowAddWallet(true)}
          className="p-4 bg-blue-600 text-white rounded-[1.8rem] shadow-lg shadow-blue-600/20 active:scale-90 transition-all"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* WALLET LIST - Vertical List DNA */}
      <div className="bg-white dark:bg-slate-800/50 rounded-[2.5rem] border border-slate-100 dark:border-white/5 overflow-hidden shadow-sm">
        {wallets.length > 0 ? (
          <div className="divide-y divide-slate-50 dark:divide-white/5">
            {wallets.map((w) => {
              // Real-time Balance Calculation
              const walletIncome = allTransactions
                .filter(tr => tr.walletId === w.id && tr.type === 'income')
                .reduce((a, b) => a + Number(b.amount), 0);
              const walletExpense = allTransactions
                .filter(tr => tr.walletId === w.id && tr.type === 'expense')
                .reduce((a, b) => a + Number(b.amount), 0);
              const currentBalance = (Number(w.balance) || 0) + walletIncome - walletExpense;

              return (
                <div key={w.id} className="p-5 flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-4">
                    {/* ICON BOX */}
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${w.type === 'bank' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                      {w.type === 'bank' ? <CreditCard size={20}/> : <Banknote size={20}/>}
                    </div>
                    
                    {/* NAME & TYPE */}
                    <div>
                      <h3 className="text-[11px] font-black uppercase tracking-tight text-slate-900 dark:text-white">{w.name}</h3>
                      <p className="text-[9px] font-bold text-slate-400 uppercase italic tracking-widest">{w.type}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* BALANCE INFO */}
                    <div className="text-right">
                      <p className="text-[12px] font-black italic text-slate-900 dark:text-white tracking-tighter">
                        Rp {formatRupiah(currentBalance)}
                      </p>
                      <p className="text-[8px] font-black text-slate-400 uppercase opacity-50">Balance</p>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex gap-1">
                      <button 
                        onClick={() => handleEditWallet(w)}
                        className="p-2 text-slate-300 dark:text-slate-600 hover:text-blue-500 transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeleteWallet(w.id)}
                        className="p-2 text-slate-300 dark:text-slate-600 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-20 text-center opacity-20 italic uppercase text-[10px] font-black tracking-[0.3em]">
            No Wallet accounts
          </div>
        )}
      </div>

      {/* QUICK INSIGHT */}
      <div className="px-4 pb-10">
        <div className="bg-blue-600/5 border border-blue-500/10 p-6 rounded-[2rem] flex items-center justify-between">
            <div className="flex items-center gap-3">
                <WalletIcon className="text-blue-500" size={18}/>
                <span className="text-[10px] font-black uppercase text-slate-500">Linked Accounts</span>
            </div>
            <span className="text-sm font-black italic text-blue-500">{wallets.length} Active</span>
        </div>
      </div>

    </div>
  );
};

export default WalletPage;