import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { CONFIG } from '../config';

export function useRefund() {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const refundTicket = (ticketId: string) => {
    if(!confirm("Refund this ticket? It will be burned.")) return;

    const tx = new TransactionBlock();
    tx.moveCall({
      target: `${CONFIG.PACKAGE_ID}::event_manager::refund_ticket`,
      arguments: [
        tx.object(CONFIG.TEST_EVENT_ID), 
        tx.object(ticketId)              
      ],
    });

    signAndExecute({ transaction: tx }, {
      onSuccess: () => {
        alert("💸 Refund Successful!");
        window.location.reload(); 
      },
      onError: (err) => alert("❌ Refund Failed.")
    });
  };

  return { refundTicket };
}
