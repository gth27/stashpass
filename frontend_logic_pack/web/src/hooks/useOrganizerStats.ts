import { useSuiClientQuery } from '@mysten/dapp-kit';
import { CONFIG } from '../config';

export function useOrganizerStats() {
  // Fetch the TicketMachine Object to see the Balance
  const { data, refetch } = useSuiClientQuery(
    'getObject',
    {
      id: CONFIG.TEST_EVENT_ID,
      options: { showContent: true }
    },
    { refetchInterval: 5000 } // Auto-refresh every 5 seconds (Live Dashboard!)
  );

  const stats = (() => {
    if (!data || !data.data || !data.data.content) return null;
    
    // Parse the Move Struct
    const fields = (data.data.content as any).fields;
    
    const price = Number(fields.price);
    const balance = Number(fields.balance); // The SUI inside the machine
    
    return {
      ticketPrice: price / 1_000_000_000, // Convert MIST to SUI
      totalRevenue: balance / 1_000_000_000, // Convert MIST to SUI
      ticketsSold: Math.floor(balance / price) // Calculate count based on money
    };
  })();

  return { stats, refetch };
}
