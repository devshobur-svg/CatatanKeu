import React, { useState, useEffect, useMemo, useRef } from "react";
import { auth, db } from "./lib/firebase";
import { onAuthStateChanged, signOut, setPersistence, browserLocalPersistence, updateProfile } from "firebase/auth";
import { 
  collection, addDoc, onSnapshot, query, where, 
  orderBy, deleteDoc, doc, updateDoc 
} from "firebase/firestore";
import { 
  PlusCircle, ArrowUpCircle, ArrowDownCircle, 
  LogOut, Trash2, Wallet as WalletIcon, X, Sun, Moon, 
  FileText, Home, User, ChevronLeft, Tag, Languages, Eye, EyeOff, Delete, Globe, AlertTriangle, ChevronDown, ChevronUp, Camera, Sparkles, Loader2, ChevronRight, ShieldCheck, Database, Landmark, CreditCard, Coins, TrendingDown, Layers, Edit3, Check, ArrowRightLeft, ArrowDown, Plus
} from "lucide-react";
import { createWorker } from 'tesseract.js'; 
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Login from "./pages/Login";

const TRANSLATIONS = {
  id: {
    income: "Pemasukan", expense: "Pengeluaran", activity: "Aktivitas Hari Ini", report: "Laporan",
    wallet: "Wallet", profile: "Profil", home: "Beranda", save: "Simpan Transaksi",
    totalBalance: "Total Saldo", scannerTitle: "Smart Bill Scanner", downloadBtn: "Download PDF",
    langName: "Indonesia", seeAll: "Lihat Semua", showLess: "Sembunyikan", account: "Akun",
    preferences: "Preferensi", exportData: "Ekspor Data", transfer: "Transfer", remaining: "Sisa",
    myWallets: "Dompet Saya", healthScore: "Kesehatan Keuangan", topSpending: "Pengeluaran Terbesar", catTitle: "Kategori & Budget",
    note: "Catatan", allWallets: "Semua Dompet", allCats: "Semua Kategori"
  },
  en: {
    income: "Income", expense: "Expense", activity: "Today's Activity", report: "Report",
    wallet: "Wallet", profile: "Profile", home: "Home", save: "Save Transaction",
    totalBalance: "Total Balance", scannerTitle: "Smart Bill Scanner", downloadBtn: "Download PDF",
    langName: "English", seeAll: "See All", showLess: "Show Less", account: "Account",
    preferences: "Preferences", exportData: "Export Data", transfer: "Transfer", remaining: "Remaining",
    myWallets: "My Wallets", healthScore: "Financial Health", topSpending: "Top Spending", catTitle: "Category & Budget",
    note: "Note", allWallets: "All Wallets", allCats: "All Categories"
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
  const [filterWallet, setFilterWallet] = useState("all");
  const [filterCat, setFilterCat] = useState("all");
  const [exportWalletFilter, setExportWalletFilter] = useState("all");
  const [newCatName, setNewCatName] = useState("");
  const [newCatLimit, setNewCatLimit] = useState("");
  const [newWalletName, setNewWalletName] = useState("");
  const [newWalletType, setNewWalletType] = useState("bank");
  const [form, setForm] = useState({ amount: "", category: "", type: "expense", walletId: "", note: "" });
  const [transferForm, setTransferForm] = useState({ amount: "", fromWalletId: "", toWalletId: "" });
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [tempLimit, setTempLimit] = useState("");
  const [toast, setToast] = useState({ show: false, msg: "", type: "error" });

  const t = TRANSLATIONS[lang];
  const formatRupiah = (v) => (!v && v !== 0) ? "0" : Number(v.toString().replace(/\D/g, '')).toLocaleString('id-ID');

  const showNotice = (msg, type = "error") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast(p => ({ ...p, show: false })), 3000);
  };

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    localStorage.setItem("fin_lang", lang);
    localStorage.setItem("fin_dark", darkMode);
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [lang, darkMode]);

  useEffect(() => {
    if (!user) return;
    const unsubW = onSnapshot(query(collection(db, "wallets"), where("userId", "==", user.uid)), (s) => setWallets(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubC = onSnapshot(query(collection(db, "categories"), where("userId", "==", user.uid), orderBy("name", "asc")), (s) => setCategories(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubT = onSnapshot(query(collection(db, "transactions"), where("userId", "==", user.uid), orderBy("createdAt", "desc")), (s) => setAllTransactions(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubW(); unsubC(); unsubT(); };
  }, [user]);

  const walletData = useMemo(() => {
    return wallets.map(w => {
      const bal = allTransactions.filter(t => t.walletId === w.id).reduce((a, b) => a + (b.type === 'income' ? Number(b.amount) : -Number(b.amount)), 0);
      return { ...w, balance: bal };
    });
  }, [wallets, allTransactions]);

  const stats = useMemo(() => {
    const inc = allTransactions.filter(tr => tr.type === 'income').reduce((a, b) => a + (Number(b.amount) || 0), 0);
    const exp = allTransactions.filter(tr => tr.type === 'expense').reduce((a, b) => a + (Number(b.amount) || 0), 0);
    return { income: inc, expense: exp, balance: inc - exp };
  }, [allTransactions]);

  const categoryStats = useMemo(() => {
    const now = new Date();
    return categories.map(cat => {
      const txs = allTransactions.filter(tr => {
        const trDate = tr.createdAt?.seconds ? new Date(tr.createdAt.seconds * 1000) : new Date();
        return tr.category === cat.name && tr.type === 'expense' && trDate.getMonth() === now.getMonth() && trDate.getFullYear() === now.getFullYear();
      });
      const totalSpent = txs.reduce((sum, tr) => sum + (Number(tr.amount) || 0), 0);
      const limit = Number(cat.limit) || 0;
      return { ...cat, spent: totalSpent, limit, remaining: limit - totalSpent };
    });
  }, [categories, allTransactions]);

  const displayedTransactions = useMemo(() => {
    let filtered = allTransactions.filter(tr => 
      tr.category.toLowerCase().includes(searchQuery.toLowerCase()) || tr.amount.toString().includes(searchQuery)
    );
    if (filterWallet !== "all") filtered = filtered.filter(tr => tr.walletId === filterWallet);
    if (filterCat !== "all") filtered = filtered.filter(tr => tr.category === filterCat);
    return showAllHistory ? filtered : filtered.slice(0, 5);
  }, [allTransactions, searchQuery, showAllHistory, filterWallet, filterCat]);

  const healthScore = useMemo(() => {
    if (stats.income === 0) return 0;
    return Math.round(Math.max(0, 100 - (stats.expense / stats.income * 100)));
  }, [stats]);

  const topSpendingCategory = useMemo(() => {
    const activeStats = categoryStats.filter(c => c.spent > 0);
    return activeStats.length === 0 ? null : [...activeStats].sort((a, b) => b.spent - a.spent)[0];
  }, [categoryStats]);

  const handleUpdatePhoto = async () => {
    const photoUrl = prompt("Masukkan URL Foto Profile:");
    if (!photoUrl || !auth.currentUser) return;
    try {
      await updateProfile(auth.currentUser, { photoURL: photoUrl });
      setUser({ ...auth.currentUser, photoURL: photoUrl });
      showNotice("Foto Profile diupdate!", "success");
    } catch (e) { showNotice("Gagal update foto."); }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let filteredData = allTransactions.filter(tr => {
      const trDate = tr.createdAt?.seconds ? new Date(tr.createdAt.seconds * 1000).toISOString().split('T')[0] : "";
      return trDate >= startDate && trDate <= endDate;
    });
    if (exportWalletFilter !== "all") filteredData = filteredData.filter(tr => tr.walletId === exportWalletFilter);
    filteredData.sort((a, b) => a.createdAt.seconds - b.createdAt.seconds);

    doc.setFillColor(14, 165, 233); doc.rect(0, 0, pageWidth, 50, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold"); doc.setFontSize(24); doc.text("FinansialKu.", 14, 25);
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.text("Electronic Transaction Statement", 14, 32);
    doc.text(`Nasabah: ${user.displayName || user.email}`, pageWidth - 14, 20, { align: 'right' });
    doc.text(`Periode: ${startDate} s/d ${endDate}`, pageWidth - 14, 26, { align: 'right' });

    doc.setFillColor(248, 250, 252); doc.roundedRect(14, 60, pageWidth - 28, 25, 3, 3, 'F');
    const totalIn = filteredData.filter(t => t.type === 'income').reduce((a,b) => a + Number(b.amount), 0);
    const totalOut = filteredData.filter(t => t.type === 'expense').reduce((a,b) => a + Number(b.amount), 0);
    doc.setTextColor(34, 197, 94); doc.text(`Total Masuk: Rp ${formatRupiah(totalIn)}`, 20, 77);
    doc.setTextColor(239, 68, 68); doc.text(`Total Keluar: Rp ${formatRupiah(totalOut)}`, pageWidth / 2, 77);

    autoTable(doc, {
      startY: 95,
      head: [['Tanggal', 'Keterangan', 'Kategori', 'Mutasi', 'Nominal']],
      body: filteredData.map(tr => [
        new Date(tr.createdAt.seconds * 1000).toLocaleDateString('id-ID'),
        tr.note || 'Transaksi Aplikasi',
        tr.category.toUpperCase(),
        tr.type === 'income' ? 'CR' : 'DB',
        `Rp ${Number(tr.amount).toLocaleString('id-ID')}`
      ]),
      theme: 'striped',
      headStyles: { fillColor: [51, 65, 85] }
    });
    doc.save(`E-Statement.pdf`);
    setShowExportModal(false);
  };

  const handleNumpad = (val) => {
    setForm(prev => (val === "delete" ? { ...prev, amount: prev.amount.slice(0, -1) } : prev.amount.length < 11 ? { ...prev, amount: prev.amount + val } : prev));
  };

  const handleSubmit = async () => {
    if (!form.amount || !form.category || !form.walletId) return showNotice("Data belum lengkap!");
    try {
      await addDoc(collection(db, "transactions"), { ...form, amount: Number(form.amount), userId: user.uid, createdAt: new Date() });
      showNotice("Berhasil disimpan!", "success");
      setShowAddTransaction(false);
      setForm({ amount: "", category: "", type: "expense", walletId: "", note: "" });
    } catch (e) { showNotice("Error Cloud!"); }
  };

  const handleTransfer = async () => {
    const rawAmt = Number(transferForm.amount.replace(/\D/g, ''));
    const fromW = walletData.find(w => w.id === transferForm.fromWalletId);
    if (!rawAmt || !fromW || rawAmt >= fromW.balance) return showNotice("Saldo tidak cukup!", "error");
    try {
      const now = new Date();
      await addDoc(collection(db, "transactions"), { amount: rawAmt, type: "expense", category: "TRANSFER", walletId: transferForm.fromWalletId, userId: user.uid, createdAt: now, note: "Transfer Out" });
      await addDoc(collection(db, "transactions"), { amount: rawAmt, type: "income", category: "TRANSFER", walletId: transferForm.toWalletId, userId: user.uid, createdAt: now, note: "Transfer In" });
      setShowTransferModal(false); setTransferForm({ amount: "", fromWalletId: "", toWalletId: "" });
      showNotice("Transfer berhasil!", "success");
    } catch (e) { showNotice("Gagal transfer."); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-sky-500 text-white font-black text-2xl animate-pulse italic">FINANSIALKU</div>;
  if (!user) return <Login />;

  return (
    <div className={`min-h-screen flex flex-col max-w-md mx-auto transition-all ${darkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-800'}`}>
      
      {toast.show && (
        <div className="fixed top-10 left-0 right-0 z-[200] px-6 animate-in slide-in-from-top duration-300">
          <div className={`max-w-xs mx-auto p-4 rounded-3xl shadow-2xl flex items-center gap-3 border ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
            <ShieldCheck size={20}/> <p className="text-[11px] font-black uppercase">{toast.msg}</p>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className={`pt-14 pb-36 px-6 rounded-b-[4rem] shadow-lg relative z-20 transition-colors ${darkMode ? 'bg-slate-800' : 'bg-sky-500'}`}>
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3"><div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-sky-500 font-black shadow-lg">F</div><h1 className="text-white font-black text-2xl italic tracking-tighter">FinansialKu.</h1></div>
          <div className="flex gap-2">
            <button onClick={() => setLang(lang === "id" ? "en" : "id")} className="text-white/90 p-2.5 bg-white/10 rounded-2xl font-bold text-xs uppercase flex items-center gap-2"><Globe size={18}/> {lang}</button>
            <button onClick={() => setDarkMode(!darkMode)} className="text-white/90 p-2.5 bg-white/10 rounded-2xl">{darkMode ? <Sun size={20}/> : <Moon size={20}/>}</button>
            <button onClick={() => signOut(auth)} className="text-white/90 p-2.5 bg-white/10 rounded-2xl"><LogOut size={20}/></button>
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
                <div className={`rounded-[2.5rem] p-8 shadow-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-50'}`}>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400"><span>{t.income}</span><span className="text-green-500">Rp {formatRupiah(stats.income)}</span></div>
                        <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400"><span>{t.expense}</span><span className="text-red-500">-Rp {formatRupiah(stats.expense)}</span></div>
                        <div className="pt-5 border-t border-slate-100 flex flex-col gap-1">
                            <span className="font-black text-[10px] uppercase italic opacity-40">{t.totalBalance}</span>
                            <div className="flex items-center justify-between gap-2 overflow-hidden">
                                <span className="text-sky-500 font-black italic text-3xl tracking-tighter">{showBalance ? `Rp ${formatRupiah(stats.balance)}` : "Rp ••••••"}</span>
                                <button onClick={() => setShowBalance(!showBalance)} className="text-slate-300">{showBalance ? <EyeOff size={22}/> : <Eye size={22}/>}</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                    <button onClick={() => setShowScanner(true)} className="bg-indigo-500 text-white p-3 rounded-2xl flex flex-col items-center gap-2 font-black text-[7px] shadow-lg"><Camera size={20}/> SCAN</button>
                    <button onClick={() => setShowTransferModal(true)} className="bg-teal-500 text-white p-3 rounded-2xl flex flex-col items-center gap-2 font-black text-[7px] shadow-lg"><ArrowRightLeft size={20}/> TRANSFER</button>
                    <button onClick={() => setActiveTab("wallet")} className="bg-sky-500 text-white p-3 rounded-2xl flex flex-col items-center gap-2 font-black text-[7px] shadow-lg"><WalletIcon size={20}/> WALLET</button>
                    <button onClick={() => setShowExportModal(true)} className="bg-orange-500 text-white p-3 rounded-2xl flex flex-col items-center gap-2 font-black text-[7px] shadow-lg"><FileText size={20}/> REPORT</button>
                </div>

                <div className="space-y-4">
                    <h3 className="font-black text-xs px-2 opacity-50 uppercase italic tracking-widest">Budget Control</h3>
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 px-1">
                        {categoryStats.filter(c => c.limit > 0).map(cat => (
                            <div key={cat.id} className={`flex-shrink-0 w-52 p-6 rounded-[2.5rem] border transition-all ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white shadow-lg'}`}>
                                <div className="flex justify-between items-start mb-3 gap-2"><div className="font-black text-sky-500 uppercase text-[11px] truncate">{cat.name}</div>{cat.remaining < 0 && <AlertTriangle size={16} className="text-red-500 animate-pulse"/>}</div>
                                <div className="space-y-1 mb-4">
                                    <div className="flex justify-between items-baseline"><span className="text-[9px] font-bold opacity-40 uppercase">Spent</span><span className="text-xs font-black">Rp {formatRupiah(cat.spent)}</span></div>
                                    <div className="flex justify-between items-baseline"><span className="text-[9px] font-bold opacity-40 uppercase">{t.remaining}</span><span className={`text-[11px] font-black ${cat.remaining < 0 ? 'text-red-500' : 'text-green-500'}`}>{cat.remaining < 0 ? "-" : ""}Rp {formatRupiah(cat.remaining)}</span></div>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden"><div className={`h-full ${cat.remaining < 0 ? 'bg-red-500' : 'bg-sky-500'}`} style={{width: `${Math.min(100, (cat.spent/cat.limit)*100)}%`}}></div></div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center px-2">
                        <h3 className="font-black text-xs opacity-50 uppercase italic tracking-widest">{t.activity}</h3>
                        <button onClick={() => setShowAllHistory(!showAllHistory)} className="text-[10px] font-black text-sky-500 uppercase flex items-center gap-1">
                            {showAllHistory ? t.showLess : t.seeAll} {showAllHistory ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                        </button>
                    </div>
                    <div className="space-y-3">
                        {displayedTransactions.map(tr => (
                            <div key={tr.id} className={`p-4 rounded-[2rem] flex justify-between items-center border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white shadow-sm'}`}>
                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                    <div className={`w-10 h-10 flex-shrink-0 rounded-2xl flex items-center justify-center ${tr.type === 'income' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>{tr.type === 'income' ? <ArrowUpCircle size={20}/> : <ArrowDownCircle size={20}/>}</div>
                                    <div className="min-w-0">
                                        <p className="font-black text-sm text-sky-500 uppercase truncate">{tr.category}</p>
                                        <p className="text-[8px] text-slate-400 font-bold uppercase truncate">{wallets.find(w => w.id === tr.walletId)?.name || 'Wallet'}</p>
                                        {tr.note && <p className="text-[8px] italic opacity-50 truncate">"{tr.note}"</p>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <p className={`font-black text-sm whitespace-nowrap ${tr.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                                    {showBalance ? `${tr.type === 'income' ? '+' : '-'}Rp ${formatRupiah(tr.amount)}` : "Rp ••••••"}
                                  </p>
                                  <button onClick={async () => {if(window.confirm("Hapus?")) await deleteDoc(doc(db, "transactions", tr.id))}} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {activeTab === "wallet" && (
            <div className="space-y-6 animate-in slide-in-from-right duration-500 pb-10">
                <div className={`px-5 py-8 rounded-[2.5rem] mb-6 border-2 transition-all ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-sky-50 border-sky-100'}`}>
                    <p className="text-[12px] font-black uppercase tracking-[0.25em] mb-2">{t.totalBalance}</p>
                    <h2 className={`text-4xl font-black italic tracking-tighter ${darkMode ? 'text-sky-400' : 'text-sky-700'}`}>
                      {showBalance ? `Rp ${formatRupiah(stats.balance)}` : "Rp ••••••"}
                    </h2>
                </div>
                <div className="flex justify-between items-center px-2 mb-2">
                    <h3 className="font-black text-[10px] uppercase italic opacity-40">{t.myWallets}</h3>
                    <button onClick={() => setShowAddWallet(true)} className="p-2 bg-sky-500 text-white rounded-xl shadow-lg"><Plus size={20}/></button>
                </div>
                <div className="grid gap-5">
                    {walletData.map((w) => (
                        <div key={w.id} className={`p-7 rounded-[2.5rem] border-2 shadow-2xl ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 text-slate-900'}`}>
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl ${darkMode ? 'bg-slate-900 text-sky-400' : 'bg-sky-500 text-white'}`}>{w.type === 'bank' ? <Landmark size={26}/> : w.type === 'ewallet' ? <CreditCard size={26}/> : <Coins size={26}/>}</div>
                                    <div><h4 className="font-black text-base uppercase">{w.name}</h4><p className="text-[9px] font-black opacity-40">Verified Account</p></div>
                                </div>
                                <button onClick={async () => { if(window.confirm(`Hapus ${w.name}?`)) await deleteDoc(doc(db,"wallets",w.id)) }} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={20}/></button>
                            </div>
                            <div className="mt-10 flex justify-between items-end">
                                <div><p className="text-[10px] font-black uppercase mb-1 opacity-40">Saldo</p><p className="text-2xl font-black italic text-sky-500">{showBalance ? `Rp ${formatRupiah(w.balance)}` : "Rp ••••••"}</p></div>
                                <button onClick={() => { setShowTransferModal(true); setTransferForm({...transferForm, fromWalletId: w.id}); }} className="px-5 py-2.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg">Transfer</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === "category" && (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
                <div className="flex justify-between items-center px-2"><h2 className="font-black italic text-xl uppercase tracking-tighter">{t.catTitle}</h2></div>
                <div className={`p-6 rounded-[2.5rem] border shadow-xl ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-50'}`}>
                    <div className="space-y-4">
                        <input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} className={`w-full p-4 rounded-2xl border outline-none font-black text-xs ${darkMode ? 'bg-slate-700' : 'bg-slate-50'}`} placeholder="Nama Kategori Baru" />
                        <div className="flex gap-2">
                            <input value={newCatLimit ? formatRupiah(newCatLimit) : ""} onChange={(e) => setNewCatLimit(e.target.value)} className={`flex-1 p-4 rounded-2xl border outline-none font-black text-xs ${darkMode ? 'bg-slate-700' : 'bg-slate-50'}`} placeholder="Limit Budget Rp" />
                            <button onClick={async () => { if(!newCatName.trim()) return; await addDoc(collection(db, "categories"), { name: newCatName.trim().toUpperCase(), limit: Number(newCatLimit.replace(/\D/g, '')) || 0, userId: user.uid, createdAt: new Date() }); setNewCatName(""); setNewCatLimit(""); }} className="bg-sky-500 text-white px-6 rounded-2xl shadow-lg active:scale-90"><Plus size={22}/></button>
                        </div>
                    </div>
                </div>
                <div className="grid gap-4">
                    {categoryStats.map(c => (
                        <div key={c.id} className={`p-5 rounded-[2.5rem] border shadow-sm ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-50'}`}>
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-sky-50 text-sky-500"><Tag size={18}/></div><span className="text-sm font-black uppercase text-sky-500">{c.name}</span></div>
                                <div className="flex gap-1"><button onClick={() => { setEditingCategoryId(c.id); setTempLimit(c.limit); }} className="p-2 text-slate-300 hover:text-sky-500"><Edit3 size={16}/></button><button onClick={async () => { if(window.confirm("Hapus?")) await deleteDoc(doc(db, "categories", c.id)) }} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={16}/></button></div>
                            </div>
                            {editingCategoryId === c.id ? (
                                <div className="flex gap-2 animate-in slide-in-from-top"><input value={tempLimit ? formatRupiah(tempLimit) : ""} onChange={(e) => setTempLimit(e.target.value)} className="flex-1 p-2 rounded-xl border font-black text-xs outline-none" /><button onClick={async () => { await updateDoc(doc(db, "categories", c.id), { limit: Number(tempLimit.toString().replace(/\D/g, '')) }); setEditingCategoryId(null); showNotice("Updated!", "success"); }} className="bg-green-500 text-white p-2 rounded-xl"><Check size={16}/></button></div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex justify-between items-end"><div><p className="text-[8px] font-black opacity-40">Spent / Limit</p><p className="text-[10px] font-black">Rp {formatRupiah(c.spent)} / <span className="text-sky-500">Rp {formatRupiah(c.limit)}</span></p></div><p className="text-sky-500 font-black text-xs">{c.limit > 0 ? Math.round((c.spent/c.limit)*100) : 0}%</p></div>
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden"><div className="h-full bg-sky-500" style={{ width: `${Math.min(100, (c.spent/c.limit)*100)}%` }}></div></div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === "profile" && (
            <div className="space-y-6 animate-in slide-in-from-right duration-500 pb-10">
                <div className={`p-8 rounded-[3rem] border shadow-2xl relative transition-all ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-50'}`}>
                    <div className="flex flex-col items-center text-center">
                        <div onClick={handleUpdatePhoto} className="relative cursor-pointer mb-4">
                            <div className="w-28 h-28 bg-gradient-to-tr from-sky-500 to-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white border-4 border-white shadow-2xl overflow-hidden">
                                {user.photoURL ? <img src={user.photoURL} alt="p" className="w-full h-full object-cover" /> : <User size={48}/>}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-all"><Camera size={24} className="text-white" /></div>
                            </div>
                            <div className={`absolute -bottom-2 -right-2 w-12 h-12 rounded-full border-4 border-white flex items-center justify-center text-[10px] font-black text-white shadow-lg ${healthScore > 60 ? 'bg-green-500' : 'bg-orange-500'}`}><span>{healthScore}%</span></div>
                        </div>
                        <h2 className="font-black text-2xl tracking-tighter italic uppercase">{user.displayName || "Finansial User"}</h2>
                        <p className="text-slate-400 text-[10px] font-bold uppercase">{user.email}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 text-center">
                        <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p><p className={`font-black text-xs ${healthScore > 60 ? 'text-green-500' : 'text-orange-500'}`}>{healthScore > 80 ? 'EXCELLENT' : 'STABLE'}</p></div>
                        <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Mutasi</p><p className="font-black text-xs text-sky-500">{allTransactions.length} Tx</p></div>
                    </div>
                </div>

                {topSpendingCategory && (
                    <div className={`p-5 rounded-[2rem] border flex items-center justify-between ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-orange-50 border-orange-100 shadow-sm'}`}>
                        <div className="flex items-center gap-3"><div className="w-10 h-10 bg-orange-500 text-white rounded-2xl flex items-center justify-center"><TrendingDown size={20}/></div><div><p className="text-[8px] font-black text-orange-500 uppercase leading-none mb-1">Top Spend</p><p className="font-black text-xs uppercase italic truncate max-w-[120px]">{topSpendingCategory.name}</p></div></div>
                        <p className="font-black text-sm text-orange-600">Rp {formatRupiah(topSpendingCategory.spent)}</p>
                    </div>
                )}

                <div className="space-y-3">
                  <div className={`rounded-[2.5rem] p-4 space-y-1 shadow-sm border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-50'}`}>
                    <button onClick={() => setLang(lang === 'id' ? 'en' : 'id')} className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-2xl transition-all"><div className="flex items-center gap-4"><div className="w-10 h-10 bg-sky-100 text-sky-500 rounded-xl flex items-center justify-center"><Languages size={18}/></div><span className="text-xs font-black uppercase">Language</span></div><span className="text-[10px] font-black text-sky-500 uppercase">{lang}</span></button>
                    <button onClick={() => setDarkMode(!darkMode)} className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-2xl transition-all"><div className="flex items-center gap-4"><div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-xl flex items-center justify-center">{darkMode ? <Moon size={18}/> : <Sun size={18}/>}</div><span className="text-xs font-black uppercase">Appearance</span></div><div className={`w-10 h-5 rounded-full relative transition-all ${darkMode ? 'bg-sky-500' : 'bg-slate-200'}`}><div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${darkMode ? 'left-6' : 'left-1'}`}></div></div></button>
                    <button onClick={() => setShowExportModal(true)} className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-2xl transition-all"><div className="flex items-center gap-4"><div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center"><Database size={18}/></div><span className="text-xs font-black uppercase">E-Statement (PDF)</span></div><ChevronRight size={16}/></button>
                  </div>
                  <button onClick={() => signOut(auth)} className="w-full p-6 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-[2.5rem] font-black uppercase text-xs active:scale-95 flex items-center justify-center gap-3 transition-all"><LogOut size={18}/> Logout Account</button>
                </div>
            </div>
        )}
      </div>

      {/* NAVIGATION */}
      <div className={`fixed bottom-0 left-0 right-0 px-2 py-4 z-50 rounded-t-[3rem] shadow-2xl border-t ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
        <div className="grid grid-cols-5 items-center w-full text-center">
          <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center transition-all ${activeTab === 'home' ? 'text-sky-500 scale-110' : 'opacity-30'}`}><Home size={22}/> <span className="text-[8px] font-black uppercase">Home</span></button>
          <button onClick={() => setActiveTab('category')} className={`flex flex-col items-center transition-all ${activeTab === 'category' ? 'text-orange-500 scale-110' : 'opacity-30'}`}><Tag size={22}/> <span className="text-[8px] font-black uppercase">Tag</span></button>
          <div className="flex justify-center -mt-12"><button onClick={() => setShowAddTransaction(true)} className="w-14 h-14 bg-sky-500 rounded-full flex items-center justify-center text-white border-4 border-white shadow-xl active:scale-90 transition-all"><PlusCircle size={28}/></button></div>
          <button onClick={() => setActiveTab('wallet')} className={`flex flex-col items-center transition-all ${activeTab === 'wallet' ? 'text-sky-500 scale-110' : 'opacity-30'}`}><WalletIcon size={22}/> <span className="text-[8px] font-black uppercase">Wallet</span></button>
          <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center transition-all ${activeTab === 'profile' ? 'text-sky-500 scale-110' : 'opacity-30'}`}><User size={22}/> <span className="text-[8px] font-black uppercase">User</span></button>
        </div>
      </div>

      {/* MODAL ADD TRANSACTION */}
      {showAddTransaction && (
        <div className={`fixed inset-0 z-[100] flex flex-col animate-in slide-in-from-bottom duration-500 ${darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
          <div className="flex items-center justify-between p-6 shrink-0"><button onClick={() => setShowAddTransaction(false)} className={`p-3 rounded-full active:scale-90 transition-all ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}><ChevronLeft size={24} className="text-sky-500"/></button><h2 className="font-black text-xl italic uppercase text-sky-500">Add Entry</h2><div className="w-12"></div></div>
          <div className="px-6 mb-4 shrink-0"><div className={`${darkMode ? 'bg-slate-800' : 'bg-slate-100'} p-1.5 rounded-[2.5rem] flex`}><button onClick={() => setForm({...form, type: 'expense'})} className={`flex-1 py-4 rounded-[2.2rem] text-xs font-black transition-all ${form.type === 'expense' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400'}`}>EXPENSE</button><button onClick={() => setForm({...form, type: 'income'})} className={`flex-1 py-4 rounded-[2.2rem] text-xs font-black transition-all ${form.type === 'income' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400'}`}>INCOME</button></div></div>
          <div className="flex flex-col items-center mb-4 px-6 shrink-0"><h1 className="text-5xl font-black tracking-tighter text-sky-500 animate-pulse">Rp {form.amount ? formatRupiah(form.amount) : "0"}</h1></div>
          
          <div className="flex-1 overflow-y-auto space-y-6 no-scrollbar pb-10 px-6">
            <select value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} className={`w-full p-5 rounded-2xl text-xs font-black border outline-none ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}><option value="">Pilih Kategori</option>{categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select>
            <select value={form.walletId} onChange={(e) => setForm({...form, walletId: e.target.value})} className={`w-full p-5 rounded-2xl text-xs font-black border outline-none ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}><option value="">Pilih Dompet</option>{wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select>
            <input type="text" placeholder="Catatan Tambahan..." value={form.note} onChange={(e) => setForm({...form, note: e.target.value})} className={`w-full p-5 rounded-2xl border font-black text-xs outline-none ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50'}`} />
          </div>

          <div className={`shrink-0 p-6 rounded-t-[3rem] shadow-2xl ${darkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, "00", 0].map(n => (<button key={n} onClick={() => handleNumpad(n.toString())} className="py-4 text-2xl font-black rounded-xl active:scale-75 transition-all">{n}</button>))}
              <button onClick={() => handleNumpad("delete")} className="py-4 flex items-center justify-center text-red-500 active:scale-75"><Delete size={32}/></button>
            </div>
            <button onClick={handleSubmit} className="w-full bg-sky-500 text-white py-6 rounded-[2.5rem] font-black uppercase text-sm shadow-xl active:scale-95 transition-all"><ShieldCheck size={22}/> SIMPAN TRANSAKSI</button>
          </div>
        </div>
      )}

      {/* MODAL TRANSFER */}
      {showTransferModal && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-in zoom-in duration-300">
          <div className={`w-full max-w-sm rounded-[3.5rem] shadow-2xl overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
             <div className="p-8 pb-0 flex justify-between items-center italic font-black text-teal-500 text-lg uppercase tracking-tighter"><h2>Transfer</h2><button onClick={() => setShowTransferModal(false)}><X size={20}/></button></div>
             <div className="p-8 pt-6 space-y-6">
                <input type="text" value={transferForm.amount ? formatRupiah(transferForm.amount) : ""} onChange={(e) => setTransferForm({...transferForm, amount: e.target.value.replace(/\D/g, '')})} className="w-full py-5 px-6 rounded-[2rem] border text-sm font-black outline-none" placeholder="Rp 0" />
                <div className="flex gap-3 overflow-x-auto no-scrollbar">{walletData.map(w => (<button key={w.id} onClick={() => setTransferForm({...transferForm, fromWalletId: w.id})} className={`flex-shrink-0 p-4 rounded-3xl border transition-all min-w-[130px] ${transferForm.fromWalletId === w.id ? 'bg-sky-500 text-white shadow-lg scale-105' : 'opacity-60 grayscale'}`}><p className="text-[10px] font-black">{w.name}</p><p className="text-[8px]">Rp {formatRupiah(w.balance)}</p></button>))}</div>
                <div className="flex justify-center"><ArrowDown size={20} className="text-teal-500 animate-bounce"/></div>
                <div className="flex gap-3 overflow-x-auto no-scrollbar">{walletData.map(w => (<button key={w.id} onClick={() => setTransferForm({...transferForm, toWalletId: w.id})} disabled={w.id === transferForm.fromWalletId} className={`flex-shrink-0 p-4 rounded-3xl border transition-all min-w-[130px] ${transferForm.toWalletId === w.id ? 'bg-teal-500 text-white shadow-lg scale-105' : 'opacity-60 grayscale'}`}><p className="text-[10px] font-black">{w.name}</p></button>))}</div>
                <button onClick={handleTransfer} className="w-full py-5 rounded-[2.5rem] bg-teal-500 text-white font-black uppercase text-[10px] shadow-xl active:scale-95 transition-all">Konfirmasi Transfer</button>
             </div>
          </div>
        </div>
      )}

      {/* MODAL REPORT FILTER */}
      {showExportModal && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-in zoom-in duration-300">
          <div className={`w-full max-w-sm p-10 rounded-[3.5rem] shadow-2xl ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
            <h2 className="font-black italic text-orange-500 text-xl uppercase mb-6">{t.report}</h2>
            <div className="space-y-5">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-4 rounded-2xl border bg-transparent font-bold text-xs" />
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-4 rounded-2xl border bg-transparent font-bold text-xs" />
              <select value={exportWalletFilter} onChange={(e) => setExportWalletFilter(e.target.value)} className="w-full p-4 rounded-2xl border bg-transparent font-bold text-xs outline-none"><option value="all">{t.allWallets}</option>{wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select>
              <button onClick={exportPDF} className="w-full bg-orange-500 text-white py-5 rounded-[2rem] font-black uppercase text-[10px] shadow-lg flex items-center justify-center gap-2 mt-4"><FileText size={16}/> DOWNLOAD PDF</button>
              <button onClick={() => setShowExportModal(false)} className="w-full text-[10px] font-black uppercase opacity-40">Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ADD WALLET */}
      {showAddWallet && (
        <div className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in zoom-in duration-300">
          <div className={`w-full max-w-sm p-10 rounded-[3.5rem] shadow-2xl ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
            <h2 className="font-black italic text-sky-500 text-lg uppercase mb-6">New Wallet</h2>
            <div className="space-y-6">
              <input value={newWalletName} onChange={(e) => setNewWalletName(e.target.value)} className="w-full p-5 rounded-[2rem] border outline-none font-black text-sm" placeholder="Nama Dompet" />
              <div className="flex gap-2">{['bank', 'ewallet', 'cash'].map((type) => (<button key={type} onClick={() => setNewWalletType(type)} className={`flex-1 py-3 rounded-[1.5rem] text-[10px] font-black uppercase transition-all ${newWalletType === type ? 'bg-sky-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>{type}</button>))}</div>
              <button onClick={async () => { if(!newWalletName) return; await addDoc(collection(db, "wallets"), { name: newWalletName, type: newWalletType, userId: user.uid, createdAt: new Date() }); setShowAddWallet(false); setNewWalletName(""); }} className="w-full bg-sky-500 text-white py-5 rounded-[2rem] font-black shadow-xl active:scale-95 transition-all">Simpan Dompet</button>
              <button onClick={() => setShowAddWallet(false)} className="w-full text-[10px] font-black uppercase opacity-40 mt-2">Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SCANNER */}
      {showScanner && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in zoom-in duration-300">
          <div className={`w-full max-w-sm p-10 rounded-[3.5rem] text-center ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
            <h2 className="font-black text-indigo-500 text-lg uppercase mb-8">Scanner</h2>
            <div className={`w-full aspect-square rounded-[3rem] border-4 border-dashed flex flex-col items-center justify-center gap-4 ${isScanning ? 'border-indigo-500' : 'border-slate-200 opacity-50'}`}>
              {isScanning ? <><Loader2 size={50} className="animate-spin text-indigo-500" /><p className="text-xs font-black uppercase">Scanning...</p></> : <Camera size={50} className="text-slate-300" />}
            </div>
            <label className="w-full bg-indigo-500 text-white py-5 rounded-[2rem] font-black uppercase text-[10px] shadow-xl mt-8 cursor-pointer flex items-center justify-center gap-2"><Sparkles size={16}/> Select Photo<input type="file" accept="image/*" className="hidden" onChange={(e) => {
              const file = e.target.files[0];
              if (!file) return;
              setIsScanning(true);
              const reader = new FileReader();
              reader.onload = async () => {
                const worker = await createWorker('eng');
                const { data: { text } } = await worker.recognize(reader.result);
                await worker.terminate();
                const detected = Math.max(...(text.replace(/[.,]/g, '').match(/\d+/g)?.map(Number).filter(n => n > 1000) || [0]));
                if (detected > 0) setForm(f => ({ ...f, amount: detected.toString() }));
                setIsScanning(false); setShowScanner(false); setShowAddTransaction(true);
                showNotice("Bill Scanned!", "success");
              };
              reader.readAsDataURL(file);
            }} disabled={isScanning} /></label>
            <button onClick={() => setShowScanner(false)} className="w-full mt-4 text-[10px] font-black uppercase opacity-40">Batal</button>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;