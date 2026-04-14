import React, { useState, useEffect, useMemo } from "react";
import { auth, db } from "./lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, onSnapshot, query, where, orderBy, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { 
  Home as HomeIcon, Wallet as WalletIcon, User as UserIcon, Tag as TagIcon, Plus, Bell, Sun, Moon, BarChart3, X, Info, Sparkles, Loader2, Camera, Delete, ShieldCheck,
  RefreshCcw, Mic 
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Import Custom Pages & Utils
import Login from "./pages/Login";
import HomePage from "./pages/Home";
import WalletPage from "./pages/Wallet";
import CategoryPage from "./pages/Category";
import ProfilePage from "./pages/ProfilePage"; 
import SubscriptionPage from "./pages/Subscription"; 
import { TRANSLATIONS, formatRupiah } from "./utils/constants";

// Import Modals & Security
import ScannerModal from "./components/modals/ScannerModal";
import SplitBillModal from "./components/modals/SplitBillModal";
import InsightModal from "./components/modals/InsightModal";
import AddTransactionModal from "./components/modals/AddTransactionModal";
import AddCategoryModal from "./components/modals/AddCategoryModal";
import AddSubModal from "./components/modals/AddSubModal"; 
import NotificationModal from "./components/modals/NotificationModal";
import ExportModal from "./components/modals/ExportModal"; 
import SecurityLock from "./components/SecurityLock";
import SecurityModal from "./components/modals/SecurityModal";
import TransactionDetailModal from "./components/modals/TransactionDetailModal"; // NEW FILE

