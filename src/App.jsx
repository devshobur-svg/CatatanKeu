import React, { useState, useEffect, useMemo, useRef } from "react";
import { auth, db } from "./lib/firebase";
import { onAuthStateChanged, signOut, deleteUser } from "firebase/auth";
import { 
  collection, addDoc, onSnapshot, query, where, 
  orderBy, deleteDoc, doc, getDocs, Timestamp 
} from "firebase/firestore";
import { 
  PlusCircle, ArrowUpCircle, ArrowDownCircle, 
  LogOut, Trash2, Wallet as WalletIcon, X, Sparkles, Sun, Moon, 
  FileText, Home, LayoutGrid, User, Settings, Download, Send, Bot, ShieldCheck, Bell, HelpCircle, ChevronRight, Languages, Eye, EyeOff, Tag
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Login from "./pages/Login";

const TRANSLATIONS = {
  id: {
    income: "Pemasukan",
    expense: "Pengeluaran",
    activity: "Aktivitas Hari Ini",
    report: "Report",
    wallet: "Wallet",
    profile: "Profil",
    data: "Report",
    home: "Home",
    addWallet: "Tambah Wallet",
    addCategory: "Atur Kategori",
    save: "Simpan Transaksi",
    deleteAcc: "Hapus Akun Permanen",
    totalBalance: "Total Saldo",
    aiTitle: "Finansial AI Advisor"
  },
  en: {
    income: "Income",
    expense: "Expense",
    activity: "Today's Activity",
    report: "Report",
    wallet: "Wallet",
    profile: "Profile",
    data: "Report",
    home: "Home",
    addWallet: "Add Wallet",
    addCategory: "Set Category",
    save: "Save Transaction",
    deleteAcc: "Delete Account Permanently",
    totalBalance: "Total Balance",
    aiTitle: "Financial AI Advisor"
  }
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  const [lang, setLang] = useState("id");

  const [todayTransactions, setTodayTransactions] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]); 
  
  const [darkMode, setDarkMode] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  
  // --- AI STATES ---
  const [showAI, setShowAI] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  const [newWalletName, setNewWalletName] = useState("");
  const [newCatName, setNewCatName] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [form, setForm] = useState({ amount: "", category: "", type: "expense", walletId: "" });

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    onSnapshot(query(collection(db, "wallets"), where("userId", "==", user.uid)), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setWallets(data);
      if (data.length > 0 && !form.walletId) setForm(f => ({...f, walletId: data[0].id}));
    });

    onSnapshot(query(collection(db, "categories"), where("userId", "==", user.uid), orderBy("name", "asc")), (snap) => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    onSnapshot(query(
      collection(db, "transactions"), 
      where("userId", "==", user.uid), 
      where("createdAt", ">=", Timestamp.fromDate(startOfToday)),
      orderBy("createdAt", "desc")
    ), (snap) => {
      setTodayTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    onSnapshot(query(collection(db, "transactions"), where("userId", "==", user.uid), orderBy("createdAt", "desc")), (snap) => {
      setAllTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [user]);

  const stats = useMemo(() => {
    const inc = allTransactions.filter(tr => tr.type === 'income').reduce((a, b) => a + (b.amount || 0), 0);
    const exp = allTransactions.filter(tr => tr.type === 'expense').reduce((a, b) => a + (b.amount || 0), 0);
    return { income: inc, expense: exp, balance: inc - exp };
  }, [allTransactions]);

  // --- AI ADVISOR LOGIC ---
  const handleAskAI = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput("");
    setIsTyping(true);

    // Simulasi AI Analysis berdasarkan data asli lo
    setTimeout(() => {
      let botResponse = "";
      const input = userMsg.toLowerCase();

      if (input.includes("boros") || input.includes("analisis")) {
        botResponse = `Analisis gue: Total pengeluaran lo Rp ${stats.expense.toLocaleString()}. ${stats.expense > stats.income ? "Lo lebih besar pasak daripada tiang nih bro, gawat!" : "Masih aman, tapi tetep jaga nafsu belanja lo ya."}`;
      } else if (input.includes("saldo") || input.includes("sisa")) {
        botResponse = `Sisa saldo lo Rp ${stats.balance.toLocaleString()}. Cukup kok kalau cuma buat ngopi, tapi kalau buat beli MacBook kayaknya harus nabung lagi.`;
      } else if (input.includes("pemasukan")) {
        botResponse = `Bulan ini lo udah dapet Rp ${stats.income.toLocaleString()}. Mantap! Tabungin minimal 20% ya bro biar tenang di akhir bulan.`;
      } else {
        botResponse = "Gue asisten AI lo. Tanya aja soal pengeluaran, saldo, atau minta tips hemat. Gue baca data lo secara real-time!";
      }

      setChatHistory(prev => [...prev, { role: 'bot', text: botResponse }]);
      setIsTyping(false);
    }, 1000);
  };

  const handleAddWallet = async () => {
    if (!newWalletName.trim()) return;
    await addDoc(collection(db, "wallets"), { name: newWalletName, userId: user.uid, createdAt: new Date() });
    setNewWalletName(""); setShowAddWallet(false);
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    await addDoc(collection(db, "categories"), { name: newCatName, userId: user.uid, createdAt: new Date() });
    setNewCatName("");
  };

  const handleDeleteTransaction = async (id) => {
    if (window.confirm("Hapus history ini?")) await deleteDoc(doc(db, "transactions", id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || !form.category || !form.walletId) return alert("Pilih kategori & wallet dulu!");
    try {
      await addDoc(collection(db, "transactions"), { ...form, amount: Number(form.amount), userId: user.uid, createdAt: new Date() });
      setShowAddTransaction(false);
      setForm({ ...form, amount: "", category: "" });
    } catch (err) { alert("Error: " + err.message); }
  };

  const exportPDF = async () => {
    const doc = new jsPDF();
    const dateRange = `${startDate} s/d ${endDate}`;
    const filteredData = allTransactions.filter(tr => {
      const trDate = new Date(tr.createdAt.seconds * 1000).toISOString().split('T')[0];
      return trDate >= startDate && trDate <= endDate;
    }).sort((a, b) => a.createdAt.seconds - b.createdAt.seconds);

    const periodInc = filteredData.filter(tr => tr.type === 'income').reduce((a, b) => a + b.amount, 0);
    const periodExp = filteredData.filter(tr => tr.type === 'expense').reduce((a, b) => a + b.amount, 0);
    const netBalance = periodInc - periodExp;

    doc.setFontSize(24);
    doc.setTextColor(14, 165, 233);
    doc.setFont("helvetica", "bold");
    doc.text("FINANSIALKU", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`User Account: ${user.email}`, 14, 32);
    doc.text(`Report Period: ${dateRange}`, 14, 38);

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 52, 182, 30, 3, 3, 'FD');
    doc.setFontSize(9);
    doc.text("TOTAL INCOME", 22, 62);
    doc.text("TOTAL EXPENSE", 82, 62);
    doc.text("NET BALANCE", 142, 62);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(34, 197, 94); doc.text(`Rp ${periodInc.toLocaleString()}`, 22, 72);
    doc.setTextColor(239, 68, 68); doc.text(`Rp ${periodExp.toLocaleString()}`, 82, 72);
    doc.setTextColor(14, 165, 233); doc.text(`Rp ${netBalance.toLocaleString()}`, 142, 72);

    const rows = filteredData.map(tr => [
        new Date(tr.createdAt.seconds * 1000).toLocaleDateString('id-ID'),
        tr.category.toUpperCase(),
        wallets.find(w => w.id === tr.walletId)?.name.toUpperCase() || 'GENERAL',
        tr.type === 'income' ? 'MASUK' : 'KELUAR',
        `Rp ${tr.amount.toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: 92,
      head: [['TANGGAL', 'KATEGORI', 'WALLET', 'TIPE', 'NOMINAL']],
      body: rows,
      theme: 'striped',
      headStyles: { fillColor: [14, 165, 233], fontSize: 10 },
      didParseCell: (data) => {
        if (data.column.index === 3 && data.cell.section === 'body') {
          data.cell.styles.textColor = data.cell.text[0] === 'MASUK' ? [34, 197, 94] : [239, 68, 68];
        }
      }
    });
    doc.save(`Report_${startDate}.pdf`);
    setShowExportModal(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-sky-500 text-white font-black italic text-2xl uppercase tracking-tighter">FINANSIALKU</div>;
  if (!user) return <Login />;

  return (
    <div className={`min-h-screen flex flex-col max-w-md mx-auto transition-colors duration-500 ${darkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* HEADER */}
      <div className={`pt-14 pb-36 px-6 rounded-b-[4rem] shadow-lg relative z-20 transition-colors ${darkMode ? 'bg-slate-800' : 'bg-sky-500'}`}>
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-sky-500 font-black shadow-lg">F</div>
            <h1 className="text-white font-black text-2xl italic tracking-tighter">FinansialKu.</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setLang(lang === "id" ? "en" : "id")} className="text-white/90 p-2.5 bg-white/10 rounded-2xl active:scale-90 flex items-center gap-1 font-bold text-xs uppercase tracking-tighter">
              <Languages size={18}/> {lang}
            </button>
            <button onClick={() => setDarkMode(!darkMode)} className="text-white/90 p-2.5 bg-white/10 rounded-2xl active:scale-90 transition-all">
              {darkMode ? <Sun size={20}/> : <Moon size={20}/>}
            </button>
            <button onClick={() => signOut(auth)} className="text-white/90 p-2.5 bg-white/10 rounded-2xl active:scale-90 transition-all">
              <LogOut size={20}/>
            </button>
          </div>
        </div>
        <div className="flex justify-around text-white/90 text-[10px] font-black uppercase tracking-[0.2em]">
          <button onClick={() => setActiveTab("home")} className={`${activeTab === 'home' ? 'border-b-2 border-white pb-1.5' : 'opacity-60'}`}>{t.home}</button>
          <button onClick={() => setActiveTab("profile")} className={`${activeTab === 'profile' ? 'border-b-2 border-white pb-1.5' : 'opacity-60'}`}>{t.profile}</button>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 px-5 -mt-24 z-30 pb-32 overflow-y-auto no-scrollbar">
        {activeTab === "home" && (
          <div className="space-y-6">
            <div className={`rounded-[2.5rem] p-8 shadow-2xl border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-50'}`}>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  <span>{t.income}</span>
                  <span className={`font-black ${showBalance ? 'text-green-500' : 'text-slate-400'}`}>
                    {showBalance ? `Rp ${stats.income.toLocaleString()}` : "Rp ••••••••"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  <span>{t.expense}</span>
                  <span className={`font-black ${showBalance ? 'text-red-500' : 'text-slate-400'}`}>
                    {showBalance ? `-Rp ${stats.expense.toLocaleString()}` : "-Rp ••••••••"}
                  </span>
                </div>
                <div className="pt-5 border-t border-slate-100 flex justify-between items-center relative">
                  <span className={`font-black text-sm italic ${darkMode ? 'text-slate-400' : 'text-slate-600'} whitespace-nowrap`}>{t.totalBalance}</span>
                  <div className="flex items-center gap-3 overflow-hidden justify-end w-full ml-4">
                    <span className={`text-sky-500 font-black italic tracking-tighter transition-all ${stats.balance.toString().length > 9 && showBalance ? 'text-xl' : 'text-3xl'}`}>
                        {showBalance ? `Rp ${stats.balance.toLocaleString()}` : "Rp ••••••••"}
                    </span>
                    <button onClick={() => setShowBalance(!showBalance)} className="text-slate-300 hover:text-sky-500 transition-colors flex-shrink-0">
                        {showBalance ? <EyeOff size={20}/> : <Eye size={20}/>}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button onClick={() => setShowAI(true)} className="bg-purple-500 text-white p-4 rounded-3xl flex flex-col items-center justify-center gap-2 font-black text-[8px] uppercase shadow-xl active:scale-95 transition-all"><Bot size={22}/> AI ADVISOR</button>
              <button onClick={() => setActiveTab("wallet")} className="bg-sky-500 text-white p-4 rounded-3xl flex flex-col items-center justify-center gap-2 font-black text-[8px] uppercase shadow-xl active:scale-95 transition-all"><WalletIcon size={22}/> {t.wallet}</button>
              <button onClick={() => setShowExportModal(true)} className="bg-orange-500 text-white p-4 rounded-3xl flex flex-col items-center justify-center gap-2 font-black text-[8px] uppercase shadow-xl active:scale-95 transition-all"><FileText size={22}/> {t.report}</button>
            </div>

            <div className="space-y-4">
              <h3 className="font-black text-xs px-2 opacity-50 uppercase italic tracking-widest">{t.activity}</h3>
              {todayTransactions.length === 0 ? (
                <div className="text-center py-10 opacity-30 text-[10px] font-bold uppercase tracking-widest italic">Belum ada aktivitas hari ini</div>
              ) : (
                todayTransactions.map(tr => (
                  <div key={tr.id} className={`p-4 rounded-[2rem] flex justify-between items-center border transition-all ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-50 shadow-sm'}`}>
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className={`w-10 h-10 flex-shrink-0 rounded-2xl flex items-center justify-center ${tr.type === 'income' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>{tr.type === 'income' ? <ArrowUpCircle size={20}/> : <ArrowDownCircle size={20}/>}</div>
                      <div className="min-w-0">
                        <p className="font-black text-sm text-sky-500 tracking-tight uppercase truncate">{tr.category}</p>
                        <p className="text-[8px] text-slate-400 font-bold uppercase truncate">{wallets.find(w => w.id === tr.walletId)?.name || 'Wallet'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                        <p className={`font-black text-sm whitespace-nowrap ${tr.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                            {showBalance ? `Rp ${tr.amount.toLocaleString()}` : "Rp ••••"}
                        </p>
                        <button onClick={() => handleDeleteTransaction(tr.id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* --- TABS LAIN TETAP SAMA --- */}
        {activeTab === "wallet" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
              <h2 className="font-black italic tracking-tighter text-xl uppercase tracking-tighter">My {t.wallet}</h2>
              <button onClick={() => setShowAddWallet(true)} className="bg-sky-500 text-white p-2 rounded-xl active:scale-90"><PlusCircle size={20}/></button>
            </div>
            {wallets.map(w => (
              <div key={w.id} className={`p-6 rounded-[2.5rem] flex justify-between items-center border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-50 shadow-sm'}`}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-sky-500/10 text-sky-500 rounded-2xl flex items-center justify-center"><WalletIcon size={24}/></div>
                  <div>
                    <p className="font-black text-xs uppercase opacity-50 tracking-tighter">{w.name}</p>
                    <p className="font-black text-lg text-sky-500 tracking-tighter">
                        {showBalance ? `Rp ${allTransactions.filter(t => t.walletId === w.id).reduce((a, b) => a + (b.type === 'income' ? b.amount : -b.amount), 0).toLocaleString()}` : "Rp ••••••••"}
                    </p>
                  </div>
                </div>
                <button onClick={async () => {if(window.confirm(`Hapus wallet ${w.name}?`)) await deleteDoc(doc(db,"wallets",w.id))}} className="text-red-500/30 hover:text-red-500"><Trash2 size={18}/></button>
              </div>
            ))}
          </div>
        )}

        {activeTab === "profile" && (
          <div className="space-y-6">
            <div className={`rounded-[2.5rem] p-10 text-center shadow-xl border transition-all ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-50'}`}>
              <div className="relative w-28 h-28 mx-auto mb-5">
                {user.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-full h-full rounded-[2.5rem] object-cover shadow-2xl border-4 border-sky-500/20" />
                ) : (
                    <div className="w-full h-full bg-sky-500/10 rounded-[2.5rem] flex items-center justify-center text-sky-500 shadow-xl border-4 border-sky-500/20">
                        <User size={50}/>
                    </div>
                )}
                <div className="absolute -bottom-1 -right-1 bg-green-500 w-6 h-6 rounded-full border-4 border-white shadow-sm"></div>
              </div>
              <h2 className="font-black text-xl tracking-tight">{user.displayName || user.email}</h2>
              <p className="text-sky-500 text-[10px] font-black tracking-widest uppercase italic mt-1">Platinum Member</p>
            </div>
            <button onClick={() => window.confirm("Hapus akun permanen?") && deleteUser(auth.currentUser)} className="w-full p-6 bg-red-500/10 text-red-500 rounded-[2.5rem] font-black text-[10px] uppercase tracking-widest border border-red-500/20 active:scale-95 transition-all">
              {t.deleteAcc}
            </button>
          </div>
        )}
      </div>

      {/* BOTTOM NAV */}
      <div className={`fixed bottom-0 left-0 right-0 px-2 py-4 z-50 rounded-t-[3rem] shadow-2xl border-t transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
        <div className="grid grid-cols-5 items-center w-full">
          <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1.5 ${activeTab === 'home' ? 'text-sky-500' : 'opacity-30'}`}><Home size={22}/> <span className="text-[8px] font-black uppercase">{t.home}</span></button>
          <button onClick={() => setShowAddCategory(true)} className={`flex flex-col items-center gap-1.5 opacity-30`}><Tag size={22}/> <span className="text-[8px] font-black uppercase">Category</span></button>
          <div className="flex justify-center -mt-12">
            <button onClick={() => setShowAddTransaction(true)} className="w-14 h-14 bg-sky-500 rounded-full flex items-center justify-center text-white shadow-2xl border-4 border-white active:scale-90 transition-all shadow-sky-500/20">
              <PlusCircle size={28}/>
            </button>
          </div>
          <button onClick={() => setActiveTab('wallet')} className={`flex flex-col items-center gap-1.5 ${activeTab === 'wallet' ? 'text-sky-500' : 'opacity-30'}`}><WalletIcon size={22}/> <span className="text-[8px] font-black uppercase">{t.wallet}</span></button>
          <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1.5 ${activeTab === 'profile' ? 'text-sky-500' : 'opacity-30'}`}><User size={22}/> <span className="text-[8px] font-black uppercase">{t.profile}</span></button>
        </div>
      </div>

      {/* --- MODAL AI CHAT --- */}
      {showAI && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end justify-center p-4">
          <div className={`w-full max-w-md h-[80vh] rounded-t-[3rem] p-6 flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-500 ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
             <div className="flex justify-between items-center mb-6">
               <div className="flex items-center gap-2 text-purple-500 font-black italic uppercase text-sm"><Bot size={22}/> {t.aiTitle}</div>
               <button onClick={() => setShowAI(false)} className="p-2 bg-slate-100/10 rounded-full"><X size={20}/></button>
             </div>
             <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2 no-scrollbar">
                {chatHistory.length === 0 && (
                    <div className="text-center py-10 opacity-30 text-[10px] font-black uppercase italic">Halo bro! Tanya gue apa aja soal keuangan lo.</div>
                )}
                {chatHistory.map((chat, i) => (
                    <div key={i} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-4 rounded-3xl text-[11px] font-bold tracking-tight ${chat.role === 'user' ? 'bg-sky-500 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'}`}>
                            {chat.text}
                        </div>
                    </div>
                ))}
                {isTyping && <div className="text-[10px] font-black italic animate-pulse text-purple-500 ml-2">AI lagi baca dompet lo...</div>}
             </div>
             <form onSubmit={handleAskAI} className="relative">
               <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} className={`w-full p-5 rounded-3xl pr-16 outline-none text-xs font-bold border ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-100 border-slate-200'}`} placeholder="Tanya apa aja..." />
               <button type="submit" className="absolute right-3 top-3 bg-sky-500 text-white p-2 rounded-2xl active:scale-90 transition-all"><Send size={20}/></button>
             </form>
          </div>
        </div>
      )}

      {/* --- MODAL LAINNYA TETAP --- */}
      {showAddTransaction && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-md rounded-t-[4rem] p-10 shadow-2xl relative ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
            <button onClick={() => setShowAddTransaction(false)} className="absolute top-8 right-8 p-1.5 rounded-full bg-slate-500/10"><X size={18}/></button>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="flex bg-slate-100/10 p-1.5 rounded-2xl">
                {['income', 'expense'].map(item => (
                  <button key={item} type="button" onClick={() => setForm({...form, type: item})} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${form.type === item ? 'bg-sky-500 text-white' : 'opacity-30'}`}>{item === 'income' ? t.income.toUpperCase() : t.expense.toUpperCase()}</button>
                ))}
              </div>
              <div className="text-center py-6">
                <div className="flex items-center justify-center gap-2 border-b-2 border-sky-500/20 pb-2">
                  <span className="text-xl font-black text-sky-500 italic">Rp</span>
                  <input type="number" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} className={`w-full font-black text-center outline-none bg-transparent tracking-tighter ${form.amount.length > 8 ? 'text-3xl' : 'text-5xl'}`} placeholder="0" autoFocus required />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1"><p className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em]">{t.addCategory}</p><button type="button" onClick={() => setShowAddCategory(true)} className="text-[9px] font-black text-sky-500">+ ATUR</button></div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
                  {categories.map(c => <button key={c.id} type="button" onClick={() => setForm({...form, category: c.name})} className={`px-6 py-3 whitespace-nowrap rounded-full text-[10px] font-black border transition-all ${form.category === c.name ? 'bg-sky-500 text-white border-sky-500 shadow-lg' : 'opacity-40 border-slate-500/20'}`}>{c.name.toUpperCase()}</button>)}
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1"><p className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em]">Pilih {t.wallet}</p><button type="button" onClick={() => setShowAddWallet(true)} className="text-[9px] font-black text-sky-500">+ BARU</button></div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
                  {wallets.map(w => <button key={w.id} type="button" onClick={() => setForm({...form, walletId: w.id})} className={`px-6 py-3 whitespace-nowrap rounded-2xl text-[10px] font-black border transition-all ${form.walletId === w.id ? 'bg-slate-700 text-white border-slate-700' : 'opacity-40 border-slate-500/20'}`}>{w.name.toUpperCase()}</button>)}
                </div>
              </div>
              <button type="submit" className="w-full bg-sky-500 text-white py-5 rounded-[2.5rem] font-black uppercase text-xs tracking-widest shadow-2xl active:scale-95 transition-all mt-4">{t.save}</button>
            </form>
          </div>
        </div>
      )}

      {showAddCategory && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in zoom-in duration-300">
          <div className={`w-full max-w-sm p-8 rounded-[3rem] shadow-2xl flex flex-col max-h-[80vh] ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
             <div className="flex justify-between items-center mb-6 px-1"><h2 className="font-black uppercase text-sm italic text-sky-600 tracking-widest">{t.addCategory}</h2><button onClick={() => setShowAddCategory(false)}><X size={24}/></button></div>
             <div className="flex gap-2 mb-6">
               <input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} className="flex-1 bg-slate-100/10 p-4 rounded-2xl outline-none text-xs font-black border border-slate-100/10" placeholder="Kategori baru..." />
               <button onClick={handleAddCategory} className="bg-sky-500 text-white px-5 rounded-2xl active:scale-90 transition-all"><PlusCircle size={20}/></button>
             </div>
             <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar">
               {categories.map(c => (
                 <div key={c.id} className="flex justify-between items-center p-4 bg-slate-100/5 rounded-2xl border border-slate-100/5 group">
                   <span className="text-[10px] font-black uppercase tracking-tight opacity-70">{c.name}</span>
                   <button onClick={() => deleteDoc(doc(db, "categories", c.id))} className="text-red-500/30 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                 </div>
               ))}
             </div>
          </div>
        </div>
      )}

      {showAddWallet && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className={`w-full max-w-sm p-10 rounded-[3.5rem] shadow-2xl ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
             <div className="flex justify-between items-center mb-8 px-1"><h2 className="font-black uppercase text-sm italic text-sky-600 tracking-widest">{t.addWallet}</h2><button onClick={() => setShowAddWallet(false)}><X size={20}/></button></div>
             <input value={newWalletName} onChange={(e) => setNewWalletName(e.target.value)} className="w-full bg-slate-100/10 p-5 rounded-[2rem] outline-none mb-6 text-sm font-black border border-slate-100/10" placeholder="Nama wallet..." />
             <button onClick={handleAddWallet} className="w-full bg-sky-500 text-white py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all">Simpan {t.wallet}</button>
          </div>
        </div>
      )}

      {showExportModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in zoom-in duration-300">
          <div className={`w-full max-w-sm p-10 rounded-[3.5rem] shadow-2xl ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
             <div className="flex justify-between items-center mb-8 italic font-black text-sky-500 text-lg tracking-tighter"><h2>DOWNLOAD {t.report.toUpperCase()}</h2><button onClick={() => setShowExportModal(false)}><X/></button></div>
             <div className="space-y-5">
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-slate-100/10 p-4 rounded-2xl outline-none text-xs font-black border border-slate-100/10" />
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-slate-100/10 p-4 rounded-2xl outline-none text-xs font-black border border-slate-100/10" />
                <button onClick={exportPDF} className="w-full bg-sky-500 text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-sky-500/20">Generate {t.report}</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;