import { useSignAndExecuteTransaction, useCurrentAccount, useSuiClientQuery } from '@mysten/dapp-kit';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { CONFIG } from '../config';

export function useUser() {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const account = useCurrentAccount();

  const buyTicket = (priceInMist: number = 100000000) => { 
    const tx = new TransactionBlock();
    const [payment] = tx.splitCoins(tx.gas, [tx.pure(priceInMist)]);

    tx.moveCall({
      target: `${CONFIG.PACKAGE_ID}::event_manager::buy_ticket`,
      arguments: [
        tx.object(CONFIG.TEST_EVENT_ID),
        payment
      ],
    });

    // UPDATED SYNTAX: 'transaction' instead of 'transactionBlock'
    signAndExecute({ transaction: tx }, {
      onSuccess: () => alert("🎟️ Ticket Purchased!"),
      onError: (err) => alert("❌ Purchase Failed: " + err)
    });
  };

  const { data: tickets, refetch: refreshTickets } = useSuiClientQuery(
    'getOwnedObjects',
    {
      owner: account?.address || '',
      filter: { StructType: `${CONFIG.PACKAGE_ID}::event_manager::Ticket` },
      options: { showContent: true, showDisplay: true } 
    },
    { enabled: !!account }
  );

  const { data: souvenirs } = useSuiClientQuery(
    'getOwnedObjects',
    {
      owner: account?.address || '',
      filter: { StructType: `${CONFIG.PACKAGE_ID}::event_manager::Souvenir` },
      options: { showContent: true, showDisplay: true }
    },
    { enabled: !!account }
  );

  return { buyTicket, tickets, souvenirs, refreshTickets };
}
