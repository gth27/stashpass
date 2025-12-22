import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { CONFIG } from '../config';

export function useStaff() {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const stampTicket = (boothCapId: string, ticketId: string) => {
    const tx = new TransactionBlock();
    tx.moveCall({
      target: `${CONFIG.PACKAGE_ID}::event_manager::stamp_ticket`,
      arguments: [
        tx.object(boothCapId),
        tx.object(ticketId),
        tx.object('0x6')
      ],
    });

    signAndExecute({ transaction: tx }, {
      onSuccess: () => alert("✅ Ticket Stamped!"),
      onError: (err) => alert("❌ Stamping Failed: " + err)
    });
  };

  return { stampTicket };
}
