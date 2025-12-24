import { useSignAndExecuteTransaction, useCurrentAccount, useSuiClientQuery } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { CONFIG } from '../config';
import toast from 'react-hot-toast';
import { useRef } from 'react';

export function useUser() {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const account = useCurrentAccount();
  
  const prevTicketCount = useRef(0);

  // 1. TICKETS QUERY
  const { data: tickets, refetch: refreshTickets } = useSuiClientQuery(
    'getOwnedObjects',
    {
      owner: account?.address || '',
      filter: { StructType: `${CONFIG.PACKAGE_ID}::event_manager::Ticket` },
      options: { showContent: true, showDisplay: true } 
    },
    { 
      enabled: !!account,
      refetchInterval: 2000 
    }
  );

  // 2. SOUVENIRS QUERY
  const { data: souvenirs, refetch: refreshSouvenirs } = useSuiClientQuery(
    'getOwnedObjects',
    {
      owner: account?.address || '',
      filter: { StructType: `${CONFIG.PACKAGE_ID}::event_manager::Souvenir` },
      options: { showContent: true, showDisplay: true }
    },
    { 
      enabled: !!account,
      refetchInterval: 2000 
    }
  );

  const buyTicket = (priceInMist: number = 100000000) => { 
    const toastId = toast.loading("Processing Transaction...");
    prevTicketCount.current = tickets?.data?.length || 0;
    
    const tx = new Transaction();
    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(priceInMist)]);
    
    tx.moveCall({
      target: `${CONFIG.PACKAGE_ID}::event_manager::buy_ticket`,
      arguments: [
        tx.object(CONFIG.TEST_EVENT_ID),
        coin
      ],
    });

    signAndExecute({ transaction: tx }, {
        onSuccess: () => {
          toast.loading("Verifying purchase...", { id: toastId });
          setTimeout(() => verifyTicketArrival(toastId), 2000);
        },
        onError: (err) => {
          console.warn("Check inventory...", err);
          toast.loading("Verifying...", { id: toastId });
          setTimeout(() => verifyTicketArrival(toastId), 2500);
        }
    });
  };

  const verifyTicketArrival = async (toastId: string) => {
    const result = await refreshTickets();
    const newCount = result.data?.data?.length || 0;
    if (newCount > prevTicketCount.current) {
      toast.success("🎟️ Ticket Received!", { id: toastId });
    } else {
      toast.error("Transaction sent, but ticket not found yet. Refresh shortly.", { id: toastId });
    }
  };

  // ✅ NEW: Scan Booth Function
  const scanBooth = (boothId: string) => {
      // 1. Find the user's ticket
      const ticketId = tickets?.data?.[0]?.data?.objectId;
      if (!ticketId) {
          toast.error("You need a Ticket first!");
          return;
      }

      const tx = new Transaction();
      tx.moveCall({
          target: `${CONFIG.PACKAGE_ID}::event_manager::stamp_ticket`,
          arguments: [
              tx.object(boothId),  // Shared Booth ID
              tx.object(ticketId)  // User's Ticket
          ]
      });

      const toastId = toast.loading("Collecting Badge...");
      signAndExecute({ transaction: tx }, {
          onSuccess: () => {
              toast.success("Badge Collected!", { id: toastId });
              setTimeout(() => refreshTickets(), 1000); // Refresh to show new badge
          },
          onError: (err) => {
             // Handle "Already Stamped" error gracefully
             if(err.message.includes("Error Code 5")) {
                 toast.error("You already have this badge!", { id: toastId });
             } else {
                 toast.error("Scan Failed: " + err.message, { id: toastId });
             }
          }
      });
  };

  return {
    tickets,
    souvenirs,
    buyTicket,
    scanBooth, // 👈 Exported
    refreshTickets,
    refreshSouvenirs
  };
}
