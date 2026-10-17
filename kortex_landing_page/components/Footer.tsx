"use client";
import React from 'react';
import Link from 'next/link';
import { ShieldCheck, FileText, Mail } from 'lucide-react';

interface FooterProps {
  variant?: 'full' | 'compact';
  className?: string;
}

export default function Footer({ variant = 'full', className = '' }: FooterProps) {
  const currentYear = 2026;

  // --------------------------------------------------------------------------
  // COMPACT VARIANT: Designed for Authenticated Dashboards
  // --------------------------------------------------------------------------
  if (variant === 'compact') {
    return (
      <footer className={`border-t border-slate-200/80 bg-white/60 backdrop-blur-sm py-6 px-4 mt-auto print:hidden ${className}`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-500">
          <div>
            © {currentYear} Kortex Klassroom. All rights reserved.
          </div>
          <div className="flex items-center gap-5 sm:gap-6 flex-wrap justify-center">
            <Link 
              href="/privacy" 
              className="hover:text-indigo-600 transition-colors flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              Privacy Policy
            </Link>
            <span className="text-slate-300">•</span>
            <Link 
              href="/terms" 
              className="hover:text-indigo-600 transition-colors flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Terms of Service
            </Link>
            <span className="text-slate-300">•</span>
            <a 
              href="mailto:kortexklassroom@gmail.com" 
              className="hover:text-indigo-600 transition-colors flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              Support
            </a>
          </div>
        </div>
      </footer>
    );
  }

  // --------------------------------------------------------------------------
  // FULL VARIANT: Designed for Public Landing & Curriculum Pages
  // --------------------------------------------------------------------------
  return (
    <footer className={`bg-slate-900 text-slate-400 pt-16 pb-12 text-sm mt-auto border-t-4 border-indigo-600 print:hidden ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          
          {/* Brand & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/30">
                K
              </div>
              <span className="text-2xl font-black text-white tracking-tight">Kortex Klassroom</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Smarter Tools. Stronger Minds. Empowering early learners with foundational literacy &amp; numeracy (FLN), gamified lessons, and AI diagnostic insights.
            </p>
            <div className="pt-2">
              <a 
                href="mailto:kortexklassroom@gmail.com" 
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 px-3.5 py-2 rounded-xl border border-slate-700/60 transition-all"
              >
                <Mail className="w-3.5 h-3.5 text-indigo-400" />
                kortexklassroom@gmail.com
              </a>
            </div>
          </div>

          {/* Curriculum */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Curriculum</h4>
            <ul className="space-y-2 text-xs">
              <li className="hover:text-white transition-colors cursor-pointer">Foundational Stage</li>
              <li className="hover:text-white transition-colors cursor-pointer">FLN Hindi &amp; Math</li>
              <li className="hover:text-white transition-colors cursor-pointer">Phonics &amp; Varnamala</li>
              <li className="hover:text-white transition-colors cursor-pointer">Conceptualiser Tools</li>
              <li className="hover:text-white transition-colors cursor-pointer">Kortex Arcade</li>
            </ul>
          </div>

          {/* Pedagogy */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Pedagogy</h4>
            <ul className="space-y-2 text-xs">
              <li className="hover:text-white transition-colors">NEP 2020 Aligned</li>
              <li className="hover:text-white transition-colors">NIPUN Bharat Goals</li>
              <li className="hover:text-white transition-colors">CPA Math Framework</li>
              <li className="hover:text-white transition-colors">Panchakosha Wellness</li>
              <li className="hover:text-white transition-colors">Competency Tracking</li>
            </ul>
          </div>

          {/* Trust & Legal */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Trust &amp; Legal</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link 
                  href="/privacy" 
                  className="hover:text-indigo-400 transition-colors flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  href="/terms" 
                  className="hover:text-indigo-400 transition-colors flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  Terms of Service
                </Link>
              </li>
              <li className="hover:text-white transition-colors">DPDP Act (2023) Compliant</li>
              <li className="hover:text-white transition-colors">Early Childhood Safety</li>
              <li className="hover:text-white transition-colors">Grievance Redressal</li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
          <p>© {currentYear} Kortex Klassroom. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy</Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms</Link>
            <span>•</span>
            <a href="mailto:kortexklassroom@gmail.com" className="hover:text-slate-300 transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

