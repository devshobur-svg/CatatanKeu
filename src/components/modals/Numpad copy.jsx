import React from "react";
import { Delete } from "lucide-react";

const Numpad = ({ onClick }) => {
  const buttons = [1, 2, 3, 4, 5, 6, 7, 8, 9, "00", 0];

  return (
    <div className="grid grid-cols-3 gap-2 mb-6 px-4">
      {buttons.map((n) => (
        <button
          key={n}
          onClick={() => onClick(n.toString())}
          className="py-4 text-2xl font-black text-slate-800 dark:text-white active:text-blue-600 transition-colors"
        >
          {n}
        </button>
      ))}
      <button
        onClick={() => onClick("delete")}
        className="flex items-center justify-center text-red-500 active:scale-75 transition-all"
      >
        <Delete size={32} />
      </button>
    </div>
  );
};

export default Numpad;