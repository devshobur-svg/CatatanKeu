export const TRANSLATIONS = {
  id: { 
    home: "Beranda", wallet: "Dompet", profile: "Profil", category: "Kategori",
    balance: "Total Saldo", income: "Pemasukan", expense: "Pengeluaran", history: "Riwayat",
    report: "Laporan PDF", split: "Split Bill", scan: "Scan Struk", insight: "Insight",
    addTrans: "Tambah Transaksi", amount: "Nominal", save: "Simpan",
    appearance: "Tampilan", lang: "Bahasa", logout: "Keluar"
  },
  en: { 
    home: "Home", wallet: "Wallet", profile: "Profile", category: "Category",
    balance: "Total Balance", income: "Income", expense: "Expense", history: "History",
    report: "PDF Report", split: "Split Bill", scan: "Scan Receipt", insight: "Insight",
    addTrans: "Add Transaction", amount: "Amount", save: "Save",
    appearance: "Appearance", lang: "Language", logout: "Sign Out"
  }
};

export const formatRupiah = (v) => (!v && v !== 0) ? "0" : Number(v.toString().replace(/\D/g, '')).toLocaleString('id-ID');

export const getDynamicFontSize = (len) => {
  if (len > 18) return "text-xl";
  if (len > 13) return "text-3xl";
  return "text-5xl";
};