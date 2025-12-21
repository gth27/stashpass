import { useSignAndExecuteTransactionBlock } from '@mysten/dapp-kit';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { CONFIG } from '../config';

export function useEvolve() {
  const { mutate: signAndExecute } = useSignAndExecuteTransactionBlock();

  const evolveTicket = (ticketId: string) => {
    const tx = new TransactionBlock();

    tx.moveCall({
      target: `${CONFIG.PACKAGE_ID}::event_manager::evolve_to_souvenir`,
      arguments: [ tx.object(ticketId) ],
    });

    signAndExecute({ transactionBlock: tx }, {
      onSuccess: () => {
        alert("🏆 Evolution Complete! You now own a tradeable Souvenir NFT.");
        window.location.reload();
      },
      onError: (err) => alert("❌ Evolution Failed. Did you collect badges first?")
    });
  };

  return { evolveTicket };
}
