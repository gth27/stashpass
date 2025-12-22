import { useCurrentAccount } from '@mysten/dapp-kit';
import { useUser } from '../hooks/useUser';
import { useRefund } from '../hooks/useRefund';
import { useEvolve } from '../hooks/useEvolve';
import { Link } from 'react-router-dom';
import QRCode from 'react-qr-code';

export default function MyTickets() {
  const account = useCurrentAccount();
  const { tickets, souvenirs, refreshTickets } = useUser();
  const { refundTicket } = useRefund();
  const { evolveTicket } = useEvolve();

  if (!account) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-10 text-center">
        <h2 className="text-2xl font-bold mb-4">Wallet Not Connected</h2>
        <p className="text-gray-400 mb-6">Please connect your wallet to view your tickets.</p>
        <Link to="/" className="text-blue-500 hover:underline">Return Home</Link>
    </div>
  );

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
        <h2 className="text-3xl font-bold">My Wallet</h2>
        <Link to="/" className="text-sm bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded transition">
            ← Back to Store
        </Link>
      </div>

      {/* SECTION 1: ACTIVE TICKETS */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6">
            <h3 className="text-xl text-blue-400 font-bold">🎟️ Active Tickets</h3>
            <button onClick={() => refreshTickets()} className="text-xs bg-gray-800 p-1 rounded hover:bg-gray-700" title="Refresh">🔄</button>
        </div>

        {tickets?.data.length === 0 ? (
          <div className="bg-gray-800/50 border border-dashed border-gray-700 rounded-xl p-10 text-center">
            <p className="text-gray-500 italic mb-4">No active tickets found.</p>
            <Link to="/" className="text-blue-400 hover:text-blue-300 font-bold text-sm">Buy a Ticket →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tickets?.data.map((ticket: any) => {
              const fields = ticket.data?.content?.fields;
              if (!fields) return null;
              
              const hasBadges = fields.badges.length > 0;
              const ticketId = ticket.data.objectId;
              
              return (
                <div key={ticketId} className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 shadow-xl transition-transform hover:-translate-y-1">
                  {/* Dynamic Image */}
                  <div className="relative h-48 bg-gray-900">
                    <img src={fields.url} alt="Ticket" className="w-full h-full object-cover" />
                    {hasBadges && (
                        <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded shadow-sm">
                            VERIFIED
                        </div>
                    )}
                  </div>
                  
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h4 className="text-xl font-bold text-white">{fields.name}</h4>
                            <p className="text-xs text-gray-500 mt-1">Sui Builder House</p>
                        </div>
                    </div>
                    
                    {/* QR Code Area */}
                    <div className="bg-white p-3 rounded-xl mb-6 mx-auto w-fit shadow-inner">
                        <QRCode 
                            value={ticketId} 
                            size={100} 
                            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                            viewBox={`0 0 256 256`}
                        />
                    </div>
                    <p className="text-[10px] text-gray-500 text-center font-mono mb-6 break-all bg-gray-900 p-1 rounded">
                        ID: {ticketId}
                    </p>

                    <div className="flex gap-3">
                      {/* Refund Logic */}
                      {!hasBadges && (
                        <button 
                          onClick={() => refundTicket(ticketId)}
                          className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 py-3 rounded-lg font-medium transition-colors text-sm"
                        >
                          Refund Ticket
                        </button>
                      )}

                      {/* Evolve Logic */}
                      {hasBadges ? (
                        <button 
                          onClick={() => evolveTicket(ticketId)}
                          className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black py-3 rounded-lg font-bold shadow-lg shadow-yellow-500/20 animate-pulse text-sm"
                        >
                          Evolve to NFT ✨
                        </button>
                      ) : (
                         <div className="flex-1 text-center py-3 text-xs text-gray-500 bg-gray-900 rounded-lg border border-gray-800">
                            Check-in to Evolve
                         </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 2: SOUVENIRS */}
      <section>
        <h3 className="text-xl text-yellow-500 font-bold mb-6 flex items-center gap-2">
            🏆 Souvenirs <span className="text-sm font-normal text-gray-500">(Tradeable NFTs)</span>
        </h3>
        
        {souvenirs?.data.length === 0 ? (
           <p className="text-gray-600 text-sm">Attend events and evolve your tickets to earn permanent Souvenirs.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {souvenirs?.data.map((nft: any) => (
              <div key={nft.data.objectId} className="bg-gradient-to-br from-yellow-900/40 to-gray-800 p-6 rounded-xl border border-yellow-600/30 flex gap-4 items-center shadow-lg">
                <img src={nft.data.content.fields.url} className="w-20 h-20 rounded-full border-2 border-yellow-500/50 shadow-md bg-black" />
                <div>
                  <h4 className="text-lg font-bold text-yellow-500">Event Alumni</h4>
                  <p className="text-xs text-gray-400 mb-2">Edition #2025</p>
                  
                  {/* SPONSOR PERK */}
                  <div className="bg-green-900/30 text-green-400 text-[10px] font-bold px-2 py-1 rounded border border-green-700/50 inline-flex items-center gap-1">
                    🎁 20% MERCH OFF
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
