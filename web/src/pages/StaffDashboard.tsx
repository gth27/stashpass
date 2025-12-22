import { useState } from 'react';
import { useStaff } from '../hooks/useStaff';
import { Link } from 'react-router-dom';

// BOOTH ID 
const DEMO_BOOTH_ID = '0x5bf654eff9b5335371289e9d53677b4637eb102821ad0ca3cd4be5359c8a9c80'; 

export default function StaffDashboard() {
  const [ticketId, setTicketId] = useState('');
  const { stampTicket } = useStaff();

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketId) return;
    stampTicket(DEMO_BOOTH_ID, ticketId);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <Link to="/" className="absolute top-4 left-4 text-gray-500 hover:text-white transition">← Exit Staff Mode</Link>

      <div className="w-full max-w-md bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-2xl relative overflow-hidden">
        {/* Decorative Scanner Line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-emerald-400 to-green-500 animate-pulse"></div>

        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-700 shadow-inner">
            <span className="text-3xl">📷</span>
          </div>
          <h2 className="text-3xl font-bold text-white">Event Scanner</h2>
          <p className="text-green-500 font-mono text-sm mt-1">● SYSTEM ONLINE</p>
        </div>

        <form onSubmit={handleScan} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
              Input Ticket ID
            </label>
            <input
              type="text"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              placeholder="0x..."
              className="w-full bg-black border border-gray-700 rounded-lg p-4 text-white focus:ring-2 focus:ring-green-500 outline-none font-mono text-center shadow-inner placeholder-gray-800"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:shadow-[0_0_30px_rgba(34,197,94,0.6)] active:scale-95"
          >
            VERIFY & CHECK-IN
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-800 text-center">
            <p className="text-xs text-gray-600 mb-1">CONNECTED BOOTH</p>
            <p className="text-xs font-mono text-gray-500">{DEMO_BOOTH_ID.slice(0, 10)}...{DEMO_BOOTH_ID.slice(-6)}</p>
        </div>
      </div>
    </div>
  );
}
