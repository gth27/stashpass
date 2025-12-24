import { useState, useRef, useEffect } from 'react';
import { CONFIG } from '../config';
import Navbar from '../components/Navbar'; 
import { QRCodeSVG } from 'qrcode.react'; 
import { useSuiClient } from '@mysten/dapp-kit';

export default function Staff() {
  const client = useSuiClient();
  const [allBooths, setAllBooths] = useState<any[]>([]);

  // 🔄 AUTO-SYNC: FETCH EVENTS FROM BLOCKCHAIN
  useEffect(() => {
    const fetchBooths = async () => {
        try {
            // 1. Query the 'BoothCreated' events
            const events = await client.queryEvents({
                query: { 
                    MoveModule: { 
                        package: CONFIG.PACKAGE_ID, 
                        module: 'event_manager' 
                    } 
                },
                order: "descending"
            });

            // 2. Extract Data (ID and Name)
            const dynamicBooths = events.data
                .filter(e => e.type.includes('::BoothCreated'))
                .map(e => ({
                    id: (e.parsedJson as any).booth_id,
                    name: (e.parsedJson as any).name
                }));

            // 3. Merge with Config Booths (remove duplicates)
            const configBooths = CONFIG.ALL_BOOTHS || [];
            const combined = [...configBooths, ...dynamicBooths]
                .filter((v,i,a)=>a.findIndex(t=>(t.id===v.id))===i);

            setAllBooths(combined);
        } catch (e) {
            console.error("Sync Error:", e);
            // Fallback to Config only if network fails
            setAllBooths(CONFIG.ALL_BOOTHS || []);
        }
    };

    fetchBooths(); // Run on mount
    const interval = setInterval(fetchBooths, 5000); // Poll every 5s for new booths
    return () => clearInterval(interval);
  }, []);


  // --- UI STATE ---
  const events = [
      { id: CONFIG.TEST_EVENT_ID, name: "StashPass Launch Party (LIVE)" },
      { id: "dummy_1", name: "Sui Builder House" },
      { id: "dummy_2", name: "Midnight Rave" }
  ];

  const [selectedEventId, setSelectedEventId] = useState(events[0].id);
  const [selectedBooth, setSelectedBooth] = useState<any>(null);
  
  // Set default booth logic
  useEffect(() => {
    if (allBooths.length > 0 && !selectedBooth) {
        setSelectedBooth(allBooths[0]);
    }
  }, [allBooths]);

  // Dropdown Logic
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: any) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const activeBooths = selectedEventId === CONFIG.TEST_EVENT_ID ? allBooths : [];
  const activeEventName = events.find(e => e.id === selectedEventId)?.name;

  return (
    <div className="min-h-screen relative flex flex-col">
      <div className="bg-grid"></div>
      <Navbar />

      <main className="flex-grow flex flex-col items-center justify-center p-6 text-center relative z-10">
        
        <div className="max-w-md w-full space-y-6">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Staff Point</h1>
                <p className="text-gray-400">Generate check-in codes for attendees.</p>
            </div>

            {/* EVENT SELECTOR */}
            <div className="glass-card p-6 text-left relative z-50 !overflow-visible">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 block">Select Active Event</label>
                
                <div className="relative" ref={dropdownRef}>
                    <button 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className={`w-full flex items-center justify-between bg-black/50 border rounded-xl py-4 pl-4 pr-4 text-white transition-all duration-200 ${isDropdownOpen ? 'border-brand shadow-[0_0_15px_rgba(0,229,64,0.1)]' : 'border-white/10 hover:border-white/30'}`}
                    >
                        <span className="font-medium truncate">{activeEventName}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-4 h-4 text-brand transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-[#111] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                            {events.map(e => (
                                <button
                                    key={e.id}
                                    onClick={() => {
                                        setSelectedEventId(e.id);
                                        setSelectedBooth(null);
                                        setIsDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-3 text-sm transition-colors border-b border-white/5 last:border-0 ${
                                        selectedEventId === e.id 
                                        ? 'bg-brand/10 text-brand font-bold' 
                                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                                    }`}
                                >
                                    {e.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* BOOTH SELECTION LIST */}
            <div className="glass-card p-6 min-h-[200px] flex flex-col relative z-10">
                <div className="flex justify-between items-center mb-3">
                    <label className="text-left text-xs font-bold uppercase text-gray-500">
                        Available Booths ({activeBooths.length})
                    </label>
                    <span className="text-[10px] text-brand animate-pulse">● Live Sync</span>
                </div>
                
                {activeBooths.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3">
                        {activeBooths.map((b: any) => (
                            <button
                                key={b.id}
                                onClick={() => setSelectedBooth(b)}
                                className={`p-4 rounded-xl border text-left transition-all duration-200 group flex justify-between items-center ${
                                    selectedBooth?.id === b.id 
                                    ? 'bg-[#00E540] text-black border-[#00E540] font-bold shadow-[0_0_15px_rgba(0,229,64,0.3)]' 
                                    : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/30'
                                }`}
                            >
                                <span>{b.name}</span>
                                {selectedBooth?.id === b.id && (
                                    <span className="bg-black/20 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">Active</span>
                                )}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="flex-grow flex flex-col items-center justify-center text-gray-500 border border-dashed border-white/10 rounded-xl bg-black/20 p-6">
                        <span className="text-3xl mb-3 grayscale opacity-50">📡</span>
                        <p className="text-sm font-bold text-gray-400">Searching Chain...</p>
                    </div>
                )}
            </div>

            {/* QR CODE DISPLAY */}
            {selectedBooth && (
                <div className="glass-card p-8 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500 border-t-4 border-t-brand relative z-10">
                    <div className="mb-6 text-center">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">SCAN TO CHECK IN</p>
                        <h2 className="text-2xl font-bold text-white">{selectedBooth.name}</h2>
                    </div>
                    
                    <div className="bg-white p-4 rounded-3xl shadow-[0_0_30px_rgba(255,255,255,0.1)] relative group">
                        <QRCodeSVG 
                            value={`sui:${selectedBooth.id}`} 
                            size={200}
                            level={"H"}
                            fgColor={"#000000"}
                            bgColor={"#ffffff"}
                        />
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-bold px-3 py-1 rounded-full border border-white/20 shadow-lg whitespace-nowrap">
                            SCAN ME
                        </div>
                    </div>

                    <p className="mt-8 text-xs text-gray-600 italic">
                        Ask attendee to scan this code with their StashPass Wallet.
                    </p>
                </div>
            )}
        </div>
      </main>
    </div>
  );
}