function App() {
  // --- 1. SECURITY & AUTH STATES ---
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(true); 
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  // --- 2. UI & DATA STATES ---
  const [activeTab, setActiveTab] = useState("home");
  const [lang, setLang] = useState(() => localStorage.getItem("fin_lang") || "id");
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("fin_dark") === "true");
  const [historyFilter, setHistoryFilter] = useState("all"); 
  const [selectedDate, setSelectedDate] = useState(""); 
  
  const [userAvatar, setUserAvatar] = useState(() => localStorage.getItem("fin_avatar") || "👤");
  
  const [wallets, setWallets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]); 
  const [subscriptions, setSubscriptions] = useState([]); 
  
  // NEW STATE: FOR INTERACTIVE DETAILS
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const [showInsight, setShowInsight] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddSub, setShowAddSub] = useState(false); 
  const [showNotif, setShowNotif] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false); 

  const [form, setForm] = useState({ amount: "", category: "", type: "expense", walletId: "", note: "" });
  const [newWallet, setNewWallet] = useState({ name: "", type: "bank", balance: "" });
  const [newSub, setNewSub] = useState({ name: "", price: "", dueDay: "" }); 
  const [editingWalletId, setEditingWalletId] = useState(null);
  const [newCat, setNewCat] = useState({ name: "", limit: "" });
  const [toast, setToast] = useState({ show: false, msg: "", type: "success" });

  const t = TRANSLATIONS[lang];

  const getDynamicFontSize = (length) => {
    if (length > 15) return "text-2xl";
    if (length > 12) return "text-3xl";
    if (length > 10) return "text-4xl";
    return "text-5xl";
  };

  const showNotice = (msg, type = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast(p => ({ ...p, show: false })), 3000);
  };

  // --- 3. VOICE FEATURE ---
  const startVoiceCommand = () => {
    setShowAddTransaction(false);
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showNotice("Browser lo nggak support Voice!", "error");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'id-ID';
    recognition.interimResults = false;
    showNotice("Mendengarkan...", "success");
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      parseVoiceData(transcript);
    };
    recognition.onerror = () => showNotice("Gagal denger suara!", "error");
    recognition.start();
  };

  const parseVoiceData = (text) => {
    const amountClean = text.replace(/ribu/g, "000").replace(/\D/g, "");
    const detectedAmount = amountClean || "";
    const detectedWallet = wallets.find(w => text.includes(w.name.toLowerCase()));
    const detectedCategory = categories.find(c => text.includes(c.name.toLowerCase()));
    setForm({
      ...form,
      amount: detectedAmount,
      walletId: detectedWallet ? detectedWallet.id : (wallets[0]?.id || ""),
      category: detectedCategory ? detectedCategory.name : (categories[0]?.name || "Lainnya"),
      note: `AI Voice: "${text}"`
    });
    setShowAddTransaction(true);
    showNotice("Data diproses otomatis!", "success");
  };

  // --- 4. LISTENERS & EFFECTS ---
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => { 
        setUser(u); 
        setLoading(false); 
        if(!u) setIsLocked(true);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubW = onSnapshot(query(collection(db, "wallets"), where("userId", "==", user.uid)), (s) => setWallets(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubC = onSnapshot(query(collection(db, "categories"), where("userId", "==", user.uid), orderBy("name", "asc")), (s) => setCategories(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubT = onSnapshot(query(collection(db, "transactions"), where("userId", "==", user.uid), orderBy("createdAt", "desc")), (s) => setAllTransactions(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubS = onSnapshot(query(collection(db, "subscriptions"), where("userId", "==", user.uid)), (s) => setSubscriptions(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubW(); unsubC(); unsubT(); unsubS(); };
  }, [user]);

  useEffect(() => {
    localStorage.setItem("fin_lang", lang);
    localStorage.setItem("fin_dark", darkMode);
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [lang, darkMode]);

  // --- 5. DATA LOGIC ---
  const stats = useMemo(() => {
    const baseBalance = wallets.reduce((acc, w) => acc + (Number(w.balance) || 0), 0);
    const inc = allTransactions.filter(tr => tr.type === 'income').reduce((a, b) => a + (Number(b.amount) || 0), 0);
    const exp = allTransactions.filter(tr => tr.type === 'expense').reduce((a, b) => a + (Number(b.amount) || 0), 0);
    return { income: inc, expense: exp, balance: baseBalance + inc - exp };
  }, [allTransactions, wallets]);

  // --- 6. HANDLERS ---
  const handleNumpad = (val, target) => {
    const setters = { form: setForm, cat: setNewCat, wallet: setNewWallet }; 
    const setter = setters[target];
    setter(prev => {
        const key = target === 'cat' ? 'limit' : (target === 'wallet' ? 'balance' : 'amount');
        const cur = String(prev[key] || "");
        const newVal = val === "delete" ? cur.slice(0, -1) : cur + val;
        return { ...prev, [key]: newVal };
    });
  };

  const handleSaveTransaction = async () => {
    if (!form.amount || !form.category || !form.walletId) {
        return showNotice("Lengkapi data dulu, bro!", "error");
    }
    await addDoc(collection(db, "transactions"), { 
        ...form, 
        type: form.type.toLowerCase(), 
        amount: Number(form.amount), 
        userId: user.uid, 
        createdAt: new Date() 
    });
    setShowAddTransaction(false); 
    setForm({ amount: "", category: "", type: "expense", walletId: "", note: "" });
    showNotice("Tersimpan!");
  };

  const handleDeleteTransaction = async (id) => {
    if(window.confirm("Hapus transaksi ini?")) {
      await deleteDoc(doc(db, "transactions", id));
      showNotice("Dihapus!");
      if(selectedTransaction?.id === id) setSelectedTransaction(null);
    }
  };

  const handleSaveWallet = async (walletData) => {
    if (!walletData.name || walletData.balance === "") {
        return showNotice("Lengkapi data dulu, bro!", "error");
    }
    const payload = { 
        name: walletData.name, 
        type: walletData.type, 
        balance: Number(walletData.balance || 0), 
        userId: user.uid, 
        updatedAt: new Date() 
    };
    try {
      if (walletData.id) {
        await updateDoc(doc(db, "wallets", walletData.id), payload);
        showNotice("Wallet diupdate!");
      } else {
        await addDoc(collection(db, "wallets"), { ...payload, createdAt: new Date() });
        showNotice("Wallet ditambahkan!");
      }
      setShowAddWallet(false); setEditingWalletId(null);
    } catch (err) { showNotice("Gagal menyimpan", "error"); }
  };

  const handleSaveSub = async () => {
    if (!newSub.name || !newSub.price || !newSub.dueDay) {
        return showNotice("Lengkapi data dulu, bro!", "error");
    }
    try {
        await addDoc(collection(db, "subscriptions"), { 
            ...newSub, 
            price: Number(newSub.price),
            userId: user.uid, 
            createdAt: new Date() 
        });
        setShowAddSub(false);
        setNewSub({ name: "", price: "", dueDay: "" });
        showNotice("Berhasil ditambahkan!");
    } catch (err) { showNotice("Gagal menyimpan", "error"); }
  };

  const handleUpdatePin = (newPin) => {
    localStorage.setItem("user_pin", newPin);
    showNotice("Security PIN Updated!", "success");
    setShowSecurityModal(false);
  };

  const handleExportPDF = (filters) => {
    try {
      const docPDF = new jsPDF();
      const fileName = `Report_Maestro_${new Date().getTime()}.pdf`;
      const reportData = allTransactions.filter(tr => {
        const dateObj = tr.createdAt?.seconds ? new Date(tr.createdAt.seconds * 1000) : new Date(tr.createdAt);
        const trDate = dateObj.toISOString().split('T')[0];
        const matchWallet = filters.walletId === 'all' || tr.walletId === filters.walletId;
        const matchCat = filters.category === 'all' || tr.category === filters.category;
        const matchStart = !filters.startDate || trDate >= filters.startDate;
        const matchEnd = !filters.endDate || trDate <= filters.endDate;
        return matchWallet && matchCat && matchStart && matchEnd;
      });

      if (reportData.length === 0) return showNotice("Data tidak ditemukan!", "error");

      docPDF.setFillColor(15, 23, 42); docPDF.rect(0, 0, 210, 50, 'F');
      docPDF.setTextColor(255, 255, 255);
      docPDF.setFontSize(24); docPDF.setFont("helvetica", "bold");
      docPDF.text("FINANSIALKU MAESTRO", 15, 28);
      docPDF.setFontSize(9); docPDF.setFont("helvetica", "normal");
      docPDF.text(`Periode: ${filters.startDate || 'Awal'} s/d ${filters.endDate || 'Sekarang'}`, 15, 38);
      docPDF.text(`Generated for ${user?.displayName || 'Master User'}`, 15, 43);

      const reportInc = reportData.filter(t => t.type === 'income').reduce((a, b) => a + Number(b.amount), 0);
      const reportExp = reportData.filter(t => t.type === 'expense').reduce((a, b) => a + Number(b.amount), 0);
      const savingsRate = reportInc > 0 ? Math.round(((reportInc - reportExp) / reportInc) * 100) : 0;

      docPDF.setFillColor(241, 245, 249); docPDF.roundedRect(15, 55, 180, 25, 3, 3, 'F');
      docPDF.setTextColor(51, 65, 85); docPDF.setFontSize(8); docPDF.setFont("helvetica", "bold");
      docPDF.text("FILTERED INCOME", 25, 63);
      docPDF.text("FILTERED EXPENSE", 85, 63);
      docPDF.text("SAVINGS RATE", 145, 63);

      docPDF.setFontSize(11); docPDF.setTextColor(5, 150, 105); 
      docPDF.text(`Rp ${formatRupiah(reportInc)}`, 25, 72);
      docPDF.setTextColor(225, 29, 72);
      docPDF.text(`Rp ${formatRupiah(reportExp)}`, 85, 72);
      docPDF.setTextColor(37, 99, 235);
      docPDF.text(`${savingsRate}%`, 145, 72);

      const tableBody = reportData.map(tr => [
        tr.createdAt?.seconds ? new Date(tr.createdAt.seconds * 1000).toLocaleDateString('id-ID') : '-',
        tr.category.toUpperCase(),
        tr.note ? tr.note.replace("AI Voice: ", "").replace("Voice: ", "").substring(0, 45) : "-",
        { content: `${tr.type === 'income' ? '+' : '-'} Rp ${formatRupiah(tr.amount)}`, styles: { textColor: tr.type === 'income' ? [5, 150, 105] : [225, 29, 72], fontStyle: 'bold' } }
      ]);

      autoTable(docPDF, {
        startY: 90,
        head: [['DATE', 'CATEGORY', 'NOTE / DESCRIPTION', 'AMOUNT']],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], fontSize: 9, halign: 'center' },
        columnStyles: { 0: { cellWidth: 25, halign: 'center' }, 1: { cellWidth: 35 }, 3: { cellWidth: 40, halign: 'right' } },
        styles: { fontSize: 8, cellPadding: 4, valign: 'middle' }
      });

      const pageCount = docPDF.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        docPDF.setPage(i);
        docPDF.setFontSize(8); docPDF.setTextColor(148, 163, 184);
        docPDF.text(`Page ${i} of ${pageCount} - Maestro Official Financial Report`, 105, 290, { align: 'center' });
      }

      docPDF.save(fileName);
      setShowExportModal(false);
      showNotice("Laporan Maestro Siap!");
    } catch (err) { 
      console.error(err);
      showNotice("Gagal Export", "error"); 
    }
  };

  // --- 7. RENDER ---
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-blue-600 font-black text-2xl animate-pulse italic uppercase tracking-tighter">FinansialKu</div>;
  if (!user) return <Login />;
  if (isLocked) return <SecurityLock onUnlock={() => setIsLocked(false)} />;

  return (
    <div className={`min-h-screen flex flex-col max-w-md mx-auto transition-all ${darkMode ? 'bg-[#0F172A] text-white' : 'bg-[#F8F9FE] text-slate-900'}`}>
      
      {activeTab !== "profile" && (
        <div className="fixed top-0 left-0 right-0 max-w-md mx-auto z-50 px-6 pt-12 pb-4 flex justify-between items-center bg-inherit">
          <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg"><BarChart3 size={20}/></div>
              <h1 className="text-xl font-black tracking-tighter italic uppercase">Finansialku.</h1>
          </div>
          <div className="flex items-center gap-2">
              <button onClick={() => setActiveTab('profile')} className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 active:scale-90 transition-all flex items-center justify-center text-xl">
                {userAvatar}
              </button>
              <button onClick={() => setDarkMode(!darkMode)} className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 active:scale-90 transition-all">{darkMode ? <Sun size={20} className="text-yellow-400"/> : <Moon size={20} className="text-slate-600"/>}</button>
          </div>
        </div>
      )}

      <div className={`flex-1 overflow-y-auto no-scrollbar pb-40 ${activeTab === "home" ? "px-6" : ""} ${activeTab !== "profile" ? "pt-28" : ""}`}>
        {activeTab === "home" && <HomePage stats={stats} t={t} formatRupiah={formatRupiah} showBalance={showBalance} setShowBalance={setShowBalance} setShowScanner={setShowScanner} setShowSplitModal={setShowSplitModal} setShowInsight={setShowInsight} categories={categories} allTransactions={allTransactions} historyFilter={historyFilter} setHistoryFilter={setHistoryFilter} setShowNotif={setShowNotif} shareWhatsApp={() => setShowExportModal(true)} selectedDate={selectedDate} setSelectedDate={setSelectedDate} handleDeleteTransaction={handleDeleteTransaction} setSelectedTransaction={setSelectedTransaction} />}
        {activeTab === "wallet" && <WalletPage wallets={wallets} allTransactions={allTransactions} formatRupiah={formatRupiah} showAddWallet={showAddWallet} setShowAddWallet={setShowAddWallet} handleDeleteWallet={async (id) => { if(window.confirm("Hapus?")) { await deleteDoc(doc(db, "wallets", id)); showNotice("Dihapus!"); } }} handleEditWallet={(w) => { setEditingWalletId(w.id); setShowAddWallet(true); }} onAddWallet={handleSaveWallet} onUpdateWallet={handleSaveWallet} editingWallet={wallets.find(w => w.id === editingWalletId)} setEditingWallet={(val) => setEditingWalletId(val?.id || null)} />}
        {activeTab === "category" && <CategoryPage categories={categories} allTransactions={allTransactions} formatRupiah={formatRupiah} setShowAddCategory={setShowAddCategory} t={t} handleDeleteCategory={async (id) => { if(window.confirm("Hapus?")) { await deleteDoc(doc(db, "categories", id)); showNotice("Dihapus!"); } }} />}
        {activeTab === "recurring" && <SubscriptionPage subs={subscriptions} formatRupiah={formatRupiah} setShowAddSub={setShowAddSub} handleDeleteSub={async (id) => { if(window.confirm("Hapus?")) { await deleteDoc(doc(db, "subscriptions", id)); showNotice("Dihapus!"); } }} />}
        {activeTab === "profile" && (
          <ProfilePage 
            user={user} t={t} lang={lang} setLang={setLang} darkMode={darkMode} setDarkMode={setDarkMode} 
            setActiveTab={setActiveTab} shareWhatsApp={() => setShowExportModal(true)}
            currentAvatar={userAvatar} setUserAvatar={(ava) => { setUserAvatar(ava); localStorage.setItem("fin_avatar", ava); }}
            setShowSecurityModal={setShowSecurityModal} 
          />
        )}
      </div>

      <div className="fixed bottom-10 left-6 right-6 z-[110]">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl h-16 rounded-[2.5rem] shadow-2xl border border-slate-200/50 dark:border-white/10 flex items-center justify-between px-8 relative">
                <div className="flex items-center gap-8">
                  <button onClick={() => setActiveTab('home')} className={`transition-all ${activeTab === 'home' ? 'text-blue-500 scale-110' : 'text-slate-400 opacity-40'}`}><HomeIcon size={20}/></button>
                  <button onClick={() => setActiveTab('wallet')} className={`transition-all ${activeTab === 'wallet' ? 'text-blue-500 scale-110' : 'text-slate-400 opacity-40'}`}><WalletIcon size={20}/></button>
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 -top-10 flex items-center gap-3">
                    <button onClick={startVoiceCommand} className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-blue-500 shadow-xl border-4 border-[#F8F9FE] dark:border-[#0F172A] active:scale-90 transition-all">
                      <div className="relative"><Mic size={18}/><span className="absolute -top-1 -right-1 flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span></span></div>
                    </button>
                    <button onClick={() => setShowAddTransaction(true)} className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-2xl shadow-blue-600/40 border-4 border-[#F8F9FE] dark:border-[#0F172A] active:scale-95 transition-all"><Plus size={32}/></button>
                </div>
                <div className="flex items-center gap-8">
                  <button onClick={() => setActiveTab('recurring')} className={`transition-all ${activeTab === 'recurring' ? 'text-blue-500 scale-110' : 'text-slate-400 opacity-40'}`}><RefreshCcw size={20}/></button>
                  <button onClick={() => setActiveTab('category')} className={`transition-all ${activeTab === 'category' ? 'text-blue-500 scale-110' : 'text-slate-400 opacity-40'}`}><TagIcon size={20}/></button>
                </div>
          </div>
      </div>

      <NotificationModal show={showNotif} setShow={setShowNotif} notifications={allTransactions.slice(0,3)} formatRupiah={formatRupiah} />
      <ScannerModal show={showScanner} setShow={setShowScanner} setForm={setForm} setShowAddTransaction={setShowAddTransaction} showNotice={showNotice} />
      <SplitBillModal show={showSplitModal} setShow={setShowSplitModal} formatRupiah={formatRupiah} showNotice={showNotice} />
      <InsightModal show={showInsight} setShow={setShowInsight} categories={categories} allTransactions={allTransactions} stats={stats} formatRupiah={formatRupiah} />
      <ExportModal show={showExportModal} setShow={setShowExportModal} wallets={wallets} categories={categories} onExport={handleExportPDF} />
      <AddTransactionModal show={showAddTransaction} setShow={setShowAddTransaction} form={form} setForm={setForm} categories={categories} wallets={wallets} handleSave={handleSaveTransaction} formatRupiah={formatRupiah} t={t} getDynamicFontSize={getDynamicFontSize} />
      <AddCategoryModal show={showAddCategory} setShow={setShowAddCategory} newCat={newCat} setNewCat={setNewCat} handleNumpad={handleNumpad} handleSave={async () => { if(!newCat.name || !newCat.limit) return showNotice("Lengkapi data dulu, bro!", "error"); await addDoc(collection(db, "categories"), { ...newCat, limit: Number(newCat.limit), userId: user.uid, createdAt: new Date() }); setShowAddCategory(false); setNewCat({name:"", limit:""}); showNotice("Ditambahkan!"); }} formatRupiah={formatRupiah} t={t} getDynamicFontSize={getDynamicFontSize} />
      <AddSubModal show={showAddSub} setShow={setShowAddSub} newSub={newSub} setNewSub={setNewSub} handleSave={handleSaveSub} formatRupiah={formatRupiah} />
      <SecurityModal show={showSecurityModal} setShow={setShowSecurityModal} onUpdatePin={handleUpdatePin} />
      
      {/* INTERACTIVE TRANSACTION DETAIL MODAL */}
      <TransactionDetailModal 
        transaction={selectedTransaction} 
        onClose={() => setSelectedTransaction(null)} 
        onDelete={handleDeleteTransaction}
        formatRupiah={formatRupiah}
        wallets={wallets}
      />

      {toast.show && (
          <div className="fixed top-12 left-6 right-6 z-[99999] animate-in slide-in-from-top">
              <div className={`p-5 rounded-[2.5rem] shadow-2xl flex items-center gap-4 border backdrop-blur-xl ${toast.type === 'success' ? 'bg-green-500/90 border-green-400' : 'bg-red-500/90 border-red-400'} text-white`}>
                  <ShieldCheck size={24}/> <p className="text-[11px] font-black uppercase tracking-tight">{toast.msg}</p>
              </div>
          </div>
      )}
    </div>
  );
}

export default App;