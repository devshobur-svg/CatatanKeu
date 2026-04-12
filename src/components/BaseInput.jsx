import React from 'react';

const BaseInput = ({ label, id, icon, ...props }) => (
  <div className="mb-5">
    <label htmlFor={id} className="block text-sm font-medium text-neutral-400 mb-1.5">
      {label}
    </label>
    <div className="relative">
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
          {icon}
        </div>
      )}
      <input
        id={id}
        name={id}
        className={`w-full ${icon ? 'pl-11' : 'pl-3.5'} pr-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder:text-neutral-600 focus:ring-1 focus:ring-sky-500 focus:border-sky-500 text-sm`}
        {...props}
      />
    </div>
  </div>
);

export default BaseInput;