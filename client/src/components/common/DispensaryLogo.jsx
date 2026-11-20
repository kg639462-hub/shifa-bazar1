import React from 'react';
import { Link } from 'react-router-dom';
import originalLogo from '../../originallogo.png';

/**
 * DispensaryLogo Component
 * Renders the brand logo with originallogo.png on the left side of "Ash-Shifa Herbals"
 */
export default function DispensaryLogo({ variant = 'header', showText = true, className = '' }) {
  if (variant === 'footer') {
    return (
      <Link to="/" className={`flex items-center gap-3 group transition-transform duration-200 ${className}`}>
        <img
          src={originalLogo}
          alt="Ash-Shifa Herbals Logo"
          className="h-10 sm:h-11 w-auto object-contain transition-transform group-hover:scale-105 duration-200 drop-shadow-md"
        />
        {showText && (
          <div className="flex flex-col leading-none text-left">
            <span className="font-serif text-2xl font-bold tracking-tight text-white group-hover:text-teal-300 transition-colors">
              Ash-Shifa
            </span>
            <span className="text-[11px] tracking-[0.25em] font-semibold text-teal-400 uppercase mt-0.5">
              Herbals & Pharmacy
            </span>
          </div>
        )}
      </Link>
    );
  }

  if (variant === 'auth_center') {
    return (
      <Link to="/" className={`flex items-center justify-center gap-3 group transition-transform duration-200 active:scale-95 ${className}`}>
        <img
          src={originalLogo}
          alt="Ash-Shifa Herbals Logo"
          className="h-12 sm:h-14 w-auto object-contain drop-shadow-xs"
        />
        {showText && (
          <div className="flex flex-col leading-none text-left">
            <span className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#0a2e1e] group-hover:text-emerald-950 transition-colors">
              Ash-Shifa
            </span>
            <span className="text-[11px] sm:text-xs tracking-[0.25em] font-semibold text-[#0d4a2d] uppercase">
              Herbals
            </span>
          </div>
        )}
      </Link>
    );
  }

  return (
    <Link to="/" className={`flex items-center gap-2.5 sm:gap-3 group ${className}`}>
      {/* Original logo image on the left side of Ash-Shifa Herbals */}
      <img
        src={originalLogo}
        alt="Ash-Shifa Herbals Logo"
        className="h-9 sm:h-10 w-auto object-contain transition-transform group-hover:scale-105 duration-200"
      />

      {showText && (
        <div className="flex flex-col leading-none">
          <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#0a2e1e] group-hover:text-emerald-950 transition-colors">
            Ash-Shifa
          </span>
          <span className="text-[10px] sm:text-[11px] tracking-[0.25em] font-semibold text-[#0d4a2d] uppercase">
            Herbals
          </span>
        </div>
      )}
    </Link>
  );
}
