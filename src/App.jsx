import React, { useState, useEffect, useMemo } from "react";
import { auth, db } from "./lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, onSnapshot, query, where, orderBy, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { 
  Home as HomeIcon, Wallet as WalletIcon, User as UserIcon, Tag as TagIcon, Plus, Bell, Sun, Moon, BarChart3, X, Info, Sparkles, Loader2, Camera, Delete, ShieldCheck,
  RefreshCcw 
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Import Custom Pages & Utils
import Login from "./pages/Login";
import HomePage from "./pages/Home";
import WalletPage from "./pages/Wallet";
import CategoryPage from "./pages/Category";
import ProfilePage from "./pages/Profile";
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
import SecurityLock from "./components/SecurityLock";

function App() {
  // --- 1. SECURITY & AUTH STATES (RESTORED) ---
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(true); 

  // --- 2. UI & DATA STATES (COMPLETE) ---
  const [activeTab, setActiveTab] = useState("home");
  const [lang, setLang] = useState(() => localStorage.getItem("fin_lang") || "id");
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("fin_dark") === "true");
  const [historyFilter, setHistoryFilter] = useState("all"); 
  const [selectedDate, setSelectedDate] = useState(""); 
  
  const [wallets, setWallets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]); 
  const [subscriptions, setSubscriptions] = useState([]); 
  
  const [showInsight, setShowInsight] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddSub, setShowAddSub] = useState(false); 
  const [showNotif, setShowNotif] = useState(false);

  const [form, setForm] = useState({ amount: "", category: "", type: "expense", walletId: "", note: "" });
  const [newWallet, setNewWallet] = useState({ name: "", type: "bank", balance: "" });
  const [newSub, setNewSub] = useState({ name: "", price: "", dueDay: "" }); 
  const [editingWalletId, setEditingWalletId] = useState(null);
  const [newCat, setNewCat] = useState({ name: "", limit: "" });
  const [toast, setToast] = useState({ show: false, msg: "", type: "success" });

  const t = TRANSLATIONS[lang];

  // Helper UI (RE-ADDED)
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

  // --- 3. LISTENERS & EFFECTS (FULL RESTORED) ---
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

  // --- 4. DATA LOGIC ---
  const stats = useMemo(() => {
    const baseBalance = wallets.reduce((acc, w) => acc + (Number(w.balance) || 0), 0);
    const inc = allTransactions.filter(tr => tr.type === 'income').reduce((a, b) => a + (Number(b.amount) || 0), 0);
    const exp = allTransactions.filter(tr => tr.type === 'expense').reduce((a, b) => a + (Number(b.amount) || 0), 0);
    return { income: inc, expense: exp, balance: baseBalance + inc - exp };
  }, [allTransactions, wallets]);

  // --- 5. HANDLERS (FULL RESTORED) ---
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
    if (!form.amount || !form.category || !form.walletId) return showNotice("Data incomplete!", "error");
    await addDoc(collection(db, "transactions"), { ...form, type: form.type.toLowerCase(), amount: Number(form.amount), userId: user.uid, createdAt: new Date() });
    setShowAddTransaction(false); 
    setForm({ amount: "", category: "", type: "expense", walletId: "", note: "" });
    showNotice("Tersimpan!");
  };

  const handleSaveWallet = async (walletData) => {
    if (!walletData.name) return showNotice("Isi nama wallet!", "error");
    const payload = { name: walletData.name, type: walletData.type, balance: Number(walletData.balance || 0), userId: user.uid, updatedAt: new Date() };
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

  // --- 6. POWERFULL PDF LOGIC (FIXED) ---
  const shareWhatsApp = async () => {
    try {
        const docPDF = new jsPDF();
        const fileName = `Laporan_Keuangan_${new Date().getTime()}.pdf`;
        
        // Header Dark Style
        docPDF.setFillColor(15, 23, 42); 
        docPDF.rect(0, 0, 210, 50, 'F');
        docPDF.setTextColor(255, 255, 255);
        docPDF.setFontSize(22);
        docPDF.setFont("helvetica", "bold");
        docPDF.text("FINANSIALKU REPORT", 15, 30);
        
        docPDF.setFontSize(10);
        docPDF.text(`Laporan Ringkasan - ${new Date().toLocaleString()}`, 15, 40);

        // Body Content
        docPDF.setTextColor(15, 23, 42);
        docPDF.setFontSize(14);
        docPDF.text("RINGKASAN SALDO", 15, 65);
        docPDF.setFontSize(12);
        docPDF.text(`Total Balance: Rp ${formatRupiah(stats.balance)}`, 15, 75);

        const walletData = wallets.map(w => {
            const inc = allTransactions.filter(tr => tr.walletId === w.id && tr.type === 'income').reduce((a, b) => a + Number(b.amount || 0), 0);
            const exp = allTransactions.filter(tr => tr.walletId === w.id && tr.type === 'expense').reduce((a, b) => a + Number(b.amount || 0), 0);
            return [w.name.toUpperCase(), w.type.toUpperCase(), `Rp ${formatRupiah(Number(w.balance || 0) + inc - exp)}` ];
        });

        autoTable(docPDF, {
            startY: 85,
            head: [['NAMA DOMPET', 'TIPE', 'SALDO AKHIR']],
            body: walletData,
            theme: 'grid',
            headStyles: { fillColor: [37, 99, 235] }
        });

        const transData = allTransactions.slice(0, 25).map(tr => [
            tr.createdAt?.seconds ? new Date(tr.createdAt.seconds * 1000).toLocaleDateString() : '-',
            tr.category.toUpperCase(),
            tr.type.toUpperCase(),
            `Rp ${formatRupiah(tr.amount)}`
        ]);

        autoTable(docPDF, {
            startY: docPDF.lastAutoTable.finalY + 15,
            head: [['TANGGAL', 'KATEGORI', 'TIPE', 'NOMINAL']],
            body: transData,
            theme: 'striped',
            headStyles: { fillColor: [15, 23, 42] }
        });

        docPDF.save(fileName);
        showNotice("PDF Berhasil diunduh!");
    } catch (err) {
        showNotice("Gagal membuat PDF", "error");
    }
  };

  // --- 7. RENDER ---
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-blue-600 font-black text-2xl animate-pulse italic uppercase tracking-tighter">FinansialKu</div>;
  if (!user) return <Login />;
  if (isLocked) return <SecurityLock onUnlock={() => setIsLocked(false)} />;

  return (
    <div className={`min-h-screen flex flex-col max-w-md mx-auto transition-all ${darkMode ? 'bg-slate-900 text-white' : 'bg-[#F8F9FE] text-slate-900'}`}>
      
      {activeTab !== "profile" && (
        <div className="fixed top-0 left-0 right-0 max-w-md mx-auto z-50 px-6 pt-12 pb-4 flex justify-between items-center bg-inherit border-b border-transparent dark:border-white/5">
          <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20"><BarChart3 size={20}/></div>
              <h1 className="text-xl font-black tracking-tighter italic">FINANSIALKU.</h1>
          </div>
          <div className="flex items-center gap-2">
              <button onClick={() => setActiveTab('profile')} className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 active:scale-90 transition-all text-slate-600 dark:text-slate-300"><UserIcon size={20}/></button>
              <button onClick={() => setDarkMode(!darkMode)} className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 active:scale-90 transition-all">{darkMode ? <Sun size={20} className="text-yellow-400"/> : <Moon size={20} className="text-slate-600"/>}</button>
          </div>
        </div>
      )}

      <div className={`flex-1 overflow-y-auto no-scrollbar pb-32 ${activeTab === "home" ? "px-6" : ""} ${activeTab !== "profile" ? "pt-28" : ""}`}>
        {activeTab === "home" && <HomePage stats={stats} t={t} formatRupiah={formatRupiah} showBalance={showBalance} setShowBalance={setShowBalance} setShowScanner={setShowScanner} setShowSplitModal={setShowSplitModal} setShowInsight={setShowInsight} categories={categories} allTransactions={allTransactions} historyFilter={historyFilter} setHistoryFilter={setHistoryFilter} setShowNotif={setShowNotif} shareWhatsApp={shareWhatsApp} selectedDate={selectedDate} setSelectedDate={setSelectedDate} handleDeleteTransaction={async (id) => { if(window.confirm("Hapus?")) { await deleteDoc(doc(db, "transactions", id)); showNotice("Dihapus!"); } }} />}
        
        {activeTab === "wallet" && (
          <WalletPage 
            wallets={wallets} 
            allTransactions={allTransactions} 
            formatRupiah={formatRupiah} 
            showAddWallet={showAddWallet}
            setShowAddWallet={setShowAddWallet} 
            handleDeleteWallet={async (id) => { if(window.confirm("Hapus?")) { await deleteDoc(doc(db, "wallets", id)); showNotice("Dihapus!"); } }} 
            handleEditWallet={(w) => { setEditingWalletId(w.id); setShowAddWallet(true); }}
            onAddWallet={handleSaveWallet}
            onUpdateWallet={handleSaveWallet}
            editingWallet={wallets.find(w => w.id === editingWalletId)}
            setEditingWallet={(val) => setEditingWalletId(val?.id || null)}
          />
        )}
        
        {activeTab === "category" && <CategoryPage categories={categories} allTransactions={allTransactions} formatRupiah={formatRupiah} setShowAddCategory={setShowAddCategory} t={t} handleDeleteCategory={async (id) => { if(window.confirm("Hapus?")) { await deleteDoc(doc(db, "categories", id)); showNotice("Dihapus!"); } }} />}
        {activeTab === "recurring" && <SubscriptionPage subs={subscriptions} formatRupiah={formatRupiah} setShowAddSub={setShowAddSub} handleDeleteSub={async (id) => { if(window.confirm("Hapus?")) { await deleteDoc(doc(db, "subscriptions", id)); showNotice("Dihapus!"); } }} />}
        {activeTab === "profile" && <ProfilePage user={user} t={t} lang={lang} setLang={setLang} darkMode={darkMode} setDarkMode={setDarkMode} setActiveTab={setActiveTab} shareWhatsApp={shareWhatsApp} />}
      </div>

      <div className="fixed bottom-8 left-6 right-6 z-[100]">
          <div className="bg-white dark:bg-slate-800 h-20 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-around px-4">
                <button onClick={() => setActiveTab('home')} className={`p-4 rounded-2xl transition-all ${activeTab === 'home' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40' : 'text-slate-300'}`}><HomeIcon size={24}/></button>
                <button onClick={() => setActiveTab('category')} className={`p-4 rounded-2xl transition-all ${activeTab === 'category' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40' : 'text-slate-300'}`}><TagIcon size={24}/></button>
                <button onClick={() => setShowAddTransaction(true)} className="w-14 h-14 bg-slate-950 dark:bg-blue-600 rounded-full flex items-center justify-center text-white shadow-xl -mt-12 border-4 border-[#F8F9FE] dark:border-slate-900 active:scale-95 transition-all"><Plus size={32}/></button>
                <button onClick={() => setActiveTab('recurring')} className={`p-4 rounded-2xl transition-all ${activeTab === 'recurring' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40' : 'text-slate-300'}`}><RefreshCcw size={24}/></button>
                <button onClick={() => setActiveTab('wallet')} className={`p-4 rounded-2xl transition-all ${activeTab === 'wallet' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40' : 'text-slate-300'}`}><WalletIcon size={24}/></button>
          </div>
      </div>

      {/* MODALS SECTION */}
      <NotificationModal show={showNotif} setShow={setShowNotif} notifications={allTransactions.slice(0,3)} formatRupiah={formatRupiah} />
      <ScannerModal show={showScanner} setShow={setShowScanner} setForm={setForm} setShowAddTransaction={setShowAddTransaction} showNotice={showNotice} />
      <SplitBillModal show={showSplitModal} setShow={setShowSplitModal} darkMode={darkMode} formatRupiah={formatRupiah} />
      <InsightModal show={showInsight} setShow={setShowInsight} categories={categories} allTransactions={allTransactions} stats={stats} formatRupiah={formatRupiah} />
      <AddTransactionModal show={showAddTransaction} setShow={setShowAddTransaction} form={form} setForm={setForm} categories={categories} wallets={wallets} handleSave={handleSaveTransaction} formatRupiah={formatRupiah} t={t} getDynamicFontSize={getDynamicFontSize} />
      <AddCategoryModal show={showAddCategory} setShow={setShowAddCategory} newCat={newCat} setNewCat={setNewCat} handleNumpad={handleNumpad} handleSave={async () => { await addDoc(collection(db, "categories"), { ...newCat, limit: Number(newCat.limit), userId: user.uid, createdAt: new Date() }); setShowAddCategory(false); setNewCat({name:"", limit:""}); showNotice("Ditambahkan!"); }} formatRupiah={formatRupiah} t={t} getDynamicFontSize={getDynamicFontSize} />
      <AddSubModal show={showAddSub} setShow={setShowAddSub} newSub={newSub} setNewSub={setNewSub} handleSave={async () => { await addDoc(collection(db, "subscriptions"), { ...newSub, userId: user.uid, createdAt: new Date() }); setShowAddSub(false); setNewSub({ name: "", price: "", dueDay: "" }); showNotice("Berhasil!"); }} formatRupiah={formatRupiah} />

      {toast.show && (
          <div className="fixed top-12 left-6 right-6 z-[9999] animate-in slide-in-from-top">
              <div className={`p-5 rounded-[2.5rem] shadow-2xl flex items-center gap-4 border backdrop-blur-xl ${toast.type === 'success' ? 'bg-green-500/90 border-green-400' : 'bg-red-500/90 border-red-400'} text-white`}>
                  <ShieldCheck size={24}/> <p className="text-[11px] font-black uppercase tracking-tight">{toast.msg}</p>
              </div>
          </div>
      )}
    </div>
  );
}

export default App;