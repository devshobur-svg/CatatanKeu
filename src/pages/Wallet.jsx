import React from "react";
import { Plus, Landmark, Smartphone, Coins, ChevronRight, QrCode, Send, ArrowDownLeft } from "lucide-react";

const WalletPage = ({ wallets, allTransactions, formatRupiah, setShowAddWallet, t }) => {
  
  const getWalletIcon = (type) => {
    switch (type) {
      case 'bank': return <Landmark size={20} className="text-emerald-600" />;
      case 'ewallet': return <Smartphone size={20} className="text-indigo-600" />;
      case 'cash': return <Coins size={20} className="text-amber-600" />;
      default: return <Landmark size={20} className="text-emerald-600" />;
    }
  };

  // Hitung Total Net Worth
  const totalNetWorth = wallets.reduce((acc, w) => {
    const trans = allTransactions || [];
    const inc = trans.filter(t => t.walletId === w.id && t.type === 'income').reduce((a, b) => a + (Number(b.amount) || 0), 0);
    const exp = trans.filter(t => t.walletId === w.id && t.type === 'expense').reduce((a, b) => a + (Number(b.amount) || 0), 0);
    return acc + (Number(w.balance) || 0) + inc - exp;
  }, 0);

  return (
    // pb-40 supaya konten paling bawah gak ketutup navigasi bar handphone
    <div className="space-y-10 animate-in fade-in duration-500 pb-40 px-1">
      
      {/* 1. Header Section - Clean & Minimalist */}
      <div className="flex justify-between items-center px-1 pt-4">
        <div>
          <h3 className="text-[10px] font-black italic uppercase tracking-[0.2em] text-slate-400 mb-1">Treasury</h3>
          <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">Assets Center</h2>
        </div>
        <button 
          onClick={() => setShowAddWallet(true)}
          className="bg-white dark:bg-slate-800 text-emerald-600 p-4 rounded-3xl shadow-xl shadow-slate-100 dark:shadow-none active:scale-90 transition-all border border-slate-50 dark:border-slate-700"
        >
          <Plus size={22} strokeWidth={3} />
        </button>
      </div>

      {/* 2. Main Account Card (Inspirasi dari Contoh Jago/BCA Syariah) */}
      <div className="bg-emerald-600 p-8 rounded-[3.5rem] text-white shadow-2xl shadow-emerald-100 dark:shadow-none relative overflow-hidden">
        {/* Decorative Elements (Glassmorphism rings) */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/5 rounded-full -ml-16 -mb-16 blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <p className="text-[10px] font-black uppercase text-white/60 tracking-[0.3em] mb-3 italic">Total Net Worth</p>
          {/* Font nominal dikecilkan sedikit agar fit ( text-3xl dulu text-4xl ) */}
          <h3 className="text-3xl font-black italic tracking-tighter mb-8">
            Rp {formatRupiah(totalNetWorth)}
          </h3>
          
          {/* Quick Actions (Sentuhan Jago) */}
          <div className="flex gap-4 w-full">
            {[
              { icon: <QrCode size={18}/>, label: "Scan QR" },
              { icon: <Send size={18}/>, label: "Transfer" },
              { icon: <ArrowDownLeft size={18}/>, label: "Top Up" }
            ].map((btn, i) => (
              <button key={i} className="flex-1 bg-white/10 backdrop-blur-md rounded-3xl p-4 flex flex-col items-center gap-2 border border-white/5 active:scale-95 transition-all">
                <div className="bg-white/10 p-2.5 rounded-xl">{btn.icon}</div>
                <span className="text-[8px] font-black uppercase tracking-tighter">{btn.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Wallets List - Clean & Spaced */}
      <div className="space-y-6">
        <h3 className="text-[10px] font-black italic uppercase tracking-widest text-slate-400 px-2">Connected Accounts</h3>
        <div className="space-y-5">
          {wallets.length > 0 ? wallets.map((w) => {
            const trans = allTransactions || [];
            const inc = trans.filter(t => t.walletId === w.id && t.type === 'income').reduce((a, b) => a + (Number(b.amount) || 0), 0);
            const exp = trans.filter(t => t.walletId === w.id && t.type === 'expense').reduce((a, b) => a + (Number(b.amount) || 0), 0);
            const currentBalance = (Number(w.balance) || 0) + inc - exp;

            return (
              <div 
                key={w.id} 
                className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-100/50 dark:shadow-none flex items-center justify-between group active:scale-[0.98] transition-all duration-300"
              >
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700/50 rounded-2xl flex items-center justify-center border border-slate-100/50">
                    {getWalletIcon(w.type)}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 italic">
                      {w.type || 'General Account'}
                    </p>
                    <h4 className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-tight">
                      {w.name}
                    </h4>
                    <p className="text-lg font-black italic tracking-tighter text-emerald-600 mt-1">
                      Rp {formatRupiah(currentBalance)}
                    </p>
                  </div>
                </div>
                <div className="text-slate-300 group-hover:text-emerald-600 transition-colors bg-slate-50 dark:bg-slate-700 p-2 rounded-xl">
                  <ChevronRight size={20} />
                </div>
              </div>
            );
          }) : (
            <div className="py-20 text-center space-y-3 opacity-20 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100">
              <Landmark className="mx-auto" size={48} />
              <p className="text-[10px] font-black uppercase tracking-widest italic">No wallets connected</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default WalletPage;