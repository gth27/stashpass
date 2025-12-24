import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { CONFIG } from '../config';
import toast from 'react-hot-toast';

export function useStaff() {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const stampTicket = (boothCapId: string, ticketId: string) => {
    const toastId = toast.loading("Verifying & Stamping...");
    const tx = new Transaction();
    
    // REMOVED: const CLOCK = '0x6';

    tx.moveCall({
      target: `${CONFIG.PACKAGE_ID}::event_manager::stamp_ticket`,
      arguments: [
        tx.object(boothCapId),
        tx.object(ticketId)
        // REMOVED CLOCK
      ],
    });

    signAndExecute({ transaction: tx }, {
      onSuccess: () => toast.success("✅ Ticket Stamped! Access Granted.", { id: toastId }),
      onError: (err) => {
        console.error(err);
        toast.error("❌ Stamping Failed. Check console.", { id: toastId });
      }
    });
  };

  return { stampTicket };
}
