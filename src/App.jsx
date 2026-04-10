import React, { useState, useEffect, useMemo } from "react";
import { auth, db } from "./lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { 
  Home as HomeIcon, Wallet as WalletIcon, User as UserIcon, Tag as TagIcon, Plus, Bell, Sun, Moon, BarChart3, X, Info, Sparkles, Loader2, Camera, Delete, ShieldCheck 
} from "lucide-react";
import { createWorker } from 'tesseract.js'; 
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Import Custom Pages & Utils
import Login from "./pages/Login";
import HomePage from "./pages/Home";
import WalletPage from "./pages/Wallet";
import CategoryPage from "./pages/Category";
import ProfilePage from "./pages/Profile";
import { TRANSLATIONS, formatRupiah } from "./utils/constants";
import ScannerModal from "./components/modals/ScannerModal";
import SplitBillModal from "./components/modals/SplitBillModal";
import InsightModal from "./components/modals/InsightModal";
import AddTransactionModal from "./components/modals/AddTransactionModal";
import AddCategoryModal from "./components/modals/AddCategoryModal";
import AddWalletModal from "./components/modals/AddWalletModal";

// Import Modal Baru
import NotificationModal from "./components/modals/NotificationModal";


function App() {
  const getDynamicFontSize = (length) => {
    if (length > 15) return "text-2xl";
    if (length > 12) return "text-3xl";
    if (length > 10) return "text-4xl";
    return "text-5xl";
  };

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  const [lang, setLang] = useState(() => localStorage.getItem("fin_lang") || "id");
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("fin_dark") === "true");
  const [historyFilter, setHistoryFilter] = useState("all"); 
  
  const [wallets, setWallets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]); 
  
  const [showInsight, setShowInsight] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const [form, setForm] = useState({ amount: "", category: "", type: "expense", walletId: "", note: "" });
  const [newWallet, setNewWallet] = useState({ name: "", type: "bank", balance: "" });
  const [newCat, setNewCat] = useState({ name: "", limit: "" });
  const [toast, setToast] = useState({ show: false, msg: "", type: "success" });

  const t = TRANSLATIONS[lang];

  const showNotice = (msg, type = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast(p => ({ ...p, show: false })), 3000);
  };

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubW = onSnapshot(query(collection(db, "wallets"), where("userId", "==", user.uid)), (s) => setWallets(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubC = onSnapshot(query(collection(db, "categories"), where("userId", "==", user.uid), orderBy("name", "asc")), (s) => setCategories(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubT = onSnapshot(query(collection(db, "transactions"), where("userId", "==", user.uid), orderBy("createdAt", "desc")), (s) => setAllTransactions(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubW(); unsubC(); unsubT(); };
  }, [user]);

  useEffect(() => {
    localStorage.setItem("fin_lang", lang);
    localStorage.setItem("fin_dark", darkMode);
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [lang, darkMode]);

  // --- LOGIC NOTIFIKASI OTOMATIS (Activity Center) ---
  const notifications = useMemo(() => {
    if (!user) return [];
    const notifs = [];

    // 1. Notif Transaksi Terbaru (3 Terakhir)
    allTransactions.slice(0, 3).forEach(tr => {
      notifs.push({
        id: `tr-${tr.id}`,
        type: tr.type === 'income' ? 'success' : 'transaction',
        title: tr.type === 'income' ? 'Cuan Masuk!' : 'Berhasil Bayar',
        desc: `${tr.category}: Rp ${formatRupiah(tr.amount)}`,
        time: tr.createdAt,
        icon: tr.type === 'income' ? '💰' : '💸'
      });
    });

    // 2. Notif Budget Kritis (>80%)
    categories.forEach(cat => {
      const spent = allTransactions
        .filter(tr => tr.category === cat.name && tr.type === 'expense')
        .reduce((a, b) => a + Number(b.amount), 0);
      const perc = (spent / cat.limit) * 100;

      if (perc >= 100) {
        notifs.push({
          id: `limit-${cat.id}`,
          type: 'danger',
          title: 'Budget Jebol!',
          desc: `Kategori ${cat.name} sudah melewati limit.`,
          time: new Date(),
          icon: '🚫'
        });
      } else if (perc >= 80) {
        notifs.push({
          id: `warn-${cat.id}`,
          type: 'warning',
          title: 'Dompet Tipis',
          desc: `Budget ${cat.name} sudah terpakai ${perc.toFixed(0)}%.`,
          time: new Date(),
          icon: '⚠️'
        });
      }
    });

    return notifs.sort((a, b) => {
      const timeA = a.time?.seconds ? a.time.seconds * 1000 : new Date(a.time).getTime();
      const timeB = b.time?.seconds ? b.time.seconds * 1000 : new Date(b.time).getTime();
      return timeB - timeA;
    });
  }, [allTransactions, categories, user]);

  // --- FIX LOGIC STATS ---
  const stats = useMemo(() => {
    // 1. Ambil saldo awal (balance statis) dari semua wallet
    const baseBalance = wallets.reduce((acc, w) => acc + (Number(w.balance) || 0), 0);
    
    // 2. Filter transaksi dengan pengecekan case-insensitive
    const inc = allTransactions
      .filter(tr => tr.type?.toLowerCase() === 'income')
      .reduce((a, b) => a + (Number(b.amount) || 0), 0);
      
    const exp = allTransactions
      .filter(tr => tr.type?.toLowerCase() === 'expense')
      .reduce((a, b) => a + (Number(b.amount) || 0), 0);

    return { 
      income: inc, 
      expense: exp, 
      balance: baseBalance + inc - exp 
    };
  }, [allTransactions, wallets]);

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
    // Gunakan lowercase untuk konsistensi filter
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

  const handleSaveCategory = async () => {
    if (!newCat.name || !newCat.limit) return showNotice("Isi nama & limit!", "error");
    await addDoc(collection(db, "categories"), { ...newCat, limit: Number(newCat.limit), userId: user.uid, createdAt: new Date() });
    setShowAddCategory(false); setNewCat({ name: "", limit: "" });
    showNotice("Kategori ditambahkan!");
  };

  const handleSaveWallet = async () => {
    if (!newWallet.name) return showNotice("Isi nama wallet!", "error");
    await addDoc(collection(db, "wallets"), { ...newWallet, balance: Number(newWallet.balance || 0), userId: user.uid, createdAt: new Date() });
    setShowAddWallet(false); setNewWallet({ name: "", type: "bank", balance: "" });
    showNotice("Wallet ditambahkan!");
  };

  const exportPDF = () => {
  const doc = new jsPDF();
  const dateStr = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
  
  // 1. DESIGN HEADER - Biru Premium
  doc.setFillColor(30, 64, 175); // Dark Blue ala Bank Digital
  doc.rect(0, 0, 210, 50, 'F');
  
  // Branding FinansialKu
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("FINANSIALKU.", 15, 25);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Laporan Keuangan Digital Personal", 15, 32);
  doc.text(`Dicetak pada: ${dateStr}`, 15, 37);

  // 2. SUMMARY SECTION (Inside Header)
  doc.setFillColor(255, 255, 255, 0.1);
  doc.roundedRect(140, 10, 55, 30, 3, 3, 'F');
  doc.setFontSize(9);
  doc.text("TOTAL BALANCE", 145, 18);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`Rp ${formatRupiah(stats.balance)}`, 145, 28);

  // 3. TRANSACTION TABLE - Desain Clean ala History Dashboard
  autoTable(doc, {
    startY: 60,
    head: [['TANGGAL & JAM', 'KATEGORI', 'KETERANGAN', 'TIPE', 'NOMINAL']],
    body: allTransactions.map(tr => {
      const dateObj = tr.createdAt.seconds ? new Date(tr.createdAt.seconds * 1000) : new Date(tr.createdAt);
      const formattedDate = dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      const formattedTime = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      
      return [
        `${formattedDate} | ${formattedTime}`,
        tr.category.toUpperCase(),
        tr.note || '-',
        tr.type === 'income' ? 'PEMASUKAN' : 'PENGELUARAN',
        { 
          content: `${tr.type === 'income' ? '+' : '-'} Rp ${formatRupiah(tr.amount)}`,
          styles: { textColor: tr.type === 'income' ? [16, 185, 129] : [225, 29, 72], fontStyle: 'bold' }
        }
      ];
    }),
    
    // Styling Tabel agar selaras dengan UI Dashboard
    theme: 'striped',
    headStyles: { 
      fillColor: [30, 64, 175], 
      textColor: [255, 255, 255], 
      fontSize: 10, 
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: 5
    },
    bodyStyles: { 
      fontSize: 9, 
      cellPadding: 5,
      textColor: [51, 65, 85] // Slate 700
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { fontStyle: 'bold' },
      4: { halign: 'right' }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // Slate 50
    },
    margin: { left: 15, right: 15 }
  });

  // 4. FOOTER
  const finalY = doc.lastAutoTable.finalY || 70;
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.setFont("helvetica", "italic");
  doc.text("Laporan ini dibuat secara otomatis melalui aplikasi FinansialKu.", 15, finalY + 15);

  doc.save(`Laporan_FinansialKu_${new Date().getTime()}.pdf`);
};

  const shareWhatsApp = async () => {
  const doc = new jsPDF();
  const dateStr = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
  const fileName = `Laporan_FinansialKu_${new Date().getTime()}.pdf`;

  // --- LOGIK DESIGN PDF (Sama persis dengan exportPDF agar konsisten) ---
  doc.setFillColor(30, 64, 175);
  doc.rect(0, 0, 210, 50, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("FINANSIALKU.", 15, 25);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Laporan Keuangan Digital Personal", 15, 32);
  
  // Summary Box
  doc.setFillColor(255, 255, 255, 0.1);
  doc.roundedRect(140, 10, 55, 30, 3, 3, 'F');
  doc.setFontSize(9);
  doc.text("TOTAL BALANCE", 145, 18);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`Rp ${formatRupiah(stats.balance)}`, 145, 28);

  // Table
  autoTable(doc, {
    startY: 60,
    head: [['TANGGAL & JAM', 'KATEGORI', 'KETERANGAN', 'TIPE', 'NOMINAL']],
    body: allTransactions.map(tr => {
      const dateObj = tr.createdAt.seconds ? new Date(tr.createdAt.seconds * 1000) : new Date(tr.createdAt);
      const fDate = dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      const fTime = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      return [
        `${fDate} | ${fTime}`,
        tr.category.toUpperCase(),
        tr.note || '-',
        tr.type === 'income' ? 'PEMASUKAN' : 'PENGELUARAN',
        { 
          content: `${tr.type === 'income' ? '+' : '-'} Rp ${formatRupiah(tr.amount)}`,
          styles: { textColor: tr.type === 'income' ? [16, 185, 129] : [225, 29, 72], fontStyle: 'bold' }
        }
      ];
    }),
    theme: 'striped',
    headStyles: { fillColor: [30, 64, 175], fontSize: 10, fontStyle: 'bold', halign: 'center' },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 4: { halign: 'right' } }
  });

  // --- PROSES SHARING FILE PDF ---
  try {
    const pdfBlob = doc.output('blob');
    const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

    // Cek apakah browser mendukung fitur Share File
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: 'Laporan Keuangan FinansialKu',
        text: `Halo, ini laporan keuangan saya per tanggal ${dateStr}.`,
      });
    } else {
      // Fallback jika browser tidak support (biasanya di browser jadul/desktop tertentu)
      doc.save(fileName);
      showNotice("Browser tdk support share file, PDF otomatis di-download", "info");
    }
  } catch (error) {
    console.error('Error sharing:', error);
    doc.save(fileName);
  }
};

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900 text-blue-600 font-black text-2xl animate-pulse italic uppercase tracking-tighter">FinansialKu</div>;
  if (!user) return <Login />;

  return (
    <div className={`min-h-screen flex flex-col max-w-md mx-auto transition-all ${darkMode ? 'bg-slate-900 text-white' : 'bg-[#F8F9FE] text-slate-900'}`}>
      
      {activeTab === "home" && (
        <div className="px-6 pt-12 pb-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg"><BarChart3 size={20}/></div>
              <h1 className="text-xl font-black tracking-tighter italic">FINANSIALKU.</h1>
          </div>
          <div className="flex items-center gap-2">
              <button onClick={() => setShowNotif(true)} className="relative p-2 text-slate-400 active:scale-90 transition-all">
                  <Bell size={22}/>
                  {notifications.length > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#F8F9FE] dark:border-slate-900"></span>
                  )}
              </button>
              <button onClick={() => setDarkMode(!darkMode)} className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">{darkMode ? <Sun size={20} className="text-yellow-400"/> : <Moon size={20} className="text-slate-600"/>}</button>
          </div>
        </div>
      )}

      <div className={`flex-1 overflow-y-auto no-scrollbar pb-32 ${activeTab === "home" ? "px-6" : ""}`}>
        {activeTab === "home" && (
            <HomePage stats={stats} t={t} formatRupiah={formatRupiah} showBalance={showBalance} setShowBalance={setShowBalance}
              setShowScanner={setShowScanner} setShowSplitModal={setShowSplitModal} setShowInsight={setShowInsight}
              categories={categories} allTransactions={allTransactions} historyFilter={historyFilter} setHistoryFilter={setHistoryFilter}
              setShowNotif={setShowNotif} exportPDF={exportPDF} shareWhatsApp={shareWhatsApp}
            />
        )}
        {activeTab === "wallet" && <WalletPage wallets={wallets} allTransactions={allTransactions} formatRupiah={formatRupiah} setShowAddWallet={setShowAddWallet} t={t} />}
        {activeTab === "category" && <CategoryPage categories={categories} allTransactions={allTransactions} formatRupiah={formatRupiah} setShowAddCategory={setShowAddCategory} t={t} />}
        {activeTab === "profile" && <ProfilePage user={user} t={t} lang={lang} setLang={setLang} darkMode={darkMode} setDarkMode={setDarkMode} setActiveTab={setActiveTab} exportPDF={exportPDF} />}
      </div>

      <div className="fixed bottom-8 left-6 right-6 z-[100]">
          <div className="bg-white dark:bg-slate-800 h-20 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-around px-4">
                <button onClick={() => setActiveTab('home')} className={`p-4 rounded-2xl transition-all ${activeTab === 'home' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-300'}`}><HomeIcon size={24}/></button>
                <button onClick={() => setActiveTab('category')} className={`p-4 rounded-2xl transition-all ${activeTab === 'category' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-300'}`}><TagIcon size={24}/></button>
                <button onClick={() => setShowAddTransaction(true)} className="w-14 h-14 bg-slate-900 dark:bg-blue-600 rounded-full flex items-center justify-center text-white shadow-xl -mt-12 border-4 border-[#F8F9FE] dark:border-slate-900 active:scale-90 transition-all shadow-blue-500/30"><Plus size={32}/></button>
                <button onClick={() => setActiveTab('wallet')} className={`p-4 rounded-2xl transition-all ${activeTab === 'wallet' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-300'}`}><WalletIcon size={24}/></button>
                <button onClick={() => setActiveTab('profile')} className={`p-4 rounded-2xl transition-all ${activeTab === 'profile' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-300'}`}><UserIcon size={24}/></button>
          </div>
      </div>

      <NotificationModal show={showNotif} setShow={setShowNotif} notifications={notifications} formatRupiah={formatRupiah} />
      <ScannerModal show={showScanner} setShow={setShowScanner} darkMode={darkMode} setIsScanning={setIsScanning} isScanning={isScanning} setForm={setForm} setShowAddTransaction={setShowAddTransaction} showNotice={showNotice} />
      <SplitBillModal show={showSplitModal} setShow={setShowSplitModal} darkMode={darkMode} formatRupiah={formatRupiah} getDynamicFontSize={getDynamicFontSize} />
      <InsightModal show={showInsight} setShow={setShowInsight} darkMode={darkMode} categories={categories} allTransactions={allTransactions} stats={stats} formatRupiah={formatRupiah} />
      <AddTransactionModal show={showAddTransaction} setShow={setShowAddTransaction} form={form} setForm={setForm} categories={categories} wallets={wallets} handleNumpad={handleNumpad} handleSave={handleSaveTransaction} formatRupiah={formatRupiah} getDynamicFontSize={getDynamicFontSize} t={t} />

      <AddCategoryModal 
        show={showAddCategory} setShow={setShowAddCategory} newCat={newCat} setNewCat={setNewCat}
        handleNumpad={handleNumpad} handleSave={handleSaveCategory} formatRupiah={formatRupiah} t={t}
        getDynamicFontSize={getDynamicFontSize}
      />

      <AddWalletModal 
        show={showAddWallet} setShow={setShowAddWallet} newWallet={newWallet} setNewWallet={setNewWallet}
        handleNumpad={handleNumpad} handleSave={handleSaveWallet} formatRupiah={formatRupiah} t={t}
        getDynamicFontSize={getDynamicFontSize}
      />

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