import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { CONFIG } from '../config';

export function useEvolve() {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const evolveTicket = (ticketId: string) => {
    const tx = new TransactionBlock();

    tx.moveCall({
      target: `${CONFIG.PACKAGE_ID}::event_manager::evolve_to_souvenir`,
      arguments: [ tx.object(ticketId) ],
    });

    signAndExecute({ transaction: tx }, {
      onSuccess: () => {
        alert("🏆 Evolved to Souvenir NFT!");
        window.location.reload();
      },
      onError: (err) => alert("❌ Evolution Failed.")
    });
  };

  return { evolveTicket };
}
