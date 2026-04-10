import React from "react";
import { Plus, Tag, Trash2, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import { db } from "../lib/firebase";
import { deleteDoc, doc } from "firebase/firestore";

const CategoryPage = ({ categories, allTransactions, formatRupiah, setShowAddCategory, t }) => {
  return (
    <div className="space-y-6 px-6 pt-12 animate-in slide-in-from-right pb-40">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center relative z-10">
        <div className="space-y-1">
          <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">
            {t.category}
          </h3>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic opacity-60">Budgeting Management</p>
        </div>
        
        {/* TOMBOL ADD - Pastikan ini tidak terhalang layer lain */}
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowAddCategory(true);
          }} 
          className="p-4 bg-blue-600 text-white rounded-[1.5rem] shadow-2xl shadow-blue-200 dark:shadow-none active:scale-90 transition-all cursor-pointer relative z-20"
        >
          <Plus size={24} strokeWidth={3}/>
        </button>
      </div>

      {/* GRID KATEGORI */}
      <div className="grid gap-5">
        {categories.length > 0 ? categories.map(c => {
          // Menghitung pengeluaran berdasarkan kategori
          const used = allTransactions
            .filter(tr => tr.category === c.name && tr.type === 'expense')
            .reduce((a, b) => a + Number(b.amount), 0);
          
          const pct = c.limit > 0 ? (used / c.limit) * 100 : 0;
          
          // Logic 3 Kondisi Kesehatan Budget
          let status = { 
            label: "Masih Sehat", 
            color: "text-blue-600", 
            bg: "bg-blue-50 dark:bg-blue-500/10", 
            icon: <CheckCircle2 size={12}/>, 
            border: "border-slate-100 dark:border-slate-700", 
            bar: "bg-blue-600" 
          };
          
          if (pct >= 100) {
            status = { 
              label: "Melebihi Limit", 
              color: "text-red-500", 
              bg: "bg-red-50 dark:bg-red-500/10", 
              icon: <AlertCircle size={12}/>, 
              border: "border-red-100 dark:border-red-900/30 ring-1 ring-red-50", 
              bar: "bg-red-500" 
            };
          } else if (pct >= 70) {
            status = { 
              label: "Hati-Hati", 
              color: "text-orange-500", 
              bg: "bg-orange-50 dark:bg-orange-500/10", 
              icon: <AlertTriangle size={12}/>, 
              border: "border-orange-100 dark:border-orange-900/30", 
              bar: "bg-orange-500" 
            };
          }

          return (
            <div 
              key={c.id} 
              className={`bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border shadow-xl shadow-slate-200/40 dark:shadow-none transition-all duration-300 ${status.border}`}
            >
              <div className="flex justify-between items-start mb-5">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${status.bg} ${status.color}`}>
                    <Tag size={22}/>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-black uppercase text-slate-900 dark:text-white block tracking-tight">
                      {c.name}
                    </span>
                    <div className={`flex items-center gap-1.5 ${status.color}`}>
                       {status.icon}
                       <span className="text-[9px] font-black uppercase italic tracking-tighter">
                         {status.label}
                       </span>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={async (e) => { 
                    e.stopPropagation();
                    if(window.confirm(`Hapus kategori ${c.name}?`)) {
                      await deleteDoc(doc(db, "categories", c.id));
                    }
                  }} 
                  className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18}/>
                </button>
              </div>

              {/* Progress Bar Area */}
              <div className="space-y-3">
                <div className="w-full h-2.5 bg-slate-50 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className={`h-full transition-all duration-1000 ${status.bar} shadow-[0_0_10px_rgba(37,99,235,0.2)]`} 
                    style={{width: `${Math.min(100, pct)}%`}}
                  ></div>
                </div>

                <div className="flex justify-between items-center px-1">
                   <span className="text-[9px] font-black opacity-30 uppercase tracking-tighter italic">Usage Intensity</span>
                   <span className={`text-[10px] font-black ${pct >= 100 ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
                      Rp {formatRupiah(used)} <span className="opacity-20 font-medium">/ {formatRupiah(c.limit)}</span>
                   </span>
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="text-center py-24 flex flex-col items-center gap-4">
             <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-200">
               <Tag size={40} strokeWidth={1} />
             </div>
             <p className="opacity-20 italic font-black uppercase text-[10px] tracking-[0.3em]">No Category Found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;