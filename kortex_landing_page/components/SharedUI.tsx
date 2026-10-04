"use client";

import React from 'react';
import { Info, AlertTriangle, CheckCircle, X, Settings, LucideIcon } from 'lucide-react';

export const Card = ({ children, className = "", onClick }: any) => (
  <div onClick={onClick} className={`bg-white rounded-3xl shadow-sm border-2 border-slate-100 overflow-hidden transition-all duration-300 ${onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:border-sky-200' : ''} ${className}`}>
    {children}
  </div>
);

interface ButtonProps {
  children: React.ReactNode;
  onClick?: (e?: any) => void;
  variant?: "primary" | "secondary" | "fun" | "green" | "outline";
  className?: string;
  icon?: LucideIcon | any;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

export const Button = ({ children, onClick, variant = "primary", className = "", icon: Icon, disabled, type = "button" }: ButtonProps) => {
  const variants = {
    primary: "bg-sky-500 text-white hover:bg-sky-600 shadow-md hover:shadow-lg border-b-4 border-sky-700 active:border-b-0 active:translate-y-1",
    secondary: "bg-white text-slate-700 border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300",
    fun: "bg-orange-500 text-white hover:bg-orange-600 shadow-md hover:shadow-lg border-b-4 border-orange-700 active:border-b-0 active:translate-y-1",
    green: "bg-lime-500 text-white hover:bg-lime-600 shadow-md hover:shadow-lg border-b-4 border-lime-700 active:border-b-0 active:translate-y-1",
    outline: "border-2 border-sky-500 text-sky-500 hover:bg-sky-50"
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`px-6 py-3 rounded-full flex items-center justify-center gap-2 font-bold transition-all ${(variants as any)[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed active:border-b-4 active:translate-y-0' : ''}`}>
      {Icon && <Icon size={20} />}
      {children}
    </button>
  );
};

export const ProgressBar = ({ label, percentage, colorClass }: any) => (
  <div className="mb-4">
    <div className="flex justify-between mb-1">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <span className="text-sm font-extrabold text-slate-900">{percentage}%</span>
    </div>
    <div className="w-full bg-slate-100 rounded-full h-4 shadow-inner">
      <div className={`h-4 rounded-full ${colorClass} transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
    </div>
  </div>
);

export const GeneralAlertModal = ({ title, message, type = 'info', onClose, actionLabel, onAction }: any) => {
  let Icon = Info; 
  let colorClass = 'text-sky-500';
  let bgClass = 'bg-sky-100';

  if (type === 'warning') {
    Icon = AlertTriangle;
    colorClass = 'text-amber-500';
    bgClass = 'bg-amber-100';
  } else if (type === 'error') {
    Icon = AlertTriangle;
    colorClass = 'text-rose-500';
    bgClass = 'bg-rose-100';
  } else if (type === 'success') {
    Icon = CheckCircle;
    colorClass = 'text-emerald-500';
    bgClass = 'bg-emerald-100';
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in px-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl relative border-4 border-slate-100">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-2">
          <X size={20} />
        </button>
        <div className={`w-16 h-16 ${bgClass} rounded-full flex items-center justify-center mx-auto mb-4`}>
          <Icon size={32} className={colorClass} />
        </div>
        <h3 className="text-2xl font-black text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-500 font-medium mb-6">{message}</p>
        <Button className="w-full" onClick={onAction || onClose}>{actionLabel || 'Got it'}</Button>
      </div>
    </div>
  );
};

export const WorkInProgressView = ({ title, onReturn }: any) => (
  <div className="flex flex-col items-center justify-center py-20 animate-fade-in text-center px-4">
    <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center mb-6 border-8 border-slate-50 relative">
      <Settings size={48} className="text-slate-400 animate-[spin_4s_linear_infinite]" />
      <div className="absolute -bottom-2 -right-2 bg-orange-500 text-white p-2 rounded-full border-4 border-white"><Settings size={16} className="animate-[spin_3s_linear_infinite_reverse]" /></div>
    </div>
    <h2 className="text-4xl font-black text-slate-800 mb-4">{title} Portal</h2>
    <p className="text-xl text-slate-500 font-medium max-w-md mx-auto mb-8">We are crafting something amazing for this section.</p>
    <div className="bg-orange-50 text-orange-600 px-8 py-4 rounded-full border-2 border-orange-200 font-bold inline-flex items-center gap-3 shadow-sm"><span className="text-2xl">🚧</span> Currently In Progress</div>
    <Button variant="secondary" className="mt-8 border-2" onClick={onReturn}>Return to Home</Button>
  </div>
);
