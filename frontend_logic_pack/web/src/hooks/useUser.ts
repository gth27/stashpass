import { useSignAndExecuteTransactionBlock, useCurrentAccount, useSuiClientQuery } from '@mysten/dapp-kit';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { CONFIG } from '../config';

export function useUser() {
  const { mutate: signAndExecute } = useSignAndExecuteTransactionBlock();
  const account = useCurrentAccount();

  // 1. Buy Ticket Logic
  const buyTicket = (priceInMist: number = 100000000) => { // Default 0.1 SUI
    const tx = new TransactionBlock();
    const [payment] = tx.splitCoins(tx.gas, [tx.pure(priceInMist)]);

    tx.moveCall({
      target: `${CONFIG.PACKAGE_ID}::event_manager::buy_ticket`,
      arguments: [
        tx.object(CONFIG.TEST_EVENT_ID),
        payment
      ],
    });

    signAndExecute({ transactionBlock: tx }, {
      onSuccess: () => alert("🎟️ Ticket Purchased Successfully!"),
      onError: (err) => {
        console.error(err);
        alert("❌ Purchase Failed.");
      }
    });
  };

  // 2. Fetch My Tickets (With Images!)
  const { data: tickets, refetch: refreshTickets } = useSuiClientQuery(
    'getOwnedObjects',
    {
      owner: account?.address || '',
      filter: { StructType: `${CONFIG.PACKAGE_ID}::event_manager::Ticket` },
      options: { showContent: true, showDisplay: true } // Need this for the URL!
    },
    { enabled: !!account }
  );

  // 3. Fetch My Souvenirs (The Evolved NFTs)
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
