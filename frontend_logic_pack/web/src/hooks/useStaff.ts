import { useSignAndExecuteTransactionBlock } from '@mysten/dapp-kit';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { CONFIG } from '../config';

export function useStaff() {
  const { mutate: signAndExecute } = useSignAndExecuteTransactionBlock();

  // boothCapId: Must be provided by the staff user (hardcoded for now is fine for hackathon)
  const stampTicket = (boothCapId: string, ticketId: string) => {
    const tx = new TransactionBlock();
    const CLOCK = '0x6';

    tx.moveCall({
      target: `${CONFIG.PACKAGE_ID}::event_manager::stamp_ticket`,
      arguments: [
        tx.object(boothCapId),
        tx.object(ticketId),
        tx.object(CLOCK)
      ],
    });

    signAndExecute({ transactionBlock: tx }, {
      onSuccess: () => alert("✅ Ticket Stamped! Image Updated to Gold."),
      onError: (err) => alert("❌ Stamping Failed.")
    });
  };

  return { stampTicket };
}
