import React from "react";
import { X, CreditCard, Banknote, Tag, Wallet } from "lucide-react";

const AddWalletModal = ({ show, setShow, newWallet, setNewWallet, handleSave, formatRupiah }) => {
  if (!show) return null;

  const handlePriceInput = (value) => {
    const rawValue = value.replace(/\D/g, "");
    setNewWallet({ ...newWallet, balance: rawValue });
  };

  const formatDisplay = (val) => {
    if (!val) return "";
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center sm:items-center p-0 sm:p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={() => setShow(false)}></div>
      
      <div className="relative w-full max-w-lg bg-[#0F172A] text-white rounded-t-[3.5rem] sm:rounded-[3.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 border border-white/5">
        
        {/* HEADER */}
        <div className="p-8 flex justify-between items-center border-b border-white/5 bg-slate-900/50">
          <button onClick={() => setShow(false)} className="p-3 bg-white/5 rounded-2xl border border-white/5 active:scale-90 transition-all">
            <X size={20} />
          </button>
          <div className="text-center">
            <h2 className="text-[10px] font-black italic uppercase tracking-[0.4em] text-blue-500">Settings</h2>
            <h1 className="text-sm font-black uppercase tracking-widest">Configure Wallet</h1>
          </div>
          <div className="w-12"></div>
        </div>

        <div className="p-8 space-y-8">
          {/* BALANCE INPUT */}
          <div className="text-center space-y-2">
            <p className="text-[10px] font-black uppercase text-blue-500/50 tracking-[0.2em]">Initial Balance</p>
            <div className="flex justify-center items-center">
                <span className="text-xl font-black text-blue-400 mr-2 italic">Rp</span>
                <input 
                    type="text" inputMode="numeric" placeholder="0"
                    value={formatDisplay(newWallet.balance)}
                    onChange={(e) => handlePriceInput(e.target.value)}
                    className="bg-transparent text-4xl font-black italic tracking-tighter text-white outline-none w-full max-w-[200px] placeholder:text-white/5"
                />
            </div>
          </div>

          <div className="space-y-4">
            {/* Wallet Name */}
            <div className="bg-white/5 p-5 rounded-3xl border border-white/5 flex items-center gap-4 focus-within:border-blue-500/50 transition-all">
                <div className="w-10 h-10 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400">
                    <Tag size={18}/>
                </div>
                <input 
                    placeholder="Wallet Name (e.g. BCA, Cash)" 
                    value={newWallet.name}
                    onChange={(e) => setNewWallet({...newWallet, name: e.target.value})}
                    className="bg-transparent flex-1 text-xs font-black uppercase outline-none"
                />
            </div>

            {/* Wallet Type */}
            <div className="grid grid-cols-2 gap-4">
                {['bank', 'cash'].map((type) => (
                    <button
                        key={type}
                        onClick={() => setNewWallet({...newWallet, type})}
                        className={`p-6 rounded-[2rem] border transition-all flex flex-col items-center gap-3 ${
                            newWallet.type === type 
                            ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-600/20' 
                            : 'bg-white/5 border-white/5 text-slate-500'
                        }`}
                    >
                        {type === 'bank' ? <CreditCard size={24}/> : <Banknote size={24}/>}
                        <span className="text-[10px] font-black uppercase tracking-widest">{type}</span>
                    </button>
                ))}
            </div>
          </div>

          <button 
            onClick={handleSave}
            className="w-full py-5 bg-white text-slate-900 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] active:scale-95 transition-all shadow-xl"
          >
            Save Wallet
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddWalletModal;