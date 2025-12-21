import { useSignAndExecuteTransactionBlock } from '@mysten/dapp-kit';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { CONFIG } from '../config';

export function useRefund() {
  const { mutate: signAndExecute } = useSignAndExecuteTransactionBlock();

  const refundTicket = (ticketId: string) => {
    if(!confirm("Are you sure you want to refund this ticket? You will lose access.")) return;

    const tx = new TransactionBlock();
    
    tx.moveCall({
      target: `${CONFIG.PACKAGE_ID}::event_manager::refund_ticket`,
      arguments: [
        tx.object(CONFIG.TEST_EVENT_ID), // The Machine to get money from
        tx.object(ticketId)              // The Ticket to burn
      ],
    });

    signAndExecute({ transactionBlock: tx }, {
      onSuccess: () => {
        alert("💸 Refund Successful! Funds returned to wallet.");
        window.location.reload(); // Quick refresh to update UI
      },
      onError: (err) => alert("❌ Refund Failed.")
    });
  };

  return { refundTicket };
}
