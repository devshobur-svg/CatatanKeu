import React, { useState, useEffect, useMemo, useRef } from "react";
import { auth, db } from "./lib/firebase";
import { onAuthStateChanged, signOut, deleteUser } from "firebase/auth";
import { 
  collection, addDoc, onSnapshot, query, where, 
  orderBy, serverTimestamp, deleteDoc, doc, getDocs, Timestamp, updateDoc
} from "firebase/firestore";
import { 
  PlusCircle, ArrowUpCircle, ArrowDownCircle, 
  LogOut, Trash2, Wallet as WalletIcon, X, Sparkles, Sun, Moon, 
  FileText, Home, LayoutGrid, User, Settings, Download, Send, Bot, ShieldCheck, Bell, HelpCircle, ChevronRight
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Login from "./pages/Login";

const TRANSLATIONS = {
  id: {
    wealth: "Total Kekayaan",
    income: "Pemasukan",
    expense: "Pengeluaran",
    newTag: "+ BARU",
    activity: "Aktivitas Hari Ini",
    export: "Unduh PDF",
    commit: "Simpan Transaksi",
    consult: "Konsultasi AI Advisor",
    myWallets: "Dompet Saya",
    addWallet: "Tambah Rekening",
    settings: "Pengaturan Akun",
    delAccount: "Hapus Akun Permanen"
  },
  en: {
    wealth: "Total Wealth",
    income: "Income",
    expense: "Expense",
    newTag: "+ NEW",
    activity: "Today's Activity",
    export: "Download PDF",
    commit: "Save Transaction",
    consult: "AI Advisor Consult",
    myWallets: "My Wallets",
    addWallet: "Add Wallet",
    settings: "Account Settings",
    delAccount: "Delete Account Permanently"
  }
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("home");

  // Data States
  const [todayTransactions, setTodayTransactions] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]); 
  
  // UI States
  const [darkMode, setDarkMode] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAIConsult, setShowAIConsult] = useState(false);
  
  // AI Chat States
  const [chatMessages, setChatMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Input States
  const [newWalletName, setNewWalletName] = useState("");
  const [newCatName, setNewCatName] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [form, setForm] = useState({ amount: "", category: "", type: "expense", walletId: "" });
  const [lang, setLang] = useState('id');

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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfToday = Timestamp.fromDate(today);

    onSnapshot(query(collection(db, "wallets"), where("userId", "==", user.uid)), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setWallets(data);
      if (data.length > 0 && !form.walletId) setForm(f => ({...f, walletId: data[0].id}));
    });

    onSnapshot(query(collection(db, "categories"), where("userId", "==", user.uid), orderBy("name", "asc")), (snap) => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    onSnapshot(query(collection(db, "transactions"), where("userId", "==", user.uid), where("createdAt", ">=", startOfToday), orderBy("createdAt", "desc")), (snap) => {
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

  // --- PDF EXPORT WITH GROUPING BY WALLET (FIXED & IMPROVED) ---
  const exportPDF = async () => {
    const doc = new jsPDF();
    const start = Timestamp.fromDate(new Date(startDate + "T00:00:00"));
    const end = Timestamp.fromDate(new Date(endDate + "T23:59:59"));
    
    // Ambil data transaksi dalam rentang waktu
    const qExport = query(
      collection(db, "transactions"),
      where("userId", "==", user.uid),
      where("createdAt", ">=", start),
      where("createdAt", "<=", end),
      orderBy("createdAt", "desc")
    );
    
    const snap = await getDocs(qExport);
    const rawData = snap.docs.map(d => d.data());

    // Desain Header Sky Blue ala Dashboard
    doc.setFillColor(14, 165, 233); 
    doc.rect(0, 0, 210, 45, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("LAPORAN KEUANGAN DETAIL", 15, 22);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Periode: ${startDate} s/d ${endDate}`, 15, 32);
    doc.text(`Email Pengguna: ${user.email}`, 15, 37);

    let finalY = 55;

    // Looping per Wallet untuk grouping
    wallets.forEach((wallet) => {
      const walletTrans = rawData.filter(t => t.walletId === wallet.id);
      
      if (walletTrans.length > 0) {
        // Cek jika halaman tidak cukup
        if (finalY > 250) {
          doc.addPage();
          finalY = 20;
        }

        doc.setTextColor(14, 165, 233);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(`SUMBER DANA: ${wallet.name.toUpperCase()}`, 15, finalY);
        
        const rows = walletTrans.map(tr => [
          tr.createdAt?.seconds ? new Date(tr.createdAt.seconds * 1000).toLocaleDateString('id-ID') : '-',
          tr.category.toUpperCase(),
          tr.type === 'income' ? 'MASUK' : 'KELUAR',
          `Rp ${tr.amount.toLocaleString('id-ID')}`
        ]);

        autoTable(doc, {
          startY: finalY + 5,
          head: [['TANGGAL', 'KATEGORI', 'TIPE', 'NOMINAL']],
          body: rows,
          headStyles: { fillColor: [14, 165, 233], textColor: [255, 255, 255] },
          styles: { fontSize: 9 },
          didParseCell: (data) => {
            if (data.column.index === 2 && data.cell.section === 'body') {
              if (data.cell.text[0] === 'MASUK') data.cell.styles.textColor = [34, 197, 94];
              if (data.cell.text[0] === 'KELUAR') data.cell.styles.textColor = [239, 68, 68];
            }
          }
        });
        finalY = doc.lastAutoTable.finalY + 15;
      }
    });

    // Ringkasan Akhir
    if (finalY > 240) { doc.addPage(); finalY = 20; }
    doc.setDrawColor(200, 200, 200);
    doc.line(15, finalY, 195, finalY);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Total Pemasukan: Rp ${stats.income.toLocaleString('id-ID')}`, 15, finalY + 10);
    doc.text(`Total Pengeluaran: Rp ${stats.expense.toLocaleString('id-ID')}`, 15, finalY + 16);
    doc.setFont("helvetica", "bold");
    doc.text(`SALDO AKHIR PERIODE: Rp ${stats.balance.toLocaleString('id-ID')}`, 15, finalY + 24);

    doc.save(`Laporan_Keuangan_${startDate}.pdf`);
    setShowExportModal(false);
  };

  // --- CRUD Wallet ---
  const handleAddWallet = async () => {
    if (!newWalletName.trim()) return;
    await addDoc(collection(db, "wallets"), { name: newWalletName, userId: user.uid, createdAt: serverTimestamp() });
    setNewWalletName(""); setShowAddWallet(false);
  };

  const handleDeleteWallet = async (id) => {
    if (window.confirm("Hapus dompet ini?")) await deleteDoc(doc(db, "wallets", id));
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Hapus akun permanen?")) {
      try { await deleteUser(auth.currentUser); } 
      catch (err) { alert("Sesi habis, silakan login ulang."); signOut(auth); }
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    const newMsg = { role: "user", content: userInput };
    setChatMessages(prev => [...prev, newMsg]);
    setUserInput("");
    setIsTyping(true);
    setTimeout(() => {
      let aiResponse = `Berdasarkan saldo Anda Rp ${stats.balance.toLocaleString()}, pertahankan rasio tabungan 20%.`;
      setChatMessages(prev => [...prev, { role: "assistant", content: aiResponse }]);
      setIsTyping(false);
    }, 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || !form.category || !form.walletId) return alert("Lengkapi data!");
    await addDoc(collection(db, "transactions"), { ...form, amount: Number(form.amount), userId: user.uid, createdAt: serverTimestamp() });
    setForm({ ...form, amount: "", category: "", type: "expense", walletId: wallets[0]?.id || "" });
    setShowAddTransaction(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-sky-500 text-white font-black italic tracking-tighter uppercase">FINANSIALKU</div>;
  if (!user) return <Login />;

  return (
    <div className={`min-h-screen flex flex-col max-w-md mx-auto relative overflow-hidden ${darkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-800'} font-sans`}>
      
      {/* HEADER - UPDATED DESIGN: Logo and wording moved inside the blue box */}
      <div className="bg-sky-500 pt-10 pb-36 px-6 rounded-b-[3.5rem] shadow-lg relative z-20">
        <div className="flex justify-between items-center mb-10"> {/* mb-10 for better vertical spacing with wording inside */}
          <div className="flex items-center gap-2.5">
            {/* Logo inside blue header */}
            <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-sky-500 font-black shadow-sm z-30 relative">F</div>
            {/* Wording inside blue header - changed to text-white */}
            <h1 className="text-white font-black text-xl italic tracking-tight z-30 relative">FinansialKu.</h1>
          </div>
          <button onClick={() => signOut(auth)} className="text-white/90 p-2.5 bg-white/10 rounded-xl hover:bg-white/20 transition-colors z-30 relative">
            <LogOut size={20}/>
          </button>
        </div>
        
        <div className="flex justify-around text-white/90 text-[10px] font-black uppercase tracking-[0.2em] z-30 relative mb-4">
          <button onClick={() => setActiveTab("home")} className={`${activeTab === 'home' ? 'border-b-2 border-white pb-1.5' : 'opacity-70'}`}>Beranda</button>
          <button onClick={() => setLang(lang === 'id' ? 'en' : 'id')} className="opacity-70">{lang.toUpperCase()}</button>
          <button onClick={() => setActiveTab("profile")} className={`${activeTab === 'profile' ? 'border-b-2 border-white pb-1.5' : 'opacity-70'}`}>Akun</button>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className={`flex-1 px-5 -mt-28 z-30 pb-32 overflow-y-auto no-scrollbar`}>
        {activeTab === "home" && (
          <div className="space-y-6 relative z-30"> {/* Added z-30 to make sure it floats above blue area */}
            <div className="bg-white rounded-[2rem] p-7 shadow-2xl border border-slate-50">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs font-bold uppercase text-slate-400">
                  <span>{t.income}</span>
                  <span className="text-green-500">Rp {stats.income.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold uppercase text-slate-400">
                  <span>{t.expense}</span>
                  <span className="text-red-500">-Rp {stats.expense.toLocaleString('id-ID')}</span>
                </div>
                <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                  <span className="text-slate-600 font-black text-sm">Total Saldo</span>
                  <span className="text-sky-600 text-3xl font-black italic tracking-tighter">Rp {stats.balance.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setShowAIConsult(true)} className="bg-sky-500 text-white p-4.5 rounded-2xl flex items-center justify-center gap-2.5 font-black text-[10px] uppercase shadow-lg shadow-sky-100 active:scale-95 transition-all"><Bot size={18}/> {t.consult}</button>
              <button onClick={() => setShowExportModal(true)} className="bg-orange-500 text-white p-4.5 rounded-2xl flex items-center justify-center gap-2.5 font-black text-[10px] uppercase shadow-lg shadow-orange-100 active:scale-95 transition-all"><FileText size={18}/> Laporan</button>
            </div>

            <div className="space-y-4">
              <h3 className="font-black text-slate-800 text-xs px-1 opacity-50 uppercase italic">{t.activity}</h3>
              {todayTransactions.map(tr => (
                <div key={tr.id} className="bg-white p-4 rounded-2xl flex justify-between items-center border border-slate-50 shadow-sm transition-all hover:shadow-md">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tr.type === 'income' ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>{tr.type === 'income' ? <ArrowUpCircle size={18}/> : <ArrowDownCircle size={18}/>}</div>
                    <div><p className="font-bold text-xs">{tr.category}</p><p className="text-[8px] text-slate-300 font-bold uppercase">{wallets.find(w => w.id === tr.walletId)?.name || "General"}</p></div>
                  </div>
                  <p className={`font-black text-xs ${tr.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>Rp {tr.amount.toLocaleString('id-ID')}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WALLET TAB */}
        {activeTab === "wallet" && (
          <div className="space-y-6">
            <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-slate-50">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-black text-slate-800 italic tracking-tighter">{t.myWallets}</h2>
                <button onClick={() => setShowAddWallet(true)} className="bg-sky-500 text-white p-2 rounded-xl active:scale-90 transition-all"><PlusCircle size={20}/></button>
              </div>
              <div className="space-y-4">
                {wallets.map(w => (
                  <div key={w.id} className="p-5 rounded-3xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-sky-100 text-sky-500 rounded-2xl flex items-center justify-center"><WalletIcon size={24}/></div>
                      <div>
                        <p className="font-black text-xs text-slate-700">{w.name.toUpperCase()}</p>
                        <p className="font-bold text-sky-600 text-sm">Rp {allTransactions.filter(tr => tr.walletId === w.id).reduce((a, b) => a + (b.type === 'income' ? b.amount : -b.amount), 0).toLocaleString('id-ID')}</p>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteWallet(w.id)} className="text-slate-300 hover:text-red-500 active:scale-90 transition-all"><Trash2 size={18}/></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-50 text-center relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-sky-50 rounded-full blur-2xl group-hover:bg-sky-100 transition-colors"></div>
              <div className="w-24 h-24 bg-sky-100 rounded-full mx-auto mb-4 flex items-center justify-center text-sky-500 border-4 border-white shadow-lg relative z-10"><User size={48}/></div>
              <h2 className="font-black text-slate-800 tracking-tight relative z-10">{user.email}</h2>
              <p className="text-sky-500 text-[10px] font-black tracking-widest uppercase italic relative z-10">Platinum Member</p>
            </div>

            <div className="bg-white rounded-[2rem] p-4 shadow-xl border border-slate-50 divide-y divide-slate-50 overflow-hidden">
                {[
                  { icon: <Bell size={18}/>, label: "Notifikasi", color: "text-blue-500" },
                  { icon: <ShieldCheck size={18}/>, label: "Keamanan", color: "text-green-500" },
                  { icon: <HelpCircle size={18}/>, label: "Bantuan", color: "text-orange-500" },
                ].map((item, i) => (
                  <button key={i} className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`${item.color}`}>{item.icon}</div>
                      <span className="font-bold text-sm text-slate-600">{item.label}</span>
                    </div>
                    <ChevronRight size={16} className="text-slate-300"/>
                  </button>
                ))}
            </div>

            <button onClick={handleDeleteAccount} className="w-full p-5 bg-red-50 text-red-500 rounded-[2rem] font-black text-xs uppercase border border-red-100 active:scale-95 active:bg-red-100 transition-all">
              {t.delAccount}
            </button>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === "history" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-2">
              <h2 className="font-black italic tracking-tighter text-slate-800">Semua Histori</h2>
              <button onClick={() => setShowExportModal(true)} className="bg-sky-500 text-white p-2 rounded-xl active:scale-90 transition-all"><Download size={20}/></button>
            </div>
            {allTransactions.map(tr => (
              <div key={tr.id} className="bg-white p-4 rounded-2xl flex justify-between items-center shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tr.type === 'income' ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>{tr.type === 'income' ? <ArrowUpCircle size={18}/> : <ArrowDownCircle size={18}/>}</div>
                  <div><p className="font-bold text-xs">{tr.category}</p><p className="text-[8px] text-slate-300 font-bold uppercase">{new Date(tr.createdAt?.seconds*1000).toLocaleDateString('id-ID')}</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <p className={`font-black text-xs ${tr.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>Rp {tr.amount.toLocaleString('id-ID')}</p>
                  <button onClick={() => deleteDoc(doc(db, "transactions", tr.id))} className="text-slate-200 hover:text-red-500 active:scale-90 transition-all"><Trash2 size={16}/></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BOTTOM NAV */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 px-1.5 py-3.5 z-50 rounded-t-[2rem] shadow-2xl">
        <div className="grid grid-cols-5 items-center w-full">
          <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-sky-500' : 'text-slate-300'}`}><Home size={19}/> <span className="text-[7px] font-black uppercase">Home</span></button>
          <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center gap-1 ${activeTab === 'history' ? 'text-sky-500' : 'text-slate-300'}`}><LayoutGrid size={19}/> <span className="text-[7px] font-black uppercase">Histori</span></button>
          <div className="flex justify-center -mt-11"><button onClick={() => setShowAddTransaction(true)} className="w-13 h-13 bg-sky-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-sky-200 border-4 border-white active:scale-90 transition-all"><PlusCircle size={26}/></button></div>
          <button onClick={() => setActiveTab('wallet')} className={`flex flex-col items-center gap-1 ${activeTab === 'wallet' ? 'text-sky-500' : 'text-slate-300'}`}><WalletIcon size={19}/> <span className="text-[7px] font-black uppercase">Dompet</span></button>
          <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-sky-500' : 'text-slate-300'}`}><Settings size={19}/> <span className="text-[7px] font-black uppercase">Profil</span></button>
        </div>
      </div>

      {/* MODALS */}
      {showExportModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm p-8 rounded-[3rem] shadow-2xl animate-in zoom-in duration-300">
             <div className="flex justify-between items-center mb-6 italic font-black text-sky-600"><h2>UNDUH LAPORAN</h2><button onClick={() => setShowExportModal(false)} className="text-slate-400 hover:text-red-500"><X/></button></div>
             <div className="space-y-4">
                <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">Mulai Tanggal</label>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-slate-50 p-4 rounded-2xl outline-none text-sm font-bold border border-slate-100 focus:border-sky-300" />
                </div>
                <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">Sampai Tanggal</label>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-slate-50 p-4 rounded-2xl outline-none text-sm font-bold border border-slate-100 focus:border-sky-300" />
                </div>
                <button onClick={exportPDF} className="w-full bg-sky-500 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs active:scale-95 shadow-lg shadow-sky-100 transition-all">Generate PDF</button>
             </div>
          </div>
        </div>
      )}

      {showAddTransaction && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-t-[3.5rem] p-8 animate-in slide-in-from-bottom duration-500 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6" onClick={() => setShowAddTransaction(false)}></div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                {['income', 'expense'].map(item => (
                  <button key={item} type="button" onClick={() => setForm({...form, type: item})} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-colors ${form.type === item ? (item === 'income' ? 'bg-white text-green-500 shadow-sm' : 'bg-white text-red-500 shadow-sm') : 'text-slate-400 hover:text-slate-600'}`}>{item.toUpperCase()}</button>
                ))}
              </div>
              
              <div className="text-center relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-sky-500">Rp</span>
                  <input type="number" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} className="w-full text-5xl font-black text-center outline-none bg-sky-50 p-6 rounded-3xl text-sky-700" placeholder="0" autoFocus required />
              </div>
              
              {/* KATEGORI - FIXED Kurds/misscode removed */}
              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Pilih Kategori</label>
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                    {categories.map(c => (
                    <button key={c.id} type="button" onClick={() => setForm({...form, category: c.name})} className={`px-5 py-2.5 whitespace-nowrap rounded-full text-[10px] font-black border transition-all active:scale-95 ${form.category === c.name ? 'bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-100' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'}`}>{c.name.toUpperCase()}</button>
                    ))}
                </div>
              </div>
              
              {/* WALLET - FIXED Kurds/misscode removed */}
              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Sumber / Tujuan Dana</label>
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                    {wallets.map(w => (
                    <button key={w.id} type="button" onClick={() => setForm({...form, walletId: w.id})} className={`px-5 py-2.5 whitespace-nowrap rounded-xl text-[9px] font-black border transition-all active:scale-95 ${form.walletId === w.id ? 'bg-slate-800 text-white border-slate-800 shadow-md shadow-slate-200' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'}`}>{w.name.toUpperCase()}</button>
                    ))}
                </div>
              </div>
              
              <button type="submit" className="w-full bg-sky-500 text-white py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-sky-100 active:scale-95 transition-all">Simpan Transaksi</button>
            </form>
          </div>
        </div>
      )}

      {showAddWallet && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm p-8 rounded-[3rem] shadow-2xl animate-in zoom-in duration-300">
             <div className="flex justify-between items-center mb-6">
                <h2 className="font-black uppercase text-sm italic text-sky-600">REKENING BARU</h2>
                <button onClick={() => setShowAddWallet(false)} className="text-slate-400 hover:text-red-500"><X/></button>
             </div>
             <input value={newWalletName} onChange={(e) => setNewWalletName(e.target.value)} className="w-full bg-slate-50 p-4 rounded-2xl outline-none mb-4 text-sm font-bold border border-slate-100 focus:border-sky-300" placeholder="Contoh: BCA, Mandiri, E-Wallet, Cash" required />
             <button onClick={handleAddWallet} className="w-full bg-sky-500 text-white py-4 rounded-2xl font-black uppercase text-xs active:scale-95 transition-all shadow-md shadow-sky-100">Simpan Dompet</button>
          </div>
        </div>
      )}

      {showAIConsult && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end justify-center p-0 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md h-[85vh] rounded-t-[2.5rem] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300 overflow-hidden">
            <div className="bg-sky-500 p-6 flex justify-between items-center text-white shadow-lg relative z-10 rounded-t-[2.5rem]">
              <div className="flex items-center gap-3.5"><Bot size={26} className="text-white/80"/><h2 className="font-black text-sm uppercase tracking-widest text-white">AI Financial Advisor</h2></div>
              <button onClick={() => setShowAIConsult(false)} className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-full"><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar bg-slate-50 relative z-0">
              {chatMessages.length === 0 && (
                  <div className="text-center py-20 text-slate-400 space-y-4">
                      <Sparkles size={40} className="mx-auto opacity-50"/>
                      <p className="text-xs font-medium">Halo! Tanyakan apa saja mengenai kondisi keuangan Anda berdasarkan data pencatatan.</p>
                  </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl text-xs font-medium shadow-sm leading-relaxed ${msg.role === 'user' ? 'bg-sky-500 text-white rounded-br-none' : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'}`}>{msg.content}</div>
                </div>
              ))}
              {isTyping && (
                  <div className="flex justify-start">
                      <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 text-slate-500 text-xs italic animate-pulse">AI Advisor sedang berpikir...</div>
                  </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 flex gap-2.5 bg-white relative z-10"><input value={userInput} onChange={(e) => setUserInput(e.target.value)} placeholder="Tanya tips hemat, ringkasan saldo, dll..." className="flex-1 bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs outline-none focus:border-sky-200" /><button type="submit" className="bg-sky-500 text-white p-4 rounded-xl active:scale-95 transition-all shadow-md shadow-sky-100"><Send size={18}/></button></form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;