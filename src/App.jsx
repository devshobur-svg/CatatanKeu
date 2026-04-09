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
  FileText, Home, User, Send, Bot, Search, Activity, ChevronLeft, Tag, Languages, Eye, EyeOff, Delete, Globe, AlertTriangle, ChevronDown, ChevronUp, Camera, Sparkles, Loader2, ChevronRight, Settings, ShieldCheck, Database, Info, CreditCard, ArrowRightLeft, Plus, Landmark, Coins, TrendingDown, PieChart, Layers, ArrowDown, Edit3, Check
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
    transfer: "Transfer",
    remaining: "Sisa",
    myWallets: "Dompet Saya",
    healthScore: "Kesehatan Keuangan",
    topSpending: "Pengeluaran Terbesar",
    catTitle: "Kategori & Budget"
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
    transfer: "Transfer",
    remaining: "Remaining",
    myWallets: "My Wallets",
    healthScore: "Financial Health",
    topSpending: "Top Spending",
    catTitle: "Category & Budget"
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
  const [newWalletType, setNewWalletType] = useState("bank");
  
  const [showInlineCatInput, setShowInlineCatInput] = useState(false);
  const [showInlineWalletInput, setShowInlineWalletInput] = useState(false);
  const [inlineValue, setInlineValue] = useState("");

  const [form, setForm] = useState({ amount: "", category: "", type: "expense", walletId: "" });
  const [transferForm, setTransferForm] = useState({ amount: "", fromWalletId: "", toWalletId: "" });

  // Special State for Category Improvement
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [tempLimit, setTempLimit] = useState("");

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
      const events = ["mousemove", "mousedown", "keypress", "scroll", "touchstart"];
      events.forEach(e => window.addEventListener(e, resetTimer));
      resetTimer();
      return () => events.forEach(e => window.removeEventListener(e, resetTimer));
    }
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

  const handleUpdatePhoto = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Untuk demo/sederhana, kita pakai URL lokal dulu atau lo bisa upload ke layanan hosing gambar
  // Di sini gue contohin cara update display name/photo di Firebase Auth
  const reader = new FileReader();
  reader.onloadend = async () => {
    // Note: Di production, sebaiknya upload file ke Firebase Storage lalu ambil URL-nya
    // Untuk sekarang kita simpan feedback suksesnya dulu
    showNotice("Fitur upload ke Storage butuh config tambahan, tapi UI sudah siap!", "success");
  };
  reader.readAsDataURL(file);
};

  // CORE LOGIC
  const stats = useMemo(() => {
    const inc = allTransactions.filter(tr => tr.type === 'income').reduce((a, b) => a + (Number(b.amount) || 0), 0);
    const exp = allTransactions.filter(tr => tr.type === 'expense').reduce((a, b) => a + (Number(b.amount) || 0), 0);
    return { income: inc, expense: exp, balance: inc - exp };
  }, [allTransactions]);

  const walletData = useMemo(() => {
    return wallets.map(w => {
      const bal = allTransactions.filter(t => t.walletId === w.id).reduce((a, b) => a + (b.type === 'income' ? Number(b.amount) : -Number(b.amount)), 0);
      return { ...w, balance: bal };
    });
  }, [wallets, allTransactions]);

  const categoryStats = useMemo(() => {
    const now = new Date();
    return categories.map(cat => {
      const transactionsThisMonth = allTransactions.filter(tr => {
        const trDate = tr.createdAt?.seconds ? new Date(tr.createdAt.seconds * 1000) : new Date();
        return tr.category === cat.name && tr.type === 'expense' && trDate.getMonth() === now.getMonth() && trDate.getFullYear() === now.getFullYear();
      });
      const totalSpent = transactionsThisMonth.reduce((sum, tr) => sum + (Number(tr.amount) || 0), 0);
      const limit = Number(cat.limit) || 0;
      return { ...cat, spent: totalSpent, limit: limit, remaining: limit - totalSpent };
    });
  }, [categories, allTransactions]);

  const displayedTransactions = useMemo(() => {
    const filtered = allTransactions.filter(tr => 
        tr.category.toLowerCase().includes(searchQuery.toLowerCase()) || tr.amount.toString().includes(searchQuery)
    );
    return showAllHistory ? filtered : filtered.slice(0, 3);
  }, [allTransactions, searchQuery, showAllHistory]);

  const topSpendingCategory = useMemo(() => {
    if (categoryStats.length === 0) return null;
    return [...categoryStats].sort((a, b) => b.spent - a.spent)[0];
  }, [categoryStats]);

  const healthScore = useMemo(() => {
    if (stats.income === 0) return 0;
    const score = Math.max(0, 100 - (stats.expense / stats.income * 100));
    return Math.round(score);
  }, [stats]);

  // UTILS
  const formatRupiah = (value) => {
    if (!value && value !== 0) return "0";
    const cleanValue = value.toString().replace(/\D/g, '');
    return Number(cleanValue).toLocaleString('id-ID');
  };

  // PDF EXPORT HANDLER
  const exportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const today = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });

    const filteredData = [...allTransactions].filter(tr => {
      const trDate = tr.createdAt?.seconds ? new Date(tr.createdAt.seconds * 1000).toISOString().split('T')[0] : "";
      return trDate >= startDate && trDate <= endDate;
    }).sort((a, b) => a.createdAt.seconds - b.createdAt.seconds);

    // Header Design
    doc.setFillColor(14, 165, 233); doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(22);
    doc.text("FinansialKu.", 14, 22);
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.text("Electronic Transaction Statement", 14, 30);

    // User Profile Pojok Kanan
    doc.textAlign = "right";
    doc.setFontSize(9);
    doc.text(`Nasabah: ${user.displayName || user.email}`, pageWidth - 14, 18, { align: 'right' });
    doc.text(`Periode: ${startDate} - ${endDate}`, pageWidth - 14, 24, { align: 'right' });
    doc.text(`Generated on: ${today}`, pageWidth - 14, 30, { align: 'right' });
    doc.textAlign = "left";

    let currentY = 50;

    // Summary Global
    const totalPemasukan = filteredData.filter(t => t.type === 'income').reduce((a, b) => a + Number(b.amount), 0);
    const totalPengeluaran = filteredData.filter(t => t.type === 'expense').reduce((a, b) => a + Number(b.amount), 0);

    doc.setFillColor(241, 245, 249); doc.roundedRect(14, currentY, pageWidth - 28, 30, 3, 3, 'F');
    doc.setTextColor(71, 85, 105); doc.setFontSize(8); doc.setFont("helvetica", "bold");
    doc.text("RINGKASAN MUTASI GLOBAL", 20, currentY + 8);
    doc.setTextColor(34, 197, 94); doc.text(`(+) TOTAL CR (MASUK): Rp ${totalPemasukan.toLocaleString('id-ID')}`, 20, currentY + 18);
    doc.setTextColor(239, 68, 68); doc.text(`(-) TOTAL DB (KELUAR): Rp ${totalPengeluaran.toLocaleString('id-ID')}`, pageWidth - 100, currentY + 18);
    doc.setTextColor(14, 165, 233); doc.text(`NET MUTASI: Rp ${(totalPemasukan - totalPengeluaran).toLocaleString('id-ID')}`, 20, currentY + 25);

    currentY += 45;

    // Statement per Wallet
    wallets.forEach((wallet) => {
      const walletTx = filteredData.filter(t => t.walletId === wallet.id);
      if (walletTx.length > 0) {
        if (currentY > 240) { doc.addPage(); currentY = 20; }
        doc.setFillColor(51, 65, 85); doc.rect(14, currentY, pageWidth - 28, 8, 'F');
        doc.setTextColor(255, 255, 255); doc.setFontSize(9); doc.setFont("helvetica", "bold");
        doc.text(`RINCIAN TRANSAKSI - ${wallet.name.toUpperCase()}`, 18, currentY + 5.5);

        autoTable(doc, {
          startY: currentY + 8,
          head: [['Tanggal', 'Kategori', 'Tipe', 'Nominal', 'Status']],
          body: walletTx.map(tr => [
            new Date(tr.createdAt.seconds * 1000).toLocaleDateString('id-ID'),
            tr.category.toUpperCase(),
            tr.type === 'income' ? 'CR' : 'DB',
            `Rp ${Number(tr.amount).toLocaleString('id-ID')}`,
            'SUCCESS'
          ]),
          theme: 'grid',
          styles: { fontSize: 8 },
          headStyles: { fillColor: [241, 245, 249], textColor: [51, 65, 85] },
          didDrawPage: (data) => { currentY = data.cursor.y; }
        });
        currentY = doc.lastAutoTable.finalY + 15;
      }
    });

    doc.save(`E-Statement_FinansialKu_${startDate}.pdf`);
    setShowExportModal(false);
  };

  const handleScanFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsScanning(true);
    try {
      const worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();
      const detectedAmount = Math.max(...(text.replace(/[.,]/g, '').match(/\d+/g)?.map(Number).filter(n => n > 1000) || [0]));
      if (detectedAmount > 0) setForm({ ...form, amount: detectedAmount.toString(), type: "expense" });
    } catch (err) { alert(err.message); } finally {
      setIsScanning(false); setShowScanner(false); setShowAddTransaction(true);
    }
  };

  const handleNumpad = (val) => {
    setForm(prev => (val === "delete" ? { ...prev, amount: prev.amount.slice(0, -1) } : prev.amount.length < 11 ? { ...prev, amount: prev.amount + val } : prev));
  };

  const handleSubmit = async () => {
    if (!form.amount || !form.category || !form.walletId) return alert("Lengkapi data!");
    await addDoc(collection(db, "transactions"), { ...form, amount: Number(form.amount), userId: user.uid, createdAt: new Date() });
    setShowAddTransaction(false); setForm({ amount: "", category: "", type: "expense", walletId: "" });
    setActiveTab("home");
  };

  const handleTransfer = async () => {
    const { amount, fromWalletId, toWalletId } = transferForm;
    if (!amount || !fromWalletId || !toWalletId || fromWalletId === toWalletId) return alert("Cek data transfer!");
    const now = new Date();
    await addDoc(collection(db, "transactions"), { amount: Number(amount), type: "expense", category: "TRANSFER", walletId: fromWalletId, userId: user.uid, createdAt: now });
    await addDoc(collection(db, "transactions"), { amount: Number(amount), type: "income", category: "TRANSFER", walletId: toWalletId, userId: user.uid, createdAt: now });
    setShowTransferModal(false); setTransferForm({ amount: "", fromWalletId: "", toWalletId: "" });
  };

  const handleQuickAdd = async (type) => {
    if (!inlineValue) return;
    if (type === 'cat') {
      await addDoc(collection(db, "categories"), { name: inlineValue, limit: 0, userId: user.uid, createdAt: new Date() });
      setForm({...form, category: inlineValue}); setShowInlineCatInput(false);
    } else {
      const docRef = await addDoc(collection(db, "wallets"), { name: inlineValue, type: "cash", userId: user.uid, createdAt: new Date() });
      setForm({...form, walletId: docRef.id}); setShowInlineWalletInput(false);
    }
    setInlineValue("");
  };

  

  // Improved Function for Category Tab
  const handleUpdateLimit = async (id) => {
    if (tempLimit === "") return setEditingCategoryId(null);
    await updateDoc(doc(db, "categories", id), { limit: Number(tempLimit) });
    setEditingCategoryId(null);
    setTempLimit("");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-sky-500 text-white font-black italic text-2xl animate-pulse">FINANSIALKU</div>;
  if (!user) return <Login />;

  return (
    <div className={`min-h-screen flex flex-col max-w-md mx-auto transition-colors duration-500 ${darkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* HEADER */}
      <div className={`pt-14 pb-36 px-6 rounded-b-[4rem] shadow-lg relative z-20 transition-colors ${darkMode ? 'bg-slate-800' : 'bg-sky-500'}`}>
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3"><div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-sky-500 font-black shadow-lg">F</div><h1 className="text-white font-black text-2xl italic tracking-tighter">FinansialKu.</h1></div>
          <div className="flex gap-2">
            <button onClick={() => setLang(lang === "id" ? "en" : "id")} className="text-white/90 p-2.5 bg-white/10 rounded-2xl active:scale-90 font-bold text-xs uppercase flex items-center gap-2"><Globe size={18}/> {lang}</button>
            <button onClick={() => setDarkMode(!darkMode)} className="text-white/90 p-2.5 bg-white/10 rounded-2xl active:scale-90">{darkMode ? <Sun size={20}/> : <Moon size={20}/>}</button>
            <button onClick={() => signOut(auth)} className="text-white/90 p-2.5 bg-white/10 rounded-2xl active:scale-90"><LogOut size={20}/></button>
          </div>
        </div>
        <div className="flex justify-around text-white/90 text-[10px] font-black uppercase tracking-widest">
          <button onClick={() => setActiveTab("home")} className={`${activeTab === 'home' ? 'border-b-2 border-white pb-1.5' : 'opacity-60'}`}>{t.home}</button>
          <button onClick={() => setActiveTab("profile")} className={`${activeTab === 'profile' ? 'border-b-2 border-white pb-1.5' : 'opacity-60'}`}>{t.profile}</button>
        </div>
      </div>

      <div className="flex-1 px-5 -mt-24 z-30 pb-32 overflow-y-auto no-scrollbar">
        {activeTab === "home" && (
            <div className="space-y-6 animate-in fade-in duration-500">
                {/* BALANCE CARD */}
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
                                <button onClick={() => setShowBalance(!showBalance)} className="text-slate-300 hover:text-sky-500 transition-colors p-2 shrink-0">{showBalance ? <EyeOff size={20}/> : <Eye size={20}/>}</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="grid grid-cols-4 gap-2">
                    <button onClick={() => setShowScanner(true)} className="bg-indigo-500 text-white p-3 rounded-2xl flex flex-col items-center gap-2 font-black text-[7px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"><Camera size={20}/> SCAN</button>
                    <button onClick={() => setShowTransferModal(true)} className="bg-teal-500 text-white p-3 rounded-2xl flex flex-col items-center gap-2 font-black text-[7px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"><ArrowRightLeft size={20}/> TRANSFER</button>
                    <button onClick={() => setActiveTab("wallet")} className="bg-sky-500 text-white p-3 rounded-2xl flex flex-col items-center gap-2 font-black text-[7px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"><WalletIcon size={20}/> WALLET</button>
                    <button onClick={() => setShowExportModal(true)} className="bg-orange-500 text-white p-3 rounded-2xl flex flex-col items-center gap-2 font-black text-[7px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"><FileText size={20}/> REPORT</button>
                </div>

                <div className="space-y-4">
                    <h3 className="font-black text-xs px-2 opacity-50 uppercase italic tracking-widest">Monthly Budget Control</h3>
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 px-1">
                        {categoryStats.filter(c => c.limit > 0).map(cat => (
                            <div key={cat.id} className={`flex-shrink-0 w-52 p-6 rounded-[2.5rem] border transition-all ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white shadow-lg'}`}>
                                <div className="flex justify-between items-start mb-3 gap-2"><div className="font-black text-sky-500 uppercase text-[11px] truncate tracking-tighter">{cat.name}</div>{cat.remaining < 0 && <AlertTriangle size={16} className="text-red-500 animate-pulse shrink-0"/>}</div>
                                <div className="space-y-1 mb-4">
                                    <div className="flex justify-between items-baseline"><span className="text-[9px] font-bold opacity-40 uppercase">Spent</span><span className="text-xs font-black">Rp {formatRupiah(cat.spent)}</span></div>
                                    <div className="flex justify-between items-baseline"><span className="text-[9px] font-bold opacity-40 uppercase">{t.remaining}</span><span className={`text-[11px] font-black ${cat.remaining < 0 ? 'text-red-500' : 'text-green-500'}`}>{cat.remaining < 0 ? "-" : ""}Rp {formatRupiah(cat.remaining)}</span></div>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden mb-3"><div className={`h-full transition-all duration-1000 ${cat.remaining < 0 ? 'bg-red-500' : 'bg-sky-500'}`} style={{width: `${Math.min(100, (cat.spent/cat.limit)*100)}%`}}></div></div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center px-2">
                        <h3 className="font-black text-xs opacity-50 uppercase italic tracking-widest">{t.activity}</h3>
                        <button onClick={() => setShowAllHistory(!showAllHistory)} className="text-[10px] font-black text-sky-500 uppercase flex items-center gap-1">{showAllHistory ? t.showLess : t.seeAll} {showAllHistory ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}</button>
                    </div>
                    <div className="space-y-3">
                        {displayedTransactions.map(tr => (
                            <div key={tr.id} className={`p-4 rounded-[2rem] flex justify-between items-center border transition-all ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-50 shadow-sm'}`}>
                                <div className="flex items-center gap-4 min-w-0 flex-1"><div className={`w-10 h-10 flex-shrink-0 rounded-2xl flex items-center justify-center ${tr.type === 'income' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>{tr.type === 'income' ? <ArrowUpCircle size={20}/> : <ArrowDownCircle size={20}/>}</div><div className="min-w-0"><p className="font-black text-sm text-sky-500 uppercase truncate">{tr.category}</p><p className="text-[8px] text-slate-400 font-bold uppercase truncate">{wallets.find(w => w.id === tr.walletId)?.name || 'Wallet'}</p></div></div>
                                <div className="flex items-center gap-3"><p className={`font-black text-sm whitespace-nowrap ${tr.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>{showBalance ? `${tr.type === 'income' ? '+' : '-'}Rp ${formatRupiah(tr.amount)}` : "Rp ••••••"}</p><button onClick={async () => {if(window.confirm("Hapus?")) await deleteDoc(doc(db, "transactions", tr.id))}} className="text-slate-300 hover:text-red-500 transition-all"><Trash2 size={16}/></button></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* --- IMPROVED WALLET TAB --- */}
{/* --- FIXED WALLET TAB (LIGHT MODE OPTIMIZED) --- */}
{/* --- FIXED WALLET TAB (ULTRA CONTRAST LIGHT MODE) --- */}
{/* --- ULTRA SHARP WALLET TAB (LIGHT MODE OPTIMIZED) --- */}
{activeTab === "wallet" && (
    <div className="space-y-6 animate-in slide-in-from-right duration-500 pb-10">
        {/* Total Assets Summary */}
        <div className={`px-5 py-6 rounded-[2.5rem] mb-6 border-2 transition-all ${
    darkMode 
    ? 'bg-slate-800/40 border-slate-700' 
    : 'bg-sky-50 border-sky-100 shadow-sm'
}`}>
    <p className={`text-[12px] font-black uppercase tracking-[0.25em] mb-2 ${
        darkMode ? 'text-slate-400' : 'text-sky-900'
    }`}>
        Total Aset Keseluruhan
    </p>
    <div className="flex items-center gap-3">
        <h2 className={`text-4xl font-black italic tracking-tighter ${
            darkMode ? 'text-sky-400' : 'text-sky-700'
        }`}>
            Rp {formatRupiah(stats.balance)}
        </h2>
        <div className={`w-3 h-3 rounded-full shadow-sm ${
            stats.balance >= 0 ? 'bg-green-500' : 'bg-red-500'
        } animate-pulse`}></div>
    </div>
</div>

        {/* Wallet Cards Stack */}
        <div className="space-y-4">
            <div className="flex justify-between items-center px-2">
                <h3 className={`font-black text-[10px] uppercase italic tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    {t.myWallets}
                </h3>
                <button 
                    onClick={() => setShowAddWallet(true)} 
                    className="bg-sky-500 text-white p-2 rounded-xl shadow-lg active:scale-90 transition-all"
                >
                    <Plus size={20}/>
                </button>
            </div>

            <div className="grid gap-5">
                {walletData.map((w) => (
                    <div 
                        key={w.id} 
                        className={`group relative p-7 rounded-[2.5rem] border-2 overflow-hidden transition-all duration-300 shadow-2xl ${
                            darkMode 
                            ? 'bg-slate-800 border-slate-700 text-white shadow-slate-950/50' 
                            : 'bg-white border-slate-100 text-slate-900 shadow-slate-200/80'
                        }`}
                    >
                        {/* Decorative Background Decor */}
                        <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl transition-all ${
                            darkMode ? 'bg-sky-500/10' : 'bg-sky-500/10'
                        }`}></div>
                        
                        <div className="flex justify-between items-start relative z-10">
                            <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl ${
                                    darkMode ? 'bg-slate-900 text-sky-400' : 'bg-gradient-to-br from-sky-500 to-indigo-600 text-white'
                                }`}>
                                    {w.type === 'bank' ? <Landmark size={26}/> : w.type === 'ewallet' ? <CreditCard size={26}/> : <Coins size={26}/>}
                                </div>
                                <div>
                                    <h4 className={`font-black text-base uppercase tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                        {w.name}
                                    </h4>
                                    <p className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div> Akun Terverifikasi
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={async () => { if(window.confirm(`Hapus ${w.name}?`)) await deleteDoc(doc(db,"wallets",w.id)) }}
                                className={`p-2 transition-colors ${darkMode ? 'text-red-500/30 hover:text-red-500' : 'text-slate-300 hover:text-red-500'}`}
                            >
                                <Trash2 size={20}/>
                            </button>
                        </div>

                        <div className="mt-10 flex justify-between items-end relative z-10">
                            <div>
                                <p className={`text-[10px] font-black uppercase mb-1.5 tracking-tighter ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                    Saldo Tersedia
                                </p>
                                <p className={`text-2xl font-black italic tracking-tighter leading-none ${darkMode ? 'text-sky-400' : 'text-sky-600'}`}>
                                    Rp {formatRupiah(w.balance)}
                                </p>
                            </div>
                            
                            <button 
                                onClick={() => { setShowTransferModal(true); setTransferForm({...transferForm, fromWalletId: w.id}); }}
                                className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase transition-all active:scale-95 shadow-lg ${
                                    darkMode 
                                    ? 'bg-slate-700 text-white' 
                                    : 'bg-slate-900 text-white hover:bg-black'
                                }`}
                            >
                                Transfer
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
)}

        {/* --- IMPROVED CATEGORY TAB --- */}
        {activeTab === "category" && (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
                <div className="flex justify-between items-center px-2">
                    <h2 className="font-black italic text-xl uppercase tracking-tighter">{t.catTitle}</h2>
                </div>
                
                {/* Add New Category Section */}
                <div className={`p-6 rounded-[2.5rem] border shadow-xl ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-50'}`}>
                    <div className="space-y-4">
                        <input 
                            value={newCatName} 
                            onChange={(e) => setNewCatName(e.target.value)} 
                            className={`w-full p-4 rounded-2xl outline-none text-xs font-black border dark:bg-slate-700 dark:border-slate-600 transition-all focus:ring-2 focus:ring-sky-500 ${darkMode ? 'bg-slate-700' : 'bg-slate-50'}`} 
                            placeholder="Nama Kategori Baru" 
                        />
                        <div className="flex gap-2">
                            <input 
                                value={newCatLimit} 
                                onChange={(e) => setNewCatLimit(e.target.value)} 
                                type="number" 
                                className={`flex-1 p-4 rounded-2xl outline-none text-xs font-black border dark:bg-slate-700 dark:border-slate-600 transition-all focus:ring-2 focus:ring-sky-500 ${darkMode ? 'bg-slate-700' : 'bg-slate-50'}`} 
                                placeholder="Limit Budget Rp" 
                            />
                            <button 
                                onClick={async () => {
                                    if(!newCatName) return; 
                                    await addDoc(collection(db, "categories"), { 
                                        name: newCatName, 
                                        limit: Number(newCatLimit) || 0, 
                                        userId: user.uid, 
                                        createdAt: new Date() 
                                    }); 
                                    setNewCatName(""); 
                                    setNewCatLimit("");
                                }} 
                                className="bg-sky-500 text-white px-6 rounded-2xl active:scale-90 shadow-lg transition-all"
                            >
                                <PlusCircle size={22}/>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Categories List */}
                <div className="space-y-4">
                    {categoryStats.map(c => {
                        const isOver = c.limit > 0 && c.spent >= c.limit;
                        const percentage = c.limit > 0 ? Math.round((c.spent/c.limit)*100) : 0;
                        
                        return (
                            <div key={c.id} className={`p-5 rounded-[2.5rem] border shadow-sm transition-all ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-50'}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-slate-700' : 'bg-sky-50'} text-sky-500`}>
                                            <Layers size={18}/>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-widest block opacity-50">Category</span>
                                            <span className="text-sm font-black uppercase text-sky-500">{c.name}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => { setEditingCategoryId(c.id); setTempLimit(c.limit); }} className="p-2 text-slate-400 hover:text-sky-500 transition-colors"><Edit3 size={16}/></button>
                                        <button onClick={async () => { if(window.confirm("Hapus kategori?")) await deleteDoc(doc(db, "categories", c.id)) }} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                                    </div>
                                </div>

                                {editingCategoryId === c.id ? (
                                    <div className="flex gap-2 mt-2 animate-in slide-in-from-top">
                                        <input 
                                            type="number" 
                                            value={tempLimit} 
                                            onChange={(e) => setTempLimit(e.target.value)} 
                                            className="flex-1 p-2 rounded-xl text-xs font-black border dark:bg-slate-700 outline-none focus:ring-1 focus:ring-sky-500" 
                                            placeholder="Update Limit..."
                                        />
                                        <button onClick={() => handleUpdateLimit(c.id)} className="bg-green-500 text-white p-2 rounded-xl active:scale-90"><Check size={16}/></button>
                                        <button onClick={() => setEditingCategoryId(null)} className="bg-slate-200 text-slate-500 p-2 rounded-xl active:scale-90"><X size={16}/></button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-[8px] font-black opacity-40 uppercase">Spent / Limit</p>
                                                <p className="text-[10px] font-black">
                                                    Rp {formatRupiah(c.spent)} <span className="opacity-30">/</span> <span className="text-sky-500">Rp {formatRupiah(c.limit)}</span>
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-[12px] font-black ${isOver ? 'text-red-500 animate-pulse' : 'text-sky-500'}`}>
                                                    {percentage}%
                                                </p>
                                            </div>
                                        </div>
                                        <div className="w-full bg-slate-100 dark:bg-slate-700 h-3 rounded-full overflow-hidden shadow-inner">
                                            <div 
                                                className={`h-full transition-all duration-1000 ${isOver ? 'bg-red-500' : 'bg-sky-500'}`} 
                                                style={{ width: `${Math.min(100, percentage)}%` }}
                                            ></div>
                                        </div>
                                        {isOver && (
                                            <div className="flex items-center gap-1 text-red-500">
                                                <AlertTriangle size={12}/>
                                                <span className="text-[8px] font-black uppercase tracking-tighter">Budget Exceeded by Rp {formatRupiah(Math.abs(c.remaining))}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        {/* --- POWERFULL PROFILE TAB --- */}
  {activeTab === "profile" && (
      <div className="space-y-6 animate-in slide-in-from-right duration-500">
          {/* Profile Identity Card */}
          <div className={`p-8 rounded-[3rem] border shadow-2xl relative overflow-hidden transition-all ${
              darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-50'
          }`}>
              {/* Background Decor */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
              
              <div className="flex flex-col items-center text-center relative z-10">
                  <div className="w-28 h-28 bg-gradient-to-tr from-sky-500 to-indigo-600 mb-4 rounded-[2.5rem] flex items-center justify-center text-white border-4 border-white dark:border-slate-700 shadow-2xl relative">
                      <User size={48}/>
                      <div className={`absolute -bottom-2 -right-2 w-12 h-12 rounded-full border-4 border-white dark:border-slate-800 flex flex-col items-center justify-center text-[10px] font-black text-white shadow-lg ${
                          healthScore > 60 ? 'bg-green-500' : 'bg-orange-500'
                      }`}>
                          <span>{healthScore}%</span>
                      </div>
                  </div>
                  <h2 className="font-black text-2xl mb-1 tracking-tighter italic uppercase">{user.displayName || "User Finansial"}</h2>
                  <p className="text-slate-400 text-[10px] font-bold tracking-[0.2em] uppercase truncate max-w-full px-4">{user.email}</p>
              </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-100 dark:border-slate-700">
                <div className="text-left">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Financial Health</p>
                    <p className={`font-black text-sm italic ${healthScore > 60 ? 'text-green-500' : 'text-orange-500'}`}>
                        {healthScore > 80 ? 'EXCELLENT' : healthScore > 50 ? 'STABLE' : 'WARNING'}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Activity</p>
                    <p className="font-black text-sm text-sky-500 italic">{allTransactions.length} Transactions</p>
                </div>
            </div>
        </div>

        {/* Insights Section */}
        {topSpendingCategory && (
            <div className={`p-5 rounded-[2.5rem] border flex items-center justify-between ${
                darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-orange-50 border-orange-100'
            }`}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                        <TrendingDown size={20}/>
                    </div>
                    <div>
                        <p className="text-[8px] font-black text-orange-500 uppercase tracking-widest leading-none mb-1">Top Spending</p>
                        <p className="font-black text-xs uppercase italic">{topSpendingCategory.name}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="font-black text-sm text-orange-600">Rp {formatRupiah(topSpendingCategory.spent)}</p>
                </div>
            </div>
        )}

        {/* Menu Options Group */}
        <div className="space-y-4">
            <div className="space-y-2">
                <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Preferences</p>
                <div className={`rounded-[2.5rem] p-4 space-y-1 shadow-sm border ${
                    darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-50'
                }`}>
                    {/* Language Switch */}
                    <button onClick={() => setLang(lang === 'id' ? 'en' : 'id')} className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-2xl transition-all">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-sky-100 dark:bg-sky-500/20 text-sky-500 rounded-xl flex items-center justify-center"><Languages size={18}/></div>
                            <span className="text-xs font-black uppercase tracking-tight">Language / Bahasa</span>
                        </div>
                        <span className="text-[10px] font-black text-sky-500 uppercase bg-sky-500/10 px-3 py-1 rounded-lg">{lang === 'id' ? 'ID' : 'EN'}</span>
                    </button>

                    {/* Theme Switch */}
                    <button onClick={() => setDarkMode(!darkMode)} className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-2xl transition-all">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 rounded-xl flex items-center justify-center">
                                {darkMode ? <Moon size={18}/> : <Sun size={18}/>}
                            </div>
                            <span className="text-xs font-black uppercase tracking-tight">Appearance</span>
                        </div>
                        <div className={`w-10 h-5 rounded-full relative transition-all ${darkMode ? 'bg-sky-500' : 'bg-slate-200'}`}>
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${darkMode ? 'left-6' : 'left-1'}`}></div>
                        </div>
                    </button>

                    {/* Export PDF */}
                    <button onClick={() => setShowExportModal(true)} className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-2xl transition-all">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-500/20 text-orange-600 rounded-xl flex items-center justify-center"><Database size={18}/></div>
                            <span className="text-xs font-black uppercase tracking-tight">Export Transaction</span>
                        </div>
                        <ChevronRight size={16} className="text-slate-300"/>
                    </button>
                </div>
            </div>

            {/* Logout Button */}
            <button 
                onClick={() => signOut(auth)} 
                className="w-full p-6 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-[2.5rem] font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-sm border border-red-100 dark:border-red-500/20"
            >
                <LogOut size={18}/> Logout Account
            </button>
        </div>
        
        {/* Footer Credit */}
        <p className="text-center text-[8px] font-black opacity-20 uppercase tracking-[0.5em] pb-10">FinansialKu v2.0 • Premium Edition</p>
    </div>
)}
      </div>

      {/* NAVIGATION */}
      <div className={`fixed bottom-0 left-0 right-0 px-2 py-4 z-50 rounded-t-[3rem] shadow-2xl border-t ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
        <div className="grid grid-cols-5 items-center w-full text-center">
          <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center transition-all ${activeTab === 'home' ? 'text-sky-500 scale-110' : 'opacity-30'}`}><Home size={22}/> <span className="text-[8px] font-black uppercase">{t.home}</span></button>
          <button onClick={() => setActiveTab('category')} className={`flex flex-col items-center transition-all ${activeTab === 'category' ? 'text-orange-500 scale-110' : 'opacity-30'}`}><Tag size={22}/> <span className="text-[8px] font-black uppercase">Tag</span></button>
          <div className="flex justify-center -mt-12"><button onClick={() => setShowAddTransaction(true)} className="w-14 h-14 bg-sky-500 rounded-full flex items-center justify-center text-white border-4 border-white shadow-xl active:scale-90 transition-all"><PlusCircle size={28}/></button></div>
          <button onClick={() => setActiveTab('wallet')} className={`flex flex-col items-center transition-all ${activeTab === 'wallet' ? 'text-sky-500 scale-110' : 'opacity-30'}`}><WalletIcon size={22}/> <span className="text-[8px] font-black uppercase">Wallet</span></button>
          <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center transition-all ${activeTab === 'profile' ? 'text-sky-500 scale-110' : 'opacity-30'}`}><User size={22}/> <span className="text-[8px] font-black uppercase">User</span></button>
        </div>
      </div>

      {/* MODAL REPORT */}
      {showExportModal && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in zoom-in duration-300">
          <div className={`w-full max-w-sm p-10 rounded-[3.5rem] shadow-2xl ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-8 italic font-black text-orange-500 text-lg text-lg tracking-tighter uppercase tracking-tighter"><h2>{t.report}</h2><button onClick={() => setShowExportModal(false)}><X/></button></div>
            <div className="space-y-5">
              <div className="space-y-1"><p className="text-[10px] font-black opacity-30 ml-2 uppercase tracking-widest">Mulai</p><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={`w-full p-4 rounded-2xl outline-none text-xs font-black border ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50'}`} /></div>
              <div className="space-y-1"><p className="text-[10px] font-black opacity-30 ml-2 uppercase tracking-widest">Sampai</p><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={`w-full p-4 rounded-2xl outline-none text-xs font-black border ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50'}`} /></div>
              <button onClick={exportPDF} className="w-full bg-orange-500 hover:bg-orange-600 text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] active:scale-95 flex items-center justify-center gap-2 mt-4 shadow-lg shadow-orange-500/30 transition-all cursor-pointer">
                <FileText size={16}/> {t.downloadBtn}
              </button>
            </div>
          </div>
        </div>
      )}

 {/* --- MODAL ADD WALLET WITH MODERN DROPDOWN --- */}
{showAddWallet && (
  <div className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in zoom-in duration-300">
    <div className={`w-full max-w-sm p-10 rounded-[3.5rem] shadow-2xl ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
      <div className="flex justify-between items-center mb-8">
        <h2 className="font-black italic text-sky-500 text-lg uppercase tracking-tighter">New Wallet</h2>
        <button onClick={() => setShowAddWallet(false)} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full active:scale-90"><X size={18}/></button>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nama Dompet</p>
            <input 
              value={newWalletName} 
              onChange={(e) => setNewWalletName(e.target.value)} 
              className={`w-full p-5 rounded-[2rem] outline-none text-sm font-black border transition-all ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-100 focus:border-sky-500'}`} 
              placeholder="Contoh: BCA Personal" 
            />
        </div>

        <div className="space-y-2 relative">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Tipe Akun</p>
          <div className="grid grid-cols-1 gap-2">
            {/* Custom Dropdown / Segmented Control */}
            <div className={`p-1.5 rounded-[2rem] flex gap-1 ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
                {['bank', 'ewallet', 'cash'].map((type) => (
                    <button
                        key={type}
                        onClick={() => setNewWalletType(type)}
                        className={`flex-1 py-3 rounded-[1.5rem] text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${
                            newWalletType === type 
                            ? 'bg-sky-500 text-white shadow-lg' 
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        {type === 'bank' && <Landmark size={14}/>}
                        {type === 'ewallet' && <CreditCard size={14}/>}
                        {type === 'cash' && <Coins size={14}/>}
                        {type}
                    </button>
                ))}
            </div>
          </div>
        </div>

        <button 
          onClick={async () => {
            if(newWalletName){
              await addDoc(collection(db, "wallets"), { name: newWalletName, type: newWalletType, userId: user.uid, createdAt: new Date() }); 
              setNewWalletName(""); 
              setShowAddWallet(false);
            }
          }} 
          className="w-full bg-sky-500 text-white py-5 rounded-[2rem] font-black uppercase text-xs active:scale-95 shadow-xl shadow-sky-500/20 transition-all mt-4"
        >
          SIMPAN DOMPET
        </button>
      </div>
    </div>
  </div>
)}

      {/* MODAL ADD TRANSACTION */}
      {showAddTransaction && (
        <div className={`fixed inset-0 z-[100] flex flex-col animate-in slide-in-from-bottom duration-300 ${darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-800'}`}>
          <div className="flex items-center justify-between p-6 shrink-0"><button onClick={() => setShowAddTransaction(false)} className={`p-3 rounded-full ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}><ChevronLeft size={20}/></button><h2 className="font-black text-lg text-sky-500 uppercase italic tracking-tighter">Add {form.type.toUpperCase()}</h2><div className="w-10"></div></div>
          <div className="px-6 mb-4 shrink-0"><div className={`${darkMode ? 'bg-slate-800' : 'bg-slate-100'} p-1 rounded-3xl flex`}><button onClick={() => setForm({...form, type: 'expense'})} className={`flex-1 py-3 rounded-2xl text-xs font-black transition-all ${form.type === 'expense' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400'}`}>EXPENSE</button><button onClick={() => setForm({...form, type: 'income'})} className={`flex-1 py-3 rounded-2xl text-xs font-black transition-all ${form.type === 'income' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400'}`}>INCOME</button></div></div>
          <div className="flex flex-col items-center mb-4 shrink-0 px-6"><h1 className="text-4xl font-black tracking-tighter mb-1 text-sky-500 truncate w-full text-center">Rp {form.amount ? formatRupiah(form.amount) : "0"}</h1><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Confirm Amount</p></div>
          <div className="flex-1 overflow-y-auto px-6 space-y-6 no-scrollbar pb-10">
            <div className="space-y-3"><div className="flex justify-between items-center px-2"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategori</p><button onClick={() => setShowInlineCatInput(!showInlineCatInput)} className="text-sky-500 p-1 hover:bg-sky-500/10 rounded-lg">{showInlineCatInput ? <X size={16}/> : <Plus size={16}/>}</button></div>{showInlineCatInput && (<div className="flex gap-2 animate-in slide-in-from-top duration-200"><input autoFocus value={inlineValue} onChange={(e) => setInlineValue(e.target.value)} className="flex-1 p-3 rounded-xl text-xs font-black border outline-none dark:bg-slate-800 dark:border-slate-700" placeholder="Kategori baru..." /><button onClick={() => handleQuickAdd('cat')} className="bg-sky-500 text-white p-3 rounded-xl"><ShieldCheck size={18}/></button></div>)}<div className="flex flex-wrap gap-2">{categories.map(c => (<button key={c.id} onClick={() => setForm({...form, category: c.name})} className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[10px] font-black border transition-all ${form.category === c.name ? 'bg-sky-600 text-white border-sky-600 shadow-md' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'}`}><Tag size={12}/> {c.name.toUpperCase()}</button>))}</div></div>
            <div className="space-y-3"><div className="flex justify-between items-center px-2"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Wallet</p><button onClick={() => setShowInlineWalletInput(!showInlineWalletInput)} className="text-sky-500 p-1 hover:bg-sky-500/10 rounded-lg">{showInlineWalletInput ? <X size={16}/> : <Plus size={16}/>}</button></div>{showInlineWalletInput && (<div className="flex gap-2 animate-in slide-in-from-top duration-200"><input autoFocus value={inlineValue} onChange={(e) => setInlineValue(e.target.value)} className="flex-1 p-3 rounded-xl text-xs font-black border outline-none dark:bg-slate-800 dark:border-slate-700" placeholder="Dompet baru..." /><button onClick={() => handleQuickAdd('wallet')} className="bg-sky-500 text-white p-3 rounded-xl"><ShieldCheck size={18}/></button></div>)}<div className="flex flex-wrap gap-2">{wallets.map(w => (<button key={w.id} onClick={() => setForm({...form, walletId: w.id})} className={`px-4 py-2.5 rounded-2xl text-[10px] font-black border transition-all ${form.walletId === w.id ? 'bg-slate-800 dark:bg-white dark:text-slate-800 text-white border-slate-800 shadow-md' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'}`}>{w.name.toUpperCase()}</button>))}</div></div>
          </div>
          <div className={`shrink-0 ${darkMode ? 'bg-slate-800/80 backdrop-blur-md' : 'bg-slate-50'} border-t border-slate-200`}><div className="grid grid-cols-3 gap-1 p-2">{[1, 2, 3, 4, 5, 6, 7, 8, 9, "00", 0].map(n => (<button key={n} type="button" onClick={() => handleNumpad(n.toString())} className="py-4 text-xl font-black transition-all rounded-xl">{n}</button>))}<button type="button" onClick={() => handleNumpad("delete")} className="py-4 flex items-center justify-center text-red-500 rounded-xl transition-all"><Delete size={24}/></button></div><div className="px-4 pb-6 pt-2"><button onClick={handleSubmit} className="w-full bg-sky-500 text-white py-5 rounded-[2rem] font-black uppercase text-xs shadow-xl flex items-center justify-center gap-3"><ShieldCheck size={18}/> {t.save}</button></div></div>
        </div>
      )}

      {/* MODAL TRANSFER */}
      {showTransferModal && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-in zoom-in duration-300">
          <div className={`w-full max-w-sm rounded-[3.5rem] shadow-2xl overflow-hidden ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white'}`}>
             <div className="p-8 pb-0 flex justify-between items-center italic font-black text-teal-500 text-lg uppercase tracking-tighter uppercase tracking-tighter">
                <h2>Transfer Dana</h2>
                <button onClick={() => setShowTransferModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-all"><X size={20}/></button>
             </div>
             <div className="p-8 pt-6 space-y-6">
                <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nominal Transfer</p>
                    <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-sky-500 text-sm italic">Rp</span>
                        <input type="text" value={transferForm.amount ? formatRupiah(transferForm.amount) : ""} onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '');
                            setTransferForm({...transferForm, amount: raw});
                        }} className={`w-full py-5 pl-12 pr-6 rounded-[2rem] outline-none text-sm font-black border transition-all ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-100'}`} placeholder="0" />
                    </div>
                </div>
                <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Dari Dompet Asal</p>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 px-1">
                        {walletData.map(w => (
                            <button key={w.id} onClick={() => setTransferForm({...transferForm, fromWalletId: w.id})} className={`flex-shrink-0 p-4 rounded-3xl border text-left transition-all min-w-[130px] ${transferForm.fromWalletId === w.id ? 'bg-sky-500 border-sky-500 shadow-lg shadow-sky-500/20' : 'bg-slate-50 dark:bg-slate-700 border-transparent opacity-60'}`}>
                                <p className={`text-[8px] font-black uppercase mb-1 ${transferForm.fromWalletId === w.id ? 'text-white/60' : 'text-slate-400'}`}>{w.name}</p>
                                <p className={`text-[10px] font-black ${transferForm.fromWalletId === w.id ? 'text-white' : 'text-sky-500'}`}>Rp {formatRupiah(w.balance)}</p>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex justify-center py-0"><div className="w-10 h-10 bg-teal-500/10 text-teal-500 rounded-full flex items-center justify-center animate-bounce shadow-sm"><ArrowDown size={20}/></div></div>
                <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Tujuan Dompet</p>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 px-1">
                        {walletData.map(w => (
                            <button key={w.id} onClick={() => setTransferForm({...transferForm, toWalletId: w.id})} disabled={w.id === transferForm.fromWalletId} className={`flex-shrink-0 p-4 rounded-3xl border text-left transition-all min-w-[130px] ${w.id === transferForm.fromWalletId ? 'opacity-20 grayscale cursor-not-allowed' : transferForm.toWalletId === w.id ? 'bg-teal-500 border-teal-500 shadow-lg shadow-teal-500/20' : 'bg-slate-50 dark:bg-slate-700 border-transparent opacity-60'}`}>
                                <p className={`text-[8px] font-black uppercase mb-1 ${transferForm.toWalletId === w.id ? 'text-white/60' : 'text-slate-400'}`}>{w.name}</p>
                                <p className={`text-[10px] font-black ${transferForm.toWalletId === w.id ? 'text-white' : 'text-sky-500'}`}>Rp {formatRupiah(w.balance)}</p>
                            </button>
                        ))}
                    </div>
                </div>
                <button onClick={handleTransfer} disabled={!transferForm.amount || !transferForm.fromWalletId || !transferForm.toWalletId} className={`w-full py-5 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-3 mt-4 ${(!transferForm.amount || !transferForm.fromWalletId || !transferForm.toWalletId) ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-teal-500 text-white shadow-xl shadow-teal-500/30 active:scale-95'}`}>
                    <ArrowRightLeft size={16}/> Konfirmasi Transfer
                </button>
             </div>
          </div>
        </div>
      )}

      {/* MODAL SCANNER */}
      {showScanner && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in zoom-in duration-300"><div className={`w-full max-w-sm p-10 rounded-[3.5rem] text-center ${darkMode ? 'bg-slate-800' : 'bg-white'}`}><div className="flex justify-between items-center mb-8 italic font-black text-indigo-500 text-lg uppercase tracking-tighter uppercase tracking-tighter"><h2>{t.scannerTitle}</h2><button onClick={() => setShowScanner(false)}><X/></button></div><div className={`w-full aspect-square rounded-[3rem] border-4 border-dashed mb-8 flex flex-col items-center justify-center gap-4 ${isScanning ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-200 opacity-50'}`}>{isScanning ? <><Loader2 size={50} className="text-indigo-500 animate-spin" /><p className="text-xs font-black uppercase tracking-widest animate-pulse">Scanning Bill...</p></> : <><Camera size={50} className="text-slate-300" /><p className="text-[10px] font-bold px-6 text-slate-400">Pilih foto struk belanja lo bro</p></>}</div><label className={`w-full flex items-center justify-center gap-3 py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-widest transition-all cursor-pointer ${isScanning ? 'bg-slate-300 pointer-events-none' : 'bg-indigo-500 text-white shadow-xl shadow-indigo-500/20'}`}><Sparkles size={16}/> {isScanning ? 'Processing...' : 'Select Photo'}<input type="file" accept="image/*" className="hidden" onChange={(e) => handleScanFile(e)} disabled={isScanning} /></label></div></div>
      )}
    </div>
  );
}

export default App;