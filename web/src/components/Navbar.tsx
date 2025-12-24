import { Link, useLocation } from 'react-router-dom';
import { ConnectButton } from '@mysten/dapp-kit';
import { useState } from 'react';

export default function Navbar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Helper to check active link styling
  const isActive = (path: string) => location.pathname === path;
  
  // Link Style Generator
  const getLinkClass = (path: string) => `
    text-sm font-bold tracking-wide transition-all duration-200 
    ${isActive(path) 
      ? 'text-brand drop-shadow-[0_0_8px_rgba(0,229,64,0.5)]' 
      : 'text-gray-400 hover:text-white'
    }
  `;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#030712]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* 1. LOGO (Now a simple Link container for your Icon) */}
          <Link to="/" className="flex items-center gap-3 group" onClick={() => setIsOpen(false)}>
            {/* Replace this div with your <img src="..." /> later */}
            <div className="w-10 h-10 bg-gradient-to-tr from-brand to-emerald-600 rounded-xl flex items-center justify-center text-black font-extrabold text-xl shadow-[0_0_20px_rgba(0,229,64,0.3)] group-hover:shadow-[0_0_30px_rgba(0,229,64,0.5)] transition-all">
              S
            </div>
            
            <span className="text-xl font-bold tracking-tighter text-white">
              STASH<span className="text-brand">PASS</span>
            </span>
          </Link>

          {/* 2. DESKTOP LINKS (Hidden on Mobile) */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className={getLinkClass('/')}>MARKETPLACE</Link>
            <Link to="/my-tickets" className={getLinkClass('/my-tickets')}>MY WALLET</Link>
            <Link to="/admin" className={getLinkClass('/admin')}>ORGANIZER</Link>
            <Link to="/staff" className={getLinkClass('/staff')}>STAFF</Link>
          </div>

          {/* 3. DESKTOP WALLET */}
          <div className="hidden md:block">
            <ConnectButton className="!bg-white/10 !text-white !font-bold !rounded-xl hover:!bg-white/20 transition-all" />
          </div>

          {/* 4. MOBILE MENU BUTTON */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-300 hover:text-white focus:outline-none p-2"
            >
              {isOpen ? (
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 5. MOBILE MENU DROPDOWN */}
      <div className={`md:hidden absolute top-20 left-0 w-full bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/10 shadow-2xl transition-all duration-300 ease-in-out origin-top ${isOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 h-0 pointer-events-none'}`}>
        <div className="px-4 pt-4 pb-8 space-y-4 flex flex-col items-center">
          
          <Link to="/" onClick={() => setIsOpen(false)} className={`text-lg py-2 ${getLinkClass('/')}`}>
            MARKETPLACE
          </Link>
          <Link to="/my-tickets" onClick={() => setIsOpen(false)} className={`text-lg py-2 ${getLinkClass('/my-tickets')}`}>
            MY WALLET
          </Link>
          <Link to="/admin" onClick={() => setIsOpen(false)} className={`text-lg py-2 ${getLinkClass('/admin')}`}>
            ORGANIZER
          </Link>
          <Link to="/staff" onClick={() => setIsOpen(false)} className={`text-lg py-2 ${getLinkClass('/staff')}`}>
            STAFF POINT
          </Link>

          {/* Mobile Wallet Button */}
          <div className="pt-4 w-full flex justify-center border-t border-white/5 mt-2">
            <ConnectButton className="!w-full !justify-center !bg-brand !text-black !font-bold !rounded-xl !py-3 shadow-[0_0_20px_rgba(0,229,64,0.2)]" />
          </div>
          
        </div>
      </div>
    </nav>
  );
}
