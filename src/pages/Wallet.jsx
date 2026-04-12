import React, { useState, useEffect } from "react";
import { Plus, CreditCard, Banknote, Edit2, Trash2, Wallet as WalletIcon, X } from "lucide-react";

const WalletPage = ({ 
  wallets, allTransactions, formatRupiah, setShowAddWallet, 
  handleDeleteWallet, handleEditWallet, showAddWallet, 
  onAddWallet, onUpdateWallet, editingWallet, setEditingWallet
}) => {
  
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [type, setType] = useState("cash");

  useEffect(() => {
    if (editingWallet) {
      setName(editingWallet.name);
      setBalance(editingWallet.balance);
      setType(editingWallet.type);
    } else {
      setName(""); setBalance(""); setType("cash");
    }
  }, [editingWallet, showAddWallet]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { name, balance: Number(balance), type, id: editingWallet?.id };
    editingWallet ? onUpdateWallet(payload) : onAddWallet(payload);
    closeModal();
  };

  const closeModal = () => {
    setShowAddWallet(false);
    setEditingWallet(null);
  };

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh' }}>
      <div className="space-y-8 px-1 pt-16">
        
        {/* HEADER */}
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

        {/* LIST WALLET */}
        <div className="bg-white dark:bg-slate-800/50 rounded-[2.5rem] border border-slate-100 dark:border-white/5 overflow-hidden shadow-sm">
          {wallets.length > 0 ? (
            <div className="divide-y divide-slate-50 dark:divide-white/5">
              {wallets.map((w) => {
                const walletIncome = allTransactions.filter(tr => tr.walletId === w.id && tr.type === 'income').reduce((a, b) => a + Number(b.amount), 0);
                const walletExpense = allTransactions.filter(tr => tr.walletId === w.id && tr.type === 'expense').reduce((a, b) => a + Number(b.amount), 0);
                const currentBalance = (Number(w.balance) || 0) + walletIncome - walletExpense;

                return (
                  <div key={w.id} className="p-5 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${w.type === 'bank' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                        {w.type === 'bank' ? <CreditCard size={20}/> : <Banknote size={20}/>}
                      </div>
                      <div>
                        <h3 className="text-[11px] font-black uppercase tracking-tight text-slate-900 dark:text-white">{w.name}</h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase italic tracking-widest">{w.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-[12px] font-black italic text-slate-900 dark:text-white tracking-tighter">Rp {formatRupiah(currentBalance)}</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => handleEditWallet(w)} className="p-2 text-slate-300 hover:text-blue-500"><Edit2 size={14} /></button>
                        <button onClick={() => handleDeleteWallet(w.id)} className="p-2 text-slate-300 hover:text-rose-500"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-20 text-center opacity-20 italic uppercase text-[10px] font-black tracking-[0.3em]">No Wallet accounts</div>
          )}
        </div>
      </div>

      {/* MODAL - DI TARUH DI LUAR FLOW CONTENT UTAMA */}
      {(showAddWallet || editingWallet) && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          {/* BACKDROP SOLID */}
          <div 
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#020617', opacity: 0.98 }} 
            onClick={closeModal} 
          />
          
          {/* BOX MODAL SOLID */}
          <div style={{ position: 'relative', backgroundColor: '#0B1221', width: '100%', maxWidth: '400px', borderRadius: '40px', padding: '40px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
            <button onClick={closeModal} style={{ position: 'absolute', top: '25px', right: '25px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={24} />
            </button>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ color: 'white', fontSize: '18px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '5px' }}>
                  {editingWallet ? 'Edit Wallet' : 'Add Wallet'}
                </h2>
                <div style={{ height: '2px', width: '40px', backgroundColor: '#3b82f6', margin: '0 auto' }}></div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: '#64748b', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Starting Balance</label>
                <input 
                  type="number" 
                  value={balance} 
                  onChange={(e) => setBalance(e.target.value)}
                  style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '15px', padding: '15px', color: 'white', fontSize: '20px', fontWeight: '900', outline: 'none' }}
                  placeholder="0"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: '#64748b', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Wallet Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '15px', padding: '15px', color: 'white', fontSize: '14px', fontWeight: '700', outline: 'none' }}
                  placeholder="E.G. BANK BCA"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <button 
                  type="button" 
                  onClick={() => setType('bank')}
                  style={{ padding: '20px', borderRadius: '20px', border: type === 'bank' ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.05)', backgroundColor: type === 'bank' ? 'rgba(59, 130, 246, 0.1)' : 'transparent', color: type === 'bank' ? '#3b82f6' : '#64748b', cursor: 'pointer', fontWeight: '900', fontSize: '10px', textTransform: 'uppercase' }}
                >
                  Bank
                </button>
                <button 
                  type="button" 
                  onClick={() => setType('cash')}
                  style={{ padding: '20px', borderRadius: '20px', border: type === 'cash' ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.05)', backgroundColor: type === 'cash' ? 'rgba(59, 130, 246, 0.1)' : 'transparent', color: type === 'cash' ? '#3b82f6' : '#64748b', cursor: 'pointer', fontWeight: '900', fontSize: '10px', textTransform: 'uppercase' }}
                >
                  Cash
                </button>
              </div>

              <button 
                type="submit" 
                style={{ backgroundColor: 'white', color: '#020617', padding: '18px', borderRadius: '15px', border: 'none', fontWeight: '900', fontSize: '12px', textTransform: 'uppercase', cursor: 'pointer', marginTop: '10px' }}
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletPage;