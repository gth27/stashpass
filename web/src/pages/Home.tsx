import Navbar from '../components/Navbar';
import { useUser } from '../hooks/useUser';
import { useCurrentAccount } from '@mysten/dapp-kit';

export default function Home() {
  const { buyTicket } = useUser();
  const account = useCurrentAccount();

  // 🏪 MARKETPLACE DATA
  const events = [
    {
        id: "real_event",
        title: "StashPass Launch Party",
        date: "LIVE NOW",
        price: "0.1 SUI",
        image: "https://api.dicebear.com/9.x/shapes/svg?seed=TicketGray", 
        description: "The official launch event. Mint your ticket, scan booths, and earn the Genesis Souvenir.",
        active: true
    },
    {
        id: "dummy_1",
        title: "Sui Builder House",
        date: "MARCH 2025",
        price: "0.5 SUI",
        image: "https://api.dicebear.com/9.x/shapes/svg?seed=Builder&backgroundColor=0a0a0a", 
        description: "Join top developers for a week of hacking and networking. Ticket sales opening soon.",
        active: false
    },
    {
        id: "dummy_2",
        title: "Midnight Rave",
        date: "TBA",
        price: "SOLD OUT",
        image: "https://api.dicebear.com/9.x/shapes/svg?seed=Rave&backgroundColor=1a1a1a",
        description: "Exclusive underground music event. Verification required for entry.",
        active: false
    }
  ];

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background Grid */}
      <div className="bg-grid"></div>
      
      {/* Navbar */}
      <Navbar />

      <main className="flex-grow flex flex-col items-center justify-start text-center px-4 py-12 relative z-10">
        
        {/* 🚀 HERO HEADER */}
        <div className="max-w-5xl mx-auto mb-20 mt-10">
            <h1 className="text-5xl md:text-8xl font-extrabold tracking-tighter mb-6 leading-[1.1]">
                YOUR EVENT JOURNEY, <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-brand to-white animate-gradient bg-300% drop-shadow-[0_0_15px_rgba(0,229,64,0.3)]">
                    WRAPPED IN ONE OBJECT.
                </span>
            </h1>
            <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
                StashPass transforms static tickets into dynamic, programmable assets. <br/>
                Secure access, real-time evolution, and permanent rewards.
            </p>
        </div>

        {/* 🏪 MARKETPLACE GRID */}
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-8 px-4 pb-32">
            {events.map((event) => (
                <div key={event.id} className="glass-card p-0 flex flex-col group h-full hover:border-brand/40 transition-colors">
                    
                    {/* CARD IMAGE */}
                    <div className="h-64 relative overflow-hidden bg-gray-900 border-b border-white/5">
                        <img 
                            src={event.image} 
                            alt={event.title} 
                            className={`w-full h-full object-cover transition-transform duration-700 ${event.active ? 'group-hover:scale-110' : 'grayscale opacity-50'}`} 
                        />
                        <div className="absolute top-4 left-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-lg ${event.active ? 'bg-brand text-black animate-pulse' : 'bg-black/50 text-white border border-white/20'}`}>
                                {event.date}
                            </span>
                        </div>
                        {event.active && (
                            <div className="absolute inset-0 bg-brand/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                        )}
                    </div>

                    {/* CARD DETAILS */}
                    <div className="p-6 flex flex-col flex-grow text-left bg-black/20">
                        <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">{event.title}</h3>
                        <p className="text-gray-400 text-sm mb-6 flex-grow leading-relaxed">{event.description}</p>
                        
                        <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Price</p>
                                <p className="text-xl font-bold text-white font-mono">{event.price}</p>
                            </div>
                            {event.active ? (
                                !account ? (
                                    <button disabled className="px-4 py-2 rounded-xl bg-white/5 text-gray-400 border border-white/10 text-xs font-bold cursor-not-allowed">
                                        Connect Wallet
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => buyTicket()} 
                                        className="btn-primary px-6 py-2 text-sm shadow-[0_0_15px_rgba(0,229,64,0.3)]"
                                    >
                                        Buy Now
                                    </button>
                                )
                            ) : (
                                <button disabled className="px-6 py-2 rounded-xl bg-white/5 text-gray-600 text-sm font-bold border border-white/5 cursor-not-allowed">
                                    Unavailable
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {/* ✨ FEATURES SECTION (Updated to Glass Cards) */}
        <div className="w-full max-w-6xl mx-auto px-4 pb-20">
            <h2 className="text-sm font-bold uppercase tracking-widest text-brand mb-10 opacity-80">Why build on Sui?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { 
                        title: "Unfakable Security", 
                        desc: "Sui's object model means your ticket is truly yours. No screenshots, no double-spending.",
                        icon: "🔒" 
                    },
                    { 
                        title: "Dynamic Evolution", 
                        desc: "Tickets aren't static images. They update metadata in real-time as you visit booths.",
                        icon: "✨" 
                    },
                    { 
                        title: "Burn-to-Mint", 
                        desc: "Trade your completed journey for a permanent, transferable Souvenir NFT.",
                        icon: "🏆" 
                    }
                ].map((item, i) => (
                    // ✨ APPLIED GLASS-CARD HERE
                    <div key={i} className="glass-card p-8 text-left group hover:border-brand/30">
                        <div className="h-14 w-14 mb-6 bg-white/5 rounded-2xl flex items-center justify-center text-2xl border border-white/10 group-hover:scale-110 transition-transform duration-300">
                            {item.icon}
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-white group-hover:text-brand transition-colors">{item.title}</h3>
                        <p className="text-gray-400 leading-relaxed text-sm">{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>

      </main>
    </div>
  );
}
