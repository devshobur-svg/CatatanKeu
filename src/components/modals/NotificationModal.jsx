import React from "react";
import { X, Bell, Zap, Info, AlertTriangle, CheckCircle2 } from "lucide-react";

const NotificationModal = ({ show, setShow, notifications, formatRupiah }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[1001] flex items-start justify-center px-4 pt-20 backdrop-blur-sm bg-slate-900/20 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in slide-in-from-top-10 duration-500">
        
        {/* Header */}
        <div className="p-6 flex justify-between items-center border-b border-slate-50 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600">
              <Bell size={20} />
            </div>
            <h2 className="font-black italic uppercase tracking-tighter text-lg dark:text-white">Activity Center</h2>
          </div>
          <button onClick={() => setShow(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X size={20} className="dark:text-slate-400" />
          </button>
        </div>

        {/* Notif List */}
        <div className="max-h-[60vh] overflow-y-auto no-scrollbar p-4 space-y-3">
          {notifications.length > 0 ? notifications.map((n) => (
            <div key={n.id} className="p-4 rounded-[1.8rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 flex gap-4 items-start active:scale-95 transition-all">
              <div className="text-2xl">{n.icon}</div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="text-[11px] font-black uppercase tracking-tight text-slate-900 dark:text-white">{n.title}</h4>
                  <span className="text-[8px] font-bold text-slate-400 uppercase italic">Baru Saja</span>
                </div>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  {n.desc}
                </p>
              </div>
            </div>
          )) : (
            <div className="py-12 text-center">
              <Zap size={40} className="mx-auto text-slate-200 mb-3" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 italic">No new activity</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/30 text-center">
          <button onClick={() => setShow(false)} className="text-[9px] font-black uppercase text-blue-600 tracking-widest italic">Mark all as read</button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;