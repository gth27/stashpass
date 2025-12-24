import { useConnectWallet, useWallets } from '@mysten/dapp-kit';
import { useState, useEffect } from 'react';

export function MobileConnectButton() {
  const { mutate: connect } = useConnectWallet();
  const wallets = useWallets();
  const [targetWallet, setTargetWallet] = useState<any>(null);

  useEffect(() => {
    // 1. Look for WalletConnect (Best for mobile)
    let found = wallets.find(w => w.name.toLowerCase().includes('walletconnect'));

    // 2. If not found, look for "Sui Wallet" (Often has deep link support built-in)
    if (!found) {
        found = wallets.find(w => w.name.toLowerCase().includes('sui wallet'));
    }

    // 3. Fallback: Just take the first one available if strictly on mobile
    if (!found && wallets.length > 0) {
        found = wallets[0];
    }

    setTargetWallet(found);
  }, [wallets]);

  const handleConnect = () => {
    if (targetWallet) {
      // This triggers the deep link / QR code modal immediately
      connect({ wallet: targetWallet }); 
    } else {
      alert("No mobile-compatible wallet found. Please ensure WalletConnect is configured in your provider.");
    }
  };

  return (
    <button 
      onClick={handleConnect}
      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg active:scale-95 transition-all flex items-center gap-2"
    >
      <span>📱</span> Connect Mobile Wallet
    </button>
  );
}
