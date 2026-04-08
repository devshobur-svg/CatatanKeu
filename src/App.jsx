import React, { useState, useEffect, useMemo, useRef } from "react";
import { auth, db } from "./lib/firebase";
import { onAuthStateChanged, signOut, setPersistence, browserLocalPersistence } from "firebase/auth";
import { 
  collection, addDoc, onSnapshot, query, where, 
  orderBy, deleteDoc, doc, Timestamp, updateDoc 
} from "firebase/firestore";
import { 
  PlusCircle, ArrowUpCircle, ArrowDownCircle, 
  LogOut, Trash2, Wallet as WalletIcon, X, Sun, Moon, 
  FileText, Home, User, Send, Bot, Search, Activity, ChevronLeft, Tag, Languages, Eye, EyeOff, Delete, Globe, AlertTriangle, ChevronDown, ChevronUp, Camera, Sparkles, Loader2, ChevronRight, Settings, ShieldCheck, Database, Info, CreditCard, ArrowRightLeft, Plus
} from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts"; 
import { createWorker } from 'tesseract.js'; 
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
    home: "Home",
    save: "Simpan Transaksi",
    totalBalance: "Total Saldo",
    scannerTitle: "Smart Bill Scanner",
    downloadBtn: "Download PDF",
    langName: "Indonesia",
    seeAll: "Lihat Semua",
    showLess: "Sembunyikan",
    account: "Akun",
    preferences: "Preferensi",
    exportData: "Ekspor Data",
    transfer: "Transfer"
  },
  en: {
    income: "Income",
    expense: "Expense",
    activity: "Today's Activity",
    report: "Report",
    wallet: "Wallet",
    profile: "Profile",
    home: "Home",
    save: "Save Transaction",
    totalBalance: "Total Balance",
    scannerTitle: "Smart Bill Scanner",
    downloadBtn: "Download PDF",
    langName: "English",
    seeAll: "See All",
    showLess: "Show Less",
    account: "Account",
    preferences: "Preferences",
    exportData: "Export Data",
    transfer: "Transfer"
  }
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  const [lang, setLang] = useState(() => localStorage.getItem("fin_lang") || "id");
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("fin_dark") === "true");
  const [wallets, setWallets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]); 
  const [showBalance, setShowBalance] = useState(true);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [newCatName, setNewCatName] = useState("");
  const [newCatLimit, setNewCatLimit] = useState("");
  const [newWalletName, setNewWalletName] = useState("");
  
  const [showInlineCatInput, setShowInlineCatInput] = useState(false);
  const [showInlineWalletInput, setShowInlineWalletInput] = useState(false);
  const [inlineValue, setInlineValue] = useState("");

  const [form, setForm] = useState({ amount: "", category: "", type: "expense", walletId: "" });
  const [transferForm, setTransferForm] = useState({ amount: "", fromWalletId: "", toWalletId: "" });

  const timeoutRef = useRef(null);
  const t = TRANSLATIONS[lang];

  const resetTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (user) {
      timeoutRef.current = setTimeout(() => {
        signOut(auth);
        alert("Sesi berakhir karena tidak ada aktivitas selama 2 menit.");
      }, 120000); 
    }
  };

  useEffect(() => {
    if (user) {
      window.addEventListener("mousemove", resetTimer);
      window.addEventListener("mousedown", resetTimer);
      window.addEventListener("keypress", resetTimer);
      window.addEventListener("scroll", resetTimer);
      window.addEventListener("touchstart", resetTimer);
      resetTimer();
    }
    return () => {
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("mousedown", resetTimer);
      window.removeEventListener("keypress", resetTimer);
      window.removeEventListener("scroll", resetTimer);
      window.removeEventListener("touchstart", resetTimer);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [user]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
        onAuthStateChanged(auth, (currentUser) => {
          setUser(currentUser);
          setLoading(false);
        });
      } catch (error) { setLoading(false); }
    };
    initAuth();
  }, []);

  useEffect(() => {
    localStorage.setItem("fin_lang", lang);
    localStorage.setItem("fin_dark", darkMode);
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [lang, darkMode]);

  useEffect(() => {
    if (!user) return;
    const unsubWallets = onSnapshot(query(collection(db, "wallets"), where("userId", "==", user.uid)), (snap) => {
      setWallets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubCats = onSnapshot(query(collection(db, "categories"), where("userId", "==", user.uid), orderBy("name", "asc")), (snap) => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubAll = onSnapshot(query(collection(db, "transactions"), where("userId", "==", user.uid), orderBy("createdAt", "desc")), (snap) => {
      setAllTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubWallets(); unsubCats(); unsubAll(); };
  }, [user]);

  const stats = useMemo(() => {
    const inc = allTransactions.filter(tr => tr.type === 'income').reduce((a, b) => a + (Number(b.amount) || 0), 0);
    const exp = allTransactions.filter(tr => tr.type === 'expense').reduce((a, b) => a + (Number(b.amount) || 0), 0);
    return { income: inc, expense: exp, balance: inc - exp };
  }, [allTransactions]);

  const categoryStats = useMemo(() => {
    const now = new Date();
    return categories.map(cat => {
      const transactionsThisMonth = allTransactions.filter(tr => {
        const trDate = tr.createdAt?.seconds ? new Date(tr.createdAt.seconds * 1000) : new Date();
        return tr.category === cat.name && tr.type === 'expense' && trDate.getMonth() === now.getMonth() && trDate.getFullYear() === now.getFullYear();
      });
      const totalSpent = transactionsThisMonth.reduce((sum, tr) => sum + (Number(tr.amount) || 0), 0);
      const sparkData = transactionsThisMonth.slice(0, 6).reverse().map((tr) => ({ amount: Number(tr.amount) }));
      return { 
        ...cat, spent: totalSpent, limit: Number(cat.limit) || 0,
        history: sparkData.length > 1 ? sparkData : [{ amount: 10 }, { amount: 10 }] 
      };
    });
  }, [categories, allTransactions]);

  const displayedTransactions = useMemo(() => {
    const filtered = allTransactions.filter(tr => 
        tr.category.toLowerCase().includes(searchQuery.toLowerCase()) || tr.amount.toString().includes(searchQuery)
    );
    return showAllHistory ? filtered : filtered.slice(0, 3);
  }, [allTransactions, searchQuery, showAllHistory]);

  const formatRupiah = (value) => {
    if (!value || value === "0") return "0";
    return Number(value).toLocaleString('id-ID');
  };

  const handleScanFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsScanning(true);
    try {
      const worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();
      const cleanText = text.replace(/[.,]/g, '');
      const matches = cleanText.match(/\d+/g);
      if (matches) {
        const amounts = matches.map(Number).filter(n => n > 1000);
        const detectedAmount = Math.max(...amounts);
        if (detectedAmount && detectedAmount !== -Infinity) {
          setForm({ ...form, amount: detectedAmount.toString(), type: "expense" });
        }
      }
    } catch (err) { alert("Error: " + err.message); } finally {
      setIsScanning(false); setShowScanner(false); setShowAddTransaction(true);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const filteredData = allTransactions.filter(tr => {
      const trDate = tr.createdAt?.seconds ? new Date(tr.createdAt.seconds * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      return trDate >= startDate && trDate <= endDate;
    });

    const periodInc = filteredData.filter(tr => tr.type === 'income').reduce((a, b) => a + Number(b.amount), 0);
    const periodExp = filteredData.filter(tr => tr.type === 'expense').reduce((a, b) => a + Number(b.amount), 0);
    const periodBalance = periodInc - periodExp;

    // Design Header PDF
    doc.setFillColor(14, 165, 233); doc.rect(0, 0, pageWidth, 45, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(24); doc.text("FinansialKu.", 14, 25);
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.text(`Periode Laporan: ${startDate} s/d ${endDate}`, 14, 37);

    // Summary Box
    doc.setFillColor(248, 250, 252); doc.roundedRect(14, 55, pageWidth - 28, 35, 4, 4, 'F');
    doc.setTextColor(100, 116, 139); doc.setFontSize(8); doc.text("PEMASUKAN", 20, 65); doc.text("PENGELUARAN", (pageWidth / 2) + 5, 65);
    doc.setFontSize(13); doc.setTextColor(34, 197, 94); doc.text(`Rp ${periodInc.toLocaleString('id-ID')}`, 20, 73);
    doc.setTextColor(239, 68, 68); doc.text(`Rp ${periodExp.toLocaleString('id-ID')}`, (pageWidth / 2) + 5, 73);
    doc.setTextColor(14, 165, 233); doc.setFontSize(10); doc.text(`NET SALDO PERIODE INI: Rp ${periodBalance.toLocaleString('id-ID')}`, 20, 84);

    let currentY = 105;

    // Grouping by Wallet (FIXED LOGIC)
    wallets.forEach((wallet) => {
      const walletTransactions = filteredData.filter(t => t.walletId === wallet.id);
      if (walletTransactions.length > 0) {
        if (currentY > 250) { doc.addPage(); currentY = 20; }
        doc.setTextColor(30, 41, 59); doc.setFontSize(12); doc.setFont("helvetica", "bold");
        doc.text(`DOMPET: ${wallet.name.toUpperCase()}`, 14, currentY);
        
        autoTable(doc, {
          startY: currentY + 5,
          head: [['Tanggal', 'Kategori', 'Tipe', 'Nominal']],
          body: walletTransactions.map(tr => [
            new Date(tr.createdAt.seconds * 1000).toLocaleDateString('id-ID'), 
            tr.category.toUpperCase(), 
            tr.type === 'income' ? 'MASUK' : 'KELUAR', 
            `Rp ${Number(tr.amount).toLocaleString('id-ID')}`
          ]),
          theme: 'striped',
          headStyles: { fillColor: [14, 165, 233] },
          margin: { left: 14, right: 14 },
          didDrawPage: (data) => { currentY = data.cursor.y; }
        });
        currentY = doc.lastAutoTable.finalY + 15;
      }
    });

    doc.save(`Laporan_FinansialKu_${startDate}_to_${endDate}.pdf`);
    setShowExportModal(false);
  };

  const handleNumpad = (val) => {
    setForm(prev => {
      if (val === "delete") return { ...prev, amount: prev.amount.slice(0, -1) };
      if (prev.amount.length > 10) return prev;
      return { ...prev, amount: prev.amount + val };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || !form.category || !form.walletId) return alert("Lengkapi data!");
    try {
      await addDoc(collection(db, "transactions"), { ...form, amount: Number(form.amount), userId: user.uid, createdAt: new Date() });
      setShowAddTransaction(false);
      setForm({ ...form, amount: "", category: "", type: "expense", walletId: "" });
      setActiveTab("home");
    } catch (err) { alert(err.message); }
  };

  const handleTransfer = async () => {
    const { amount, fromWalletId, toWalletId } = transferForm;
    if (!amount || !fromWalletId || !toWalletId || fromWalletId === toWalletId) return alert("Cek data transfer!");
    try {
      const numAmount = Number(amount);
      const now = new Date();
      await addDoc(collection(db, "transactions"), { amount: numAmount, type: "expense", category: "TRANSFER", walletId: fromWalletId, userId: user.uid, createdAt: now });
      await addDoc(collection(db, "transactions"), { amount: numAmount, type: "income", category: "TRANSFER", walletId: toWalletId, userId: user.uid, createdAt: now });
      setShowTransferModal(false);
      setTransferForm({ amount: "", fromWalletId: "", toWalletId: "" });
    } catch (err) { alert(err.message); }
  };

  const handleQuickAdd = async (type) => {
    if (!inlineValue) return;
    try {
        if (type === 'cat') {
            await addDoc(collection(db, "categories"), { name: inlineValue, limit: 0, userId: user.uid, createdAt: new Date() });
            setForm({...form, category: inlineValue});
            setShowInlineCatInput(false);
        } else {
            const docRef = await addDoc(collection(db, "wallets"), { name: inlineValue, userId: user.uid, createdAt: new Date() });
            setForm({...form, walletId: docRef.id});
            setShowInlineWalletInput(false);
        }
        setInlineValue("");
    } catch (err) { alert(err.message); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-sky-500 text-white font-black italic text-2xl">FINANSIALKU</div>;
  if (!user) return <Login />;

  return (
    <div className={`min-h-screen flex flex-col max-w-md mx-auto transition-colors duration-500 ${darkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* HEADER */}
      <div className={`pt-14 pb-36 px-6 rounded-b-[4rem] shadow-lg relative z-20 transition-colors ${darkMode ? 'bg-slate-800' : 'bg-sky-500'}`}>
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3"><div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-sky-500 font-black shadow-lg">F</div><h1 className="text-white font-black text-2xl italic tracking-tighter">FinansialKu.</h1></div>
          <div className="flex gap-2">
            <button onClick={() => setLang(lang === "id" ? "en" : "id")} className="text-white/90 p-2.5 bg-white/10 rounded-2xl active:scale-90 font-bold text-xs uppercase"><Globe size={18}/> {lang}</button>
            <button onClick={() => setDarkMode(!darkMode)} className="text-white/90 p-2.5 bg-white/10 rounded-2xl active:scale-90">{darkMode ? <Sun size={20}/> : <Moon size={20}/>}</button>
            <button onClick={() => signOut(auth)} className="text-white/90 p-2.5 bg-white/10 rounded-2xl active:scale-90"><LogOut size={20}/></button>
          </div>
        </div>
        <div className="flex justify-around text-white/90 text-[10px] font-black uppercase tracking-widest">
          <button onClick={() => setActiveTab("home")} className={`${activeTab === 'home' ? 'border-b-2 border-white pb-1.5' : 'opacity-60'}`}>{t.home}</button>
          <button onClick={() => setActiveTab("profile")} className={`${activeTab === 'profile' ? 'border-b-2 border-white pb-1.5' : 'opacity-60'}`}>{t.profile}</button>
        </div>
      </div>

      <div className="flex-1 px-5 -mt-24 z-30 pb-32 overflow-y-auto no-scrollbar" onTouchStart={resetTimer}>
        {activeTab === "home" && (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className={`rounded-[2.5rem] p-8 shadow-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-50'}`}>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400"><span>{t.income}</span><span className="text-green-500 ml-2 truncate">Rp {formatRupiah(stats.income)}</span></div>
                        <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400"><span>{t.expense}</span><span className="text-red-500 ml-2 truncate">-Rp {formatRupiah(stats.expense)}</span></div>
                        <div className="pt-5 border-t border-slate-100 flex flex-col gap-1">
                            <span className="font-black text-[10px] uppercase italic opacity-40 tracking-widest">{t.totalBalance}</span>
                            <div className="flex items-center justify-between gap-2 overflow-hidden">
                                <span className={`text-sky-500 font-black italic tracking-tighter leading-tight break-all ${showBalance ? 'text-2xl sm:text-3xl' : 'text-3xl'}`}>
                                    {showBalance ? `Rp ${formatRupiah(stats.balance)}` : "Rp ••••••"}
                                </span>
                                <button onClick={() => {setShowBalance(!showBalance); resetTimer();}} className="text-slate-300 hover:text-sky-500 transition-colors p-2 shrink-0">
                                    {showBalance ? <EyeOff size={20}/> : <Eye size={20}/>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="grid grid-cols-4 gap-2">
                    <button onClick={() => {setShowScanner(true); resetTimer();}} className="bg-indigo-500 text-white p-3 rounded-2xl flex flex-col items-center gap-2 font-black text-[7px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"><Camera size={20}/> SCAN</button>
                    <button onClick={() => {setShowTransferModal(true); resetTimer();}} className="bg-teal-500 text-white p-3 rounded-2xl flex flex-col items-center gap-2 font-black text-[7px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"><ArrowRightLeft size={20}/> TRANSFER</button>
                    <button onClick={() => {setActiveTab("wallet"); resetTimer();}} className="bg-sky-500 text-white p-3 rounded-2xl flex flex-col items-center gap-2 font-black text-[7px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"><WalletIcon size={20}/> WALLET</button>
                    <button onClick={() => {setShowExportModal(true); resetTimer();}} className="bg-orange-500 text-white p-3 rounded-2xl flex flex-col items-center gap-2 font-black text-[7px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"><FileText size={20}/> REPORT</button>
                </div>

                {/* BUDGETING SECTION */}
                {categoryStats.some(c => c.limit > 0) && (
                <div className="space-y-4"><h3 className="font-black text-xs px-2 opacity-50 uppercase italic tracking-widest">Monthly Budget</h3>
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                        {categoryStats.filter(c => c.limit > 0).map(cat => {
                            const percent = Math.min((cat.spent / cat.limit) * 100, 100);
                            const isOver = cat.spent > cat.limit;
                            return (
                                <div key={cat.id} className={`flex-shrink-0 w-44 p-5 rounded-[2rem] border transition-all ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white shadow-sm'}`}>
                                    <div className="flex justify-between items-start mb-2 gap-2 text-sky-500 font-black uppercase text-[10px] truncate">{cat.name} {isOver && <AlertTriangle size={14} className="text-red-500 shrink-0 animate-pulse"/>}</div>
                                    <p className="text-[11px] font-black mb-1">Rp {formatRupiah(cat.spent)}</p>
                                    <div className="flex items-end justify-between mb-3 h-6">
                                        <p className="text-[8px] font-bold opacity-40 uppercase italic">Limit: Rp {formatRupiah(cat.limit)}</p>
                                        <div className="w-12 h-5"><ResponsiveContainer width="100%" height="100%"><LineChart data={cat.history}><Line type="monotone" dataKey="amount" stroke={isOver ? "#ef4444" : "#0ea5e9"} strokeWidth={2} dot={false}/></LineChart></ResponsiveContainer></div>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden"><div className={`h-full transition-all duration-700 ${isOver ? 'bg-red-500' : 'bg-sky-500'}`} style={{width: `${percent}%`}}></div></div>
                                </div>
                            )
                        })}
                    </div>
                </div>
                )}

                {/* HISTORY SECTION */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-2">
                        <h3 className="font-black text-xs opacity-50 uppercase italic tracking-widest">{t.activity}</h3>
                        {allTransactions.length > 3 && (
                            <button onClick={() => {setShowAllHistory(!showAllHistory); resetTimer();}} className="text-[10px] font-black text-sky-500 uppercase flex items-center gap-1">
                                {showAllHistory ? t.showLess : t.seeAll} {showAllHistory ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                            </button>
                        )}
                    </div>
                    <div className="space-y-3">
                        {displayedTransactions.map(tr => (
                            <div key={tr.id} className={`p-4 rounded-[2rem] flex justify-between items-center border transition-all ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-50 shadow-sm'}`}>
                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                    <div className={`w-10 h-10 flex-shrink-0 rounded-2xl flex items-center justify-center ${tr.type === 'income' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                        {tr.type === 'income' ? <ArrowUpCircle size={20}/> : <ArrowDownCircle size={20}/>}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-black text-sm text-sky-500 uppercase truncate">{tr.category}</p>
                                        <p className="text-[8px] text-slate-400 font-bold uppercase truncate">{wallets.find(w => w.id === tr.walletId)?.name || 'Wallet'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <p className={`font-black text-sm whitespace-nowrap ${tr.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                                        {showBalance ? `${tr.type === 'income' ? '+' : '-'}Rp ${formatRupiah(tr.amount)}` : "Rp ••••••"}
                                    </p>
                                    <button onClick={async () => {if(window.confirm("Hapus?")) await deleteDoc(doc(db, "transactions", tr.id))}} className="text-slate-300 hover:text-red-500 transition-all">
                                        <Trash2 size={16}/>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* WALLET TAB */}
        {activeTab === "wallet" && (
            <div className="space-y-6 animate-in slide-in-from-right duration-300"><div className="flex justify-between items-center px-2"><h2 className="font-black italic text-xl uppercase tracking-tighter">My Wallets</h2><button onClick={() => {setShowAddWallet(true); resetTimer();}} className="bg-sky-500 text-white p-2 rounded-xl shadow-lg shadow-sky-500/20"><PlusCircle size={20}/></button></div>
                {wallets.map(w => (
                    <div key={w.id} className={`p-6 rounded-[2.5rem] border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white shadow-sm'}`}>
                        <div className="flex items-center justify-between"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-sky-500/10 text-sky-500 rounded-2xl flex items-center justify-center"><WalletIcon size={24}/></div>
                                <div><p className="font-black text-xs uppercase opacity-50">{w.name}</p><p className="font-black text-lg text-sky-500 truncate max-w-[150px]">Rp {formatRupiah(allTransactions.filter(t => t.walletId === w.id).reduce((a, b) => a + (b.type === 'income' ? Number(b.amount) : -Number(b.amount)), 0))}</p></div>
                            </div><button onClick={async () => {if(window.confirm("Hapus?")) await deleteDoc(doc(db,"wallets",w.id))}} className="text-red-500/20 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                        </div>
                    </div>
                ))}
            </div>
        )}
        
        {/* CATEGORY TAB */}
        {activeTab === "category" && (
            <div className="space-y-6 animate-in slide-in-from-right duration-300"><div className="flex justify-between items-center px-2"><h2 className="font-black italic text-xl uppercase tracking-tighter">Category & Budget</h2></div>
                <div className={`p-8 rounded-[2.5rem] border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white shadow-sm'}`}>
                    <div className="space-y-3 mb-6"><input value={newCatName} onChange={(e) => {setNewCatName(e.target.value); resetTimer();}} className={`w-full p-4 rounded-2xl outline-none text-xs font-black border ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-100'}`} placeholder="Category Name..." />
                        <div className="flex gap-2"><input value={newCatLimit} onChange={(e) => {setNewCatLimit(e.target.value); resetTimer();}} type="number" className={`flex-1 p-4 rounded-2xl outline-none text-xs font-black border ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-100'}`} placeholder="Limit Budget..." />
                            <button onClick={async () => {if(!newCatName) return; await addDoc(collection(db, "categories"), { name: newCatName, limit: Number(newCatLimit) || 0, userId: user.uid, createdAt: new Date() }); setNewCatName(""); setNewCatLimit(""); resetTimer();}} className="bg-orange-500 text-white px-6 rounded-2xl active:scale-95 shadow-lg"><PlusCircle size={20}/></button>
                        </div>
                    </div>
                    <div className="space-y-3">{categories.map(c => (
                            <div key={c.id} className={`p-5 rounded-[2rem] border ${darkMode ? 'bg-slate-700 border-slate-700' : 'bg-slate-50 border-slate-100'}`}><div className="flex justify-between items-center mb-1"><span className="text-[10px] font-black uppercase opacity-70 tracking-widest">{c.name}</span><button onClick={async () => {await deleteDoc(doc(db, "categories", c.id)); resetTimer();}} className="text-red-500/30 hover:text-red-500"><Trash2 size={16}/></button></div>
                                {Number(c.limit) > 0 && <div className="mt-3"><div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden"><div className="h-full bg-sky-500 transition-all duration-700" style={{width: `${Math.min(((categoryStats.find(cs => cs.id === c.id)?.spent || 0)/c.limit)*100, 100)}%`}}></div></div></div>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === "profile" && (
            <div className="space-y-6 animate-in slide-in-from-right duration-500">
                <div className={`p-8 rounded-[2.5rem] border shadow-xl text-center relative overflow-hidden transition-all ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-50'}`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                    <div className="w-24 h-24 bg-gradient-to-tr from-sky-500 to-indigo-500 mx-auto mb-4 rounded-[2rem] flex items-center justify-center text-white border-4 border-white dark:border-slate-700 shadow-lg"><User size={40}/></div>
                    <h2 className="font-black text-xl mb-1 tracking-tighter">{user.displayName || "User Finansial"}</h2>
                    <p className="text-slate-400 text-xs font-bold mb-6 tracking-widest uppercase truncate px-4">{user.email}</p>
                    <div className="grid grid-cols-2 gap-4 border-t pt-6 border-slate-100 dark:border-slate-700">
                        <div className="text-left overflow-hidden"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Saldo</p><p className="font-black text-sm text-sky-500 italic truncate">Rp {formatRupiah(stats.balance)}</p></div>
                        <div className="text-right overflow-hidden"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Transaksi</p><p className="font-black text-sm text-sky-500 italic">{allTransactions.length} Tx</p></div>
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="space-y-2"><p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t.account}</p>
                        <div className={`rounded-[2.5rem] p-4 space-y-1 shadow-sm border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-50'}`}>
                            <button className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-2xl transition-all"><div className="flex items-center gap-4"><div className="w-10 h-10 bg-sky-100 dark:bg-sky-500/20 text-sky-500 rounded-xl flex items-center justify-center"><User size={18}/></div><span className="text-xs font-black uppercase tracking-tight">Edit Profil</span></div><ChevronRight size={16} className="text-slate-300"/></button>
                            <button onClick={() => {setActiveTab("wallet"); resetTimer();}} className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-2xl transition-all"><div className="flex items-center gap-4"><div className="w-10 h-10 bg-green-100 dark:bg-green-500/20 text-green-500 rounded-xl flex items-center justify-center"><CreditCard size={18}/></div><span className="text-xs font-black uppercase tracking-tight">Atur Wallet</span></div><ChevronRight size={16} className="text-slate-300"/></button>
                            <button onClick={() => {setShowExportModal(true); resetTimer();}} className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-2xl transition-all"><div className="flex items-center gap-4"><div className="w-10 h-10 bg-orange-100 dark:bg-orange-500/20 text-orange-500 rounded-xl flex items-center justify-center"><Database size={18}/></div><span className="text-xs font-black uppercase tracking-tight">{t.exportData}</span></div><ChevronRight size={16} className="text-slate-300"/></button>
                        </div>
                    </div>
                    <button onClick={() => signOut(auth)} className="w-full p-6 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-[2rem] font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all"><LogOut size={18}/> Logout</button>
                </div>
            </div>
        )}
      </div>

      {/* BOTTOM NAV */}
      <div className={`fixed bottom-0 left-0 right-0 px-2 py-4 z-50 rounded-t-[3rem] shadow-2xl border-t ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
        <div className="grid grid-cols-5 items-center w-full text-center">
          <button onClick={() => {setActiveTab('home'); resetTimer();}} className={`flex flex-col items-center transition-all ${activeTab === 'home' ? 'text-sky-500 scale-110' : 'opacity-30'}`}><Home size={22}/> <span className="text-[8px] font-black uppercase">{t.home}</span></button>
          <button onClick={() => {setActiveTab('category'); resetTimer();}} className={`flex flex-col items-center transition-all ${activeTab === 'category' ? 'text-orange-500 scale-110' : 'opacity-30'}`}><Tag size={22}/> <span className="text-[8px] font-black uppercase">Tag</span></button>
          <div className="flex justify-center -mt-12"><button onClick={() => {setShowAddTransaction(true); resetTimer();}} className="w-14 h-14 bg-sky-500 rounded-full flex items-center justify-center text-white border-4 border-white shadow-xl active:scale-90 transition-all"><PlusCircle size={28}/></button></div>
          <button onClick={() => {setActiveTab('wallet'); resetTimer();}} className={`flex flex-col items-center transition-all ${activeTab === 'wallet' ? 'text-sky-500 scale-110' : 'opacity-30'}`}><WalletIcon size={22}/> <span className="text-[8px] font-black uppercase">Wallet</span></button>
          <button onClick={() => {setActiveTab('profile'); resetTimer();}} className={`flex flex-col items-center transition-all ${activeTab === 'profile' ? 'text-sky-500 scale-110' : 'opacity-30'}`}><User size={22}/> <span className="text-[8px] font-black uppercase">User</span></button>
        </div>
      </div>

      {/* MODAL TRANSFER */}
      {showTransferModal && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in zoom-in duration-300">
          <div className={`w-full max-w-sm p-8 rounded-[3.5rem] shadow-2xl ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
             <div className="flex justify-between items-center mb-6 italic font-black text-teal-500 text-lg tracking-tighter"><h2>TRANSFER DANA</h2><button onClick={() => setShowTransferModal(false)}><X/></button></div>
             <div className="space-y-4">
                <input type="text" value={transferForm.amount ? formatRupiah(transferForm.amount) : ""} onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    setTransferForm({...transferForm, amount: raw});
                    resetTimer();
                }} className={`w-full p-4 rounded-2xl outline-none text-xs font-black border ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-100'}`} placeholder="Nominal Rp" />
                <select value={transferForm.fromWalletId} onChange={(e) => {setTransferForm({...transferForm, fromWalletId: e.target.value}); resetTimer();}} className={`w-full p-4 rounded-2xl outline-none text-xs font-black border ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-100'}`}>
                    <option value="">Dari Dompet</option>
                    {wallets.map(w => <option key={w.id} value={w.id}>{w.name.toUpperCase()}</option>)}
                </select>
                <div className="flex justify-center py-1 opacity-40"><ArrowDownCircle /></div>
                <div className="space-y-1"><p className="text-[10px] font-black opacity-30 ml-2 uppercase">Tujuan Dompet</p>
                    <select value={transferForm.toWalletId} onChange={(e) => {setTransferForm({...transferForm, toWalletId: e.target.value}); resetTimer();}} className={`w-full p-4 rounded-2xl outline-none text-xs font-black border ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-100'}`}>
                        <option value="">Pilih Dompet Tujuan</option>
                        {wallets.map(w => <option key={w.id} value={w.id}>{w.name.toUpperCase()}</option>)}
                    </select>
                </div>
                <button onClick={handleTransfer} className="w-full bg-teal-500 text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] active:scale-95 flex items-center justify-center gap-2 mt-4"><ArrowRightLeft size={16}/> Konfirmasi Transfer</button>
             </div>
          </div>
        </div>
      )}

      {/* MODAL SCANNER */}
      {showScanner && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in zoom-in duration-300">
          <div className={`w-full max-w-sm p-10 rounded-[3.5rem] text-center ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-8 italic font-black text-indigo-500 text-lg tracking-tighter"><h2>{t.scannerTitle}</h2><button onClick={() => setShowScanner(false)}><X/></button></div>
            <div className={`w-full aspect-square rounded-[3rem] border-4 border-dashed mb-8 flex flex-col items-center justify-center gap-4 ${isScanning ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-200 opacity-50'}`}>
                {isScanning ? <><Loader2 size={50} className="text-indigo-500 animate-spin" /><p className="text-xs font-black uppercase tracking-widest animate-pulse">Scanning Bill...</p></> : <><Camera size={50} className="text-slate-300" /><p className="text-[10px] font-bold px-6 text-slate-400">Pilih foto struk belanja lo bro</p></>}
            </div>
            <label className={`w-full flex items-center justify-center gap-3 py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-widest transition-all cursor-pointer ${isScanning ? 'bg-slate-300 pointer-events-none' : 'bg-indigo-500 text-white shadow-xl shadow-indigo-500/20'}`}><Sparkles size={16}/> {isScanning ? 'Processing...' : 'Select Photo'}<input type="file" accept="image/*" className="hidden" onChange={(e) => {handleScanFile(e); resetTimer();}} disabled={isScanning} /></label>
          </div>
        </div>
      )}

      {/* MODAL REPORT (FIXED & BACK) */}
      {showExportModal && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in zoom-in duration-300">
          <div className={`w-full max-w-sm p-10 rounded-[3.5rem] shadow-2xl ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-8 italic font-black text-orange-500 text-lg tracking-tighter">
                <h2>{t.report.toUpperCase()}</h2>
                <button onClick={() => setShowExportModal(false)}><X/></button>
            </div>
            <div className="space-y-5">
                <div className="space-y-1">
                    <p className="text-[10px] font-black opacity-30 ml-2 uppercase tracking-widest">Mulai</p>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={`w-full p-4 rounded-2xl outline-none text-xs font-black border ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-100'}`} />
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-black opacity-30 ml-2 uppercase tracking-widest">Sampai</p>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={`w-full p-4 rounded-2xl outline-none text-xs font-black border ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-100'}`} />
                </div>
                <button onClick={exportPDF} className="w-full bg-orange-500 text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] active:scale-95 flex items-center justify-center gap-2 mt-4 shadow-lg shadow-orange-500/20">
                    <FileText size={16}/> {t.downloadBtn}
                </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ADD WALLET */}
      {showAddWallet && (
        <div className="fixed inset-0 z-[110] bg-black/60 flex items-center justify-center p-6 animate-in zoom-in duration-300">
          <div className={`w-full max-w-sm p-10 rounded-[3.5rem] ${darkMode ? 'bg-slate-800' : 'bg-white'}`}><div className="flex justify-between items-center mb-8"><h2 className="font-black uppercase text-sm italic text-sky-600 tracking-widest">Add Wallet</h2><button onClick={() => setShowAddWallet(false)}><X/></button></div>
             <input value={newWalletName} onChange={(e) => setNewWalletName(e.target.value)} className={`w-full p-5 rounded-[2rem] outline-none mb-6 text-sm font-black border ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-100 border-slate-200'}`} placeholder="Wallet name..." /><button onClick={() => {if(newWalletName){addDoc(collection(db, "wallets"), { name: newWalletName, userId: user.uid, createdAt: new Date() }); setNewWalletName(""); setShowAddWallet(false);}}} className="w-full bg-sky-500 text-white py-5 rounded-[2rem] font-black uppercase text-xs">Save Wallet</button>
          </div>
        </div>
      )}

      {/* MODAL ADD TRANSACTION */}
      {showAddTransaction && (
        <div className={`fixed inset-0 z-[100] flex flex-col animate-in slide-in-from-bottom duration-300 ${darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-800'}`}>
          <div className="flex items-center justify-between p-6 shrink-0"><button onClick={() => setShowAddTransaction(false)} className={`p-3 rounded-full ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}><ChevronLeft size={20}/></button><h2 className="font-black text-lg text-sky-500 uppercase italic tracking-tighter">Add {form.type.toUpperCase()}</h2><div className="w-10"></div></div>
          <div className="px-6 mb-4 shrink-0"><div className={`${darkMode ? 'bg-slate-800' : 'bg-slate-100'} p-1 rounded-3xl flex`}><button onClick={() => {setForm({...form, type: 'expense'}); resetTimer();}} className={`flex-1 py-3 rounded-2xl text-xs font-black transition-all ${form.type === 'expense' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400'}`}>EXPENSE</button><button onClick={() => {setForm({...form, type: 'income'}); resetTimer();}} className={`flex-1 py-3 rounded-2xl text-xs font-black transition-all ${form.type === 'income' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400'}`}>INCOME</button></div></div>
          <div className="flex flex-col items-center mb-4 shrink-0 px-6"><h1 className="text-4xl font-black tracking-tighter mb-1 text-sky-500 truncate w-full text-center">Rp {form.amount ? formatRupiah(form.amount) : "0"}</h1><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Confirm Amount</p></div>
          <div className="flex-1 overflow-y-auto px-6 space-y-6 no-scrollbar pb-10">
            <div className="space-y-3">
              <div className="flex justify-between items-center px-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategori</p>
                <button onClick={() => {setShowInlineCatInput(!showInlineCatInput); setShowInlineWalletInput(false); setInlineValue("");}} className="text-sky-500 p-1 hover:bg-sky-500/10 rounded-lg transition-all">{showInlineCatInput ? <X size={16}/> : <Plus size={16}/>}</button>
              </div>
              {showInlineCatInput && (<div className="flex gap-2 animate-in slide-in-from-top duration-200"><input autoFocus value={inlineValue} onChange={(e) => setInlineValue(e.target.value)} className={`flex-1 p-3 rounded-xl text-xs font-black border outline-none ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} placeholder="Nama kategori baru..." /><button onClick={() => handleQuickAdd('cat')} className="bg-sky-500 text-white p-3 rounded-xl active:scale-90"><ShieldCheck size={18}/></button></div>)}
              <div className="flex flex-wrap gap-2">{categories.map(c => (<button key={c.id} onClick={() => {setForm({...form, category: c.name}); resetTimer();}} className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[10px] font-black border transition-all ${form.category === c.name ? 'bg-sky-600 text-white border-sky-600 shadow-md' : 'bg-white border-slate-100 text-slate-400'}`}><Tag size={12}/> {c.name.toUpperCase()}</button>))}</div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center px-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Wallet</p>
                <button onClick={() => {setShowInlineWalletInput(!showInlineWalletInput); setShowInlineCatInput(false); setInlineValue("");}} className="text-sky-500 p-1 hover:bg-sky-500/10 rounded-lg transition-all">{showInlineWalletInput ? <X size={16}/> : <Plus size={16}/>}</button>
              </div>
              {showInlineWalletInput && (<div className="flex gap-2 animate-in slide-in-from-top duration-200"><input autoFocus value={inlineValue} onChange={(e) => setInlineValue(e.target.value)} className={`flex-1 p-3 rounded-xl text-xs font-black border outline-none ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} placeholder="Nama dompet baru..." /><button onClick={() => handleQuickAdd('wallet')} className="bg-sky-500 text-white p-3 rounded-xl active:scale-90"><ShieldCheck size={18}/></button></div>)}
              <div className="flex flex-wrap gap-2">{wallets.map(w => (<button key={w.id} onClick={() => {setForm({...form, walletId: w.id}); resetTimer();}} className={`px-4 py-2.5 rounded-2xl text-[10px] font-black border transition-all ${form.walletId === w.id ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white border-slate-100 text-slate-400'}`}>{w.name.toUpperCase()}</button>))}</div>
            </div>
          </div>
          <div className={`shrink-0 ${darkMode ? 'bg-slate-800/80 backdrop-blur-md' : 'bg-slate-50'} border-t border-slate-200`}>
            <div className="grid grid-cols-3 gap-1 p-2">{[1, 2, 3, 4, 5, 6, 7, 8, 9, "00", 0].map(n => (<button key={n} type="button" onClick={() => {handleNumpad(n.toString()); resetTimer();}} className={`py-4 text-xl font-black active:bg-sky-500 active:text-white transition-all rounded-xl`}>{n}</button>))}
              <button type="button" onClick={() => {handleNumpad("delete"); resetTimer();}} className="py-4 flex items-center justify-center text-red-500 active:bg-red-500 active:text-white rounded-xl transition-all"><Delete size={24}/></button>
            </div>
            <div className="px-4 pb-6 pt-2"><button onClick={(e) => {handleSubmit(e); resetTimer();}} className="w-full bg-sky-500 text-white py-5 rounded-[2rem] font-black uppercase text-xs active:scale-95 shadow-xl shadow-sky-500/20 transition-all flex items-center justify-center gap-3"><ShieldCheck size={18}/> {t.save}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;