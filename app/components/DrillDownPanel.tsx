'use client';

import React from 'react';

interface DrillDownPanelProps {
  isOpen: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

export default function DrillDownPanel({ isOpen, title, children, onClose }: DrillDownPanelProps) {
  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />}
      <div className={`fixed right-0 top-0 h-full w-full sm:w-[420px] bg-white shadow-2xl transform transition-transform duration-300 z-50 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition text-xl">&times;</button>
        </div>
        <div className="p-6 overflow-y-auto" style={{ height: 'calc(100% - 73px)' }}>{children}</div>
      </div>
    </>
  );
}
