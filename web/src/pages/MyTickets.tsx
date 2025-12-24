import { useState, useRef } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useUser } from '../hooks/useUser';
import { useRefund } from '../hooks/useRefund';
import { useEvolve } from '../hooks/useEvolve';
import toast from 'react-hot-toast'; 
import { CONFIG } from '../config';
import { Scanner } from '@yudiel/react-qr-scanner';
import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';

export default function MyTickets() {
  const account = useCurrentAccount();
  const { tickets, souvenirs, refreshTickets, refreshSouvenirs } = useUser();
  const { refundTicket } = useRefund();
  const { evolveTicket } = useEvolve();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  // STATE
  const [isScanning, setIsScanning] = useState(false);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const scanLock = useRef(false);
  const [isEvolving, setIsEvolving] = useState(false);
  const initialSouvenirCount = useRef(0);

  // LOGIC
  const handleEvolve = (ticketId: string) => {
    initialSouvenirCount.current = souvenirs?.data?.length || 0;
    setIsEvolving(true); 
    evolveTicket(ticketId, () => {
        const toastId = toast.loading("Minting your unique Souvenir...");
        const interval = setInterval(async () => {
            const res = await refreshSouvenirs();
            if ((res.data?.data?.length || 0) > initialSouvenirCount.current) {
                clearInterval(interval); setIsEvolving(false); refreshTickets(); toast.success("🏆 Souvenir Minted!", { id: toastId });
            }
        }, 1500); 
        setTimeout(() => { clearInterval(interval); setIsEvolving(false); refreshTickets(); refreshSouvenirs(); }, 20000);
    });
  };

  const handleBoothScan = (boothId: string) => {
    if (scanLock.current || !activeTicketId) return;
    const cleanId = boothId.replace('sui:', '').trim();
    if (!/^0x[a-fA-F0-9]{64}$/.test(cleanId)) return;
    scanLock.current = true; setIsScanning(false); 
    const toastId = toast.loading("Verifying Location...");
    const tx = new Transaction();
    tx.moveCall({ target: `${CONFIG.PACKAGE_ID}::event_manager::stamp_ticket`, arguments: [ tx.object(cleanId), tx.object(activeTicketId) ] });
    signAndExecute({ transaction: tx }, {
        onSuccess: () => { toast.success("✅ Checked In!", { id: toastId }); refreshTickets(); setActiveTicketId(null); scanLock.current = false; },
        onError: () => { toast.error("❌ Failed.", { id: toastId }); scanLock.current = false; }
    });
  };
  const closeScanner = () => { setIsScanning(false); setActiveTicketId(null); scanLock.current = false; };

  return (
    <div className="min-h-screen relative">
      <div className="bg-grid"></div>
      <Navbar />

      {/* SCANNER MODAL */}
      {isScanning && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm glass-card p-6 border-brand/30 shadow-[0_0_30px_rgba(0,229,64,0.2)]">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-white font-bold text-lg flex items-center gap-2"><span className="w-2 h-2 bg-brand rounded-full animate-pulse"></span> Scan QR Code</h2>
                    <button onClick={closeScanner} className="text-gray-400 hover:text-white transition">✕</button>
                </div>
                <div className="aspect-square bg-black/50 rounded-xl overflow-hidden relative border border-white/10">
                      <Scanner onScan={(result) => { if (result?.[0]?.rawValue) handleBoothScan(result[0].rawValue); }} allowMultiple={false} scanDelay={500} components={{ audio: false, onOff: false, finder: false }} styles={{ container: { width: '100%', height: '100%' } }} />
                      <div className="absolute inset-0 animate-[scan_2s_ease-in-out_infinite] bg-gradient-to-b from-transparent via-brand/20 to-transparent h-[50%] -translate-y-full pointer-events-none"></div>
                </div>
                <p className="text-center text-xs text-gray-400 mt-6">Point your camera at the Booth's QR Code.</p>
            </div>
        </div>
      )}

      {/* WALLET CHECK */}
      {!account ? (
         <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4 animate-in fade-in zoom-in-95 duration-500">
             <div className="w-20 h-20 mb-6 bg-gray-900 rounded-3xl flex items-center justify-center text-4xl border border-gray-800 shadow-2xl">
                🔒
             </div>
             <h2 className="text-3xl font-bold text-white mb-3">Wallet Disconnected</h2>
             <p className="text-gray-400 max-w-md">Please connect your wallet using the button in the top right to view your tickets.</p>
         </div>
      ) : (
        <div className="max-w-7xl mx-auto p-6 md:p-12 space-y-20 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* TICKETS SECTION */}
            <section>
                <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
                    <h2 className="text-3xl font-bold tracking-tight text-white">Active Tickets</h2>
                    <button 
                        onClick={() => refreshTickets()} 
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-brand/50 text-gray-400 hover:text-brand transition-all group active:scale-95"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                    </button>
                </div>

                {tickets?.data.length === 0 ? (
                    <div className="glass-card p-16 text-center text-gray-400 border-dashed">
                        No tickets found. <Link to="/" className="text-brand underline hover:text-white transition">Go to Marketplace.</Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {tickets?.data.map((item: any) => {
                        const ticket = item.data;
                        if (!ticket?.content?.fields) return null;
                        const fields = ticket.content.fields;
                        const hasBadges = fields.badges && fields.badges.length > 0;
                        
                        return (
                            <div key={ticket.objectId} className="glass-card group p-0">
                                {/* IMAGE */}
                                <div className="h-72 relative overflow-hidden">
                                    <img src={fields.url} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                                    <div className="absolute inset-0 bg-gradient-to-tr from-brand/20 via-transparent to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none mix-blend-overlay"></div>
                                    <div className="absolute top-4 left-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-lg ${hasBadges ? 'bg-brand/80 text-black' : 'bg-black/50 text-white border border-white/20'}`}>
                                            {hasBadges ? 'Verified' : 'Standard'}
                                        </span>
                                    </div>
                                    {isEvolving && hasBadges && (
                                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-brand z-10">
                                            <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin mb-3 shadow-[0_0_20px_rgba(0,229,64,0.4)]"></div>
                                            <span className="font-bold animate-pulse">Forging Souvenir...</span>
                                        </div>
                                    )}
                                </div>

                                {/* CONTENT */}
                                <div className="p-6 relative bg-black/20">
                                    <h3 className="text-2xl font-bold mb-1 text-white tracking-tight">{fields.name}</h3>
                                    <p className="text-xs text-gray-500 font-mono mb-5 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-gray-600 group-hover:bg-brand transition-colors"></span> ID: {ticket.objectId.slice(0, 10)}...</p>

                                    <div className="bg-black/40 border border-white/5 rounded-xl p-4 min-h-[60px] mb-6 flex items-center backdrop-blur-sm">
                                        {hasBadges ? (
                                            <div className="flex flex-wrap gap-2">
                                                {fields.badges.map((b: any, i: number) => (
                                                    <span key={i} className="text-[10px] font-bold bg-brand/10 text-brand border border-brand/20 px-2 py-1 rounded-md shadow-[0_0_10px_rgba(0,229,64,0.1)]">
                                                        ✅ {b}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-gray-500 italic flex items-center gap-2"><span className="opacity-50">🛡️</span> No stamps collected yet.</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        {/* 📷 REMOVED CAMERA ICON HERE */}
                                        <button 
                                            onClick={() => { setActiveTicketId(ticket.objectId); setIsScanning(true); }}
                                            disabled={isEvolving}
                                            className="btn-secondary text-sm py-3 flex items-center justify-center gap-2 font-bold"
                                        >
                                            Scan QR
                                        </button>
                                        
                                        {hasBadges ? (
                                            <button onClick={() => handleEvolve(ticket.objectId)} disabled={isEvolving} className="btn-primary text-sm py-3 shadow-[0_0_15px_rgba(0,229,64,0.2)]">
                                                ✨ Evolve
                                            </button>
                                        ) : (
                                            <button onClick={() => refundTicket(ticket.objectId, refreshTickets)} className="text-gray-500 text-xs hover:text-red-400 transition hover:bg-red-500/10 rounded-lg border border-transparent hover:border-red-500/20">
                                                Request Refund
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )})}
                    </div>
                )}
            </section>

            {/* SOUVENIRS SECTION */}
            <section className="pb-20">
                <h2 className="text-3xl font-bold mb-8 border-b border-white/10 pb-4 flex items-center gap-3"><span className="text-yellow-400">🏆</span> Collection</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {isEvolving && (
                        <div className="glass-card p-8 flex items-center justify-center gap-4 text-brand animate-pulse border-brand/30">
                            <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
                            <span className="font-bold">Minting new collectible...</span>
                        </div>
                    )}
                    {souvenirs?.data.map((item: any) => {
                        const fields = item.data.content.fields;
                        return (
                            <div key={item.data.objectId} className="glass-card p-5 flex gap-5 items-start group">
                                <div className="w-28 h-28 relative flex-shrink-0">
                                    <img src={fields.url} className="w-full h-full bg-black/50 rounded-xl object-cover shadow-lg border border-white/10 group-hover:border-yellow-400/50 transition-colors" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-xl text-yellow-400 mb-1">Souvenir NFT</h4>
                                    <p className="text-xs text-gray-400 mb-3 pb-2 border-b border-white/10">{fields.achievements?.length || 0} Badges Verified</p>
                                    <div className="flex flex-wrap gap-2">
                                        {fields.perks?.map((p:string, i:number) => (
                                            <span key={i} className="text-[10px] font-bold bg-yellow-400/10 text-yellow-200 border border-yellow-400/20 px-2 py-1 rounded flex items-center gap-1">
                                                {/* 🎁 BIGGER ICON HERE */}
                                                <span className="text-lg mr-1">🎁</span> {p}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </section>
        </div>
      )}
    </div>
  );
}
