import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import { useUser } from '../hooks/useUser';
import { Link } from 'react-router-dom';

export default function Home() {
  const account = useCurrentAccount();
  // If useUser is missing, make sure you copied the hooks folder!
  const { buyTicket } = useUser();

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Navbar */}
      <nav className="flex justify-between items-center p-6 bg-gray-800 shadow-md border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🎟️</span>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            StashPass
          </h1>
        </div>
        <div className="flex items-center gap-4">
            {account && (
                <Link to="/my-tickets" className="text-gray-300 hover:text-white font-medium">
                    My Wallet
                </Link>
            )}
            <ConnectButton className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-all" />
        </div>
      </nav>

      {/* Hero Content */}
      <main className="flex-grow container mx-auto px-4 py-16 text-center">
        <h2 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight">
          The Future of <span className="text-blue-500">Ticketing</span>
        </h2>
        <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
          Secure, Refundable, and Collectible. Say goodbye to scalpers and hello to real fan ownership on the Sui Network.
        </p>

        {/* Ticket Card */}
        <div className="relative group max-w-sm mx-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700">
            <div className="h-48 w-full bg-gray-700 rounded-xl mb-6 overflow-hidden relative">
                <img 
                    src="https://images.unsplash.com/photo-1459749411177-229323b94132?auto=format&fit=crop&w=800&q=80" 
                    alt="Concert" 
                    className="object-cover w-full h-full opacity-80 hover:opacity-100 transition-opacity"
                />
                <div className="absolute top-2 right-2 bg-blue-600 text-xs font-bold px-2 py-1 rounded">
                    TESTNET
                </div>
            </div>
            
            <h3 className="text-2xl font-bold mb-1">Sui Builder House</h3>
            <p className="text-gray-400 text-sm mb-6">📍 Ho Chi Minh City | 📅 Dec 25, 2025</p>
            
            <div className="flex justify-between items-center bg-gray-900 p-4 rounded-lg mb-6 border border-gray-700">
                <span className="text-gray-400 text-sm uppercase tracking-wider">Price</span>
                <div className="text-right">
                    <span className="block text-2xl font-bold text-white">0.1 SUI</span>
                    <span className="text-xs text-gray-500">~Refundable</span>
                </div>
            </div>

            {!account ? (
                <div className="w-full py-4 rounded-xl bg-gray-700 text-gray-400 font-medium cursor-not-allowed">
                Connect Wallet to Buy
                </div>
            ) : (
                <button 
                onClick={() => buyTicket()}
                className="w-full bg-white text-black hover:bg-gray-200 font-bold py-4 rounded-xl text-lg transition-transform transform active:scale-95 shadow-lg"
                >
                Buy Ticket Now 🚀
                </button>
            )}
            </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-gray-400 max-w-4xl mx-auto">
            <div className="p-4">
                <div className="text-4xl mb-4">🔒</div>
                <h3 className="text-white font-bold mb-2">Anti-Scalp</h3>
                <p className="text-sm">Tickets are Soulbound and cannot be resold on secondary markets.</p>
            </div>
            <div className="p-4">
                <div className="text-4xl mb-4">💸</div>
                <h3 className="text-white font-bold mb-2">Instant Refunds</h3>
                <p className="text-sm">Can't make it? Burn your ticket for an instant 100% refund.</p>
            </div>
            <div className="p-4">
                <div className="text-4xl mb-4">🏆</div>
                <h3 className="text-white font-bold mb-2">Gamified</h3>
                <p className="text-sm">Attend events to evolve your ticket into a tradeable NFT Souvenir.</p>
            </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-gray-600 text-sm">
        <Link to="/staff" className="hover:text-gray-400 transition-colors">Staff Login</Link> • StashPass 2025
      </footer>
    </div>
  );
}
