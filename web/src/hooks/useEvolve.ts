import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { CONFIG } from '../config';
import toast from 'react-hot-toast';

export function useEvolve() {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const evolveTicket = (ticketId: string, onSuccess?: () => void) => {
    
    // 1. Check if Config is loaded
    if (!CONFIG.REWARD_CONFIG_ID) {
        toast.error("❌ System Error: Missing Reward Config ID");
        console.error("CONFIG.REWARD_CONFIG_ID is undefined. Check config.ts!");
        return;
    }

    const toastId = toast.loading("Evolving Ticket...");
    const tx = new Transaction();

    // 2. The Fix: Pass BOTH arguments
    tx.moveCall({
      target: `${CONFIG.PACKAGE_ID}::event_manager::evolve_to_souvenir`,
      arguments: [ 
          tx.object(ticketId),                // Argument 1: The Ticket
          tx.object(CONFIG.REWARD_CONFIG_ID)  // Argument 2: The Reward Rules (Shared Object)
      ],
    });

    signAndExecute({ transaction: tx }, {
      onSuccess: () => {
        toast.success("🏆 Evolution Complete! You now own a Souvenir NFT.", { id: toastId, duration: 4000 });
        if (onSuccess) onSuccess();
      },
      onError: (err) => {
        console.error(err);
        // Better error message
        if (err.message?.includes("Incorrect number of arguments")) {
             toast.error("❌ Contract Mismatch: Frontend sending wrong args.", { id: toastId });
        } else {
             toast.error("❌ Evolution Failed. Do you have the required badges?", { id: toastId });
        }
      }
    });
  };

  return { evolveTicket };
}
