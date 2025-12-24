import { useState } from 'react';
import { useAdmin } from '../hooks/useAdmin';
import { useOrganizerStats } from '../hooks/useOrganizerStats';
import { useCurrentAccount } from '@mysten/dapp-kit';
import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';

export default function Admin() {
  const account = useCurrentAccount();
  const { isOrganizer, isLoading, updateRule, createBooth, withdrawFunds } = useAdmin();
  const { stats, refetch: refreshStats } = useOrganizerStats();

  const [badgeName, setBadgeName] = useState("Tournament Champion");
  const [description, setDescription] = useState("GRAND PRIZE: 100 SUI");
  const [imageUrl, setImageUrl] = useState("https://api.dicebear.com/9.x/shapes/svg?seed=Trophy&backgroundColor=f1c40f");
  const [newBoothName, setNewBoothName] = useState("");
  const [recordAchievement, setRecordAchievement] = useState(true);

  const handleSubmitRule = (e: React.FormEvent) => { e.preventDefault(); updateRule(badgeName, description, imageUrl); };
  const handleCreateBooth = (e: React.FormEvent) => { e.preventDefault(); if (!newBoothName) return; createBooth(newBoothName, recordAchievement); setNewBoothName(""); };
  const handleWithdraw = () => { withdrawFunds(() => { setTimeout(() => { refreshStats(); }, 2000); }); };

  // Helper for consistent messages
  const StateMessage = ({ title, subtitle, action }: any) => (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-300">
        <h2 className="text-3xl font-bold text-white mb-3">{title}</h2>
        <p className="text-gray-400 max-w-md mb-8 leading-relaxed">{subtitle}</p>
        {action}
    </div>
  );

  return (
    <div className="min-h-screen relative flex flex-col">
      <div className="bg-grid"></div>
      <Navbar />

      <div className="max-w-7xl mx-auto p-6 md:p-12 w-full relative z-10">
        
        {/* STATE HANDLING */}
        {!account && (
             <StateMessage title="Organizer Access" subtitle="Connect the wallet that deployed the contract to access the command center." />
        )}
        {account && isLoading && (
            <StateMessage title="Verifying Access..." subtitle="Checking your permissions on the Sui blockchain." />
        )}
        {account && !isLoading && !isOrganizer && (
            <StateMessage title="Access Denied" subtitle={`Your wallet (${account.address.slice(0,6)}...) does not own the OrganizerCap required to manage this event.`} action={<Link to="/" className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold transition-colors">Return Home</Link>} />
        )}

        {/* MAIN DASHBOARD */}
        {account && !isLoading && isOrganizer && (
            <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* HEADER */}
                <div className="flex flex-col md:flex-row justify-between items-end border-b border-white/10 pb-6 gap-4">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-white">Command Center</h1>
                        <p className="text-gray-400">Manage your event, track revenue, and configure rewards.</p>
                    </div>
                    <div className="px-4 py-1 rounded-full border border-brand/30 bg-brand/10 text-brand text-xs font-bold uppercase tracking-widest animate-pulse">
                        Live Mode
                    </div>
                </div>
                
                {/* REVENUE STATS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass-card p-8 flex flex-col justify-between group hover:border-brand/30 transition-all">
                        <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-4">Tickets Sold</h3>
                        <p className="text-7xl font-bold text-white tracking-tighter">{stats ? stats.ticketsSold : "..."}</p>
                    </div>

                    <div className="glass-card p-8 flex flex-col justify-between group hover:border-brand/30 transition-all">
                        <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-4">Net Revenue (99%)</h3>
                        <p className="text-7xl font-bold text-brand tracking-tighter">
                            {stats?.organizerRevenue !== undefined ? stats.organizerRevenue.toFixed(2) : "0.00"} 
                            <span className="text-2xl text-gray-500 ml-3 font-medium tracking-normal">SUI</span>
                        </p>
                    </div>

                    <div className="glass-card p-8 flex flex-col justify-between border-brand/30 shadow-[0_0_20px_rgba(0,229,64,0.05)]">
                        <div>
                            <h3 className="text-brand text-xs font-bold uppercase tracking-wider mb-4">Available Balance</h3>
                            <p className="text-6xl font-bold text-white mb-8 tracking-tighter">
                                {stats?.organizerRevenue !== undefined ? stats.organizerRevenue.toFixed(2) : "0.00"} 
                                <span className="text-xl text-gray-500 ml-3 font-medium tracking-normal">SUI</span>
                            </p>
                        </div>
                        <button 
                            onClick={handleWithdraw}
                            disabled={!stats || (stats.organizerRevenue || 0) <= 0}
                            className="btn-primary w-full py-4 text-sm font-bold shadow-lg uppercase tracking-wider"
                        >
                            Cash Out Funds
                        </button>
                    </div>
                </div>

                {/* ACTIONS GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    
                    {/* CONFIG PERKS */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-white border-l-4 border-brand pl-4">Configure Perks</h2>
                        <div className="glass-card p-8">
                            <form onSubmit={handleSubmitRule} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Target Badge Name</label>
                                    <input 
                                        type="text" 
                                        value={badgeName} 
                                        onChange={(e) => setBadgeName(e.target.value)} 
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 focus:border-brand outline-none text-white placeholder-gray-600 transition-colors"
                                        placeholder="e.g. VIP Lounge" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Unlock Perk Text</label>
                                    <input 
                                        type="text" 
                                        value={description} 
                                        onChange={(e) => setDescription(e.target.value)} 
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 focus:border-brand outline-none text-white placeholder-gray-600 transition-colors"
                                        placeholder="e.g. 50% OFF Merch" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Unlock NFT Image URL</label>
                                    <input 
                                        type="text" 
                                        value={imageUrl} 
                                        onChange={(e) => setImageUrl(e.target.value)} 
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 focus:border-brand outline-none text-gray-400 font-mono text-xs transition-colors"
                                    />
                                </div>
                                <button type="submit" className="w-full py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold transition-all hover:scale-[1.02] uppercase tracking-wider text-xs">
                                    Publish Perk Rule
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* DEPLOY BOOTH */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-white border-l-4 border-white pl-4">Deploy Booth</h2>
                        <div className="glass-card p-8">
                            <form onSubmit={handleCreateBooth} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">New Booth Name</label>
                                    <input 
                                        type="text" 
                                        value={newBoothName} 
                                        onChange={(e) => setNewBoothName(e.target.value)} 
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 focus:border-brand outline-none text-white placeholder-gray-600 transition-colors"
                                        placeholder="e.g. Main Gate" 
                                    />
                                </div>
                                
                                {/* TOGGLE SWITCH */}
                                <div 
                                    className="p-5 rounded-xl border border-white/10 bg-white/5 flex items-center gap-5 cursor-pointer hover:bg-white/10 transition-colors"
                                    onClick={() => setRecordAchievement(!recordAchievement)}
                                >
                                    <div className={`w-14 h-8 flex-shrink-0 rounded-full p-1 transition-colors duration-300 flex items-center ${recordAchievement ? 'bg-[#00E540]' : 'bg-gray-600'}`}>
                                        <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${recordAchievement ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                    </div>
                                    
                                    <div>
                                        <p className="font-bold text-sm text-white">Record Achievement Badge</p>
                                        <p className="text-xs text-gray-500 mt-1">Enable to stamp badges on user NFTs.</p>
                                    </div>
                                </div>

                                <button type="submit" className="btn-primary w-full py-4 mt-2 shadow-[0_0_20px_rgba(0,229,64,0.2)] uppercase tracking-wider text-xs">
                                    Create Shared Booth
                                </button>
                            </form>
                        </div>
                        
                        <div className="p-4 rounded-xl bg-brand/5 border border-brand/20 text-xs text-gray-400 leading-relaxed">
                            Booths are created as <strong>Shared Objects</strong>. Once deployed, they instantly appear on the Staff Dashboard for any volunteer to use.
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
