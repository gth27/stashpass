import { useSuiClientQuery } from '@mysten/dapp-kit';
import { CONFIG } from '../config';

export function useOrganizerStats() {
  const { data, refetch } = useSuiClientQuery(
    'getObject',
    {
      id: CONFIG.TEST_EVENT_ID,
      options: { showContent: true }
    },
    { refetchInterval: 3000 }
  );

  const stats = (() => {
    if (!data || !data.data || !data.data.content) return null;
    
    const fields = (data.data.content as any).fields;
    
    // Safety check for strings vs numbers from RPC
    const priceRaw = Number(fields.price);
    const balanceRaw = Number(fields.balance?.fields?.value || fields.balance || 0);

    // 1% Fee Logic: Organizer gets 99%
    const organizerSharePerTicket = priceRaw * 0.99;

    const ticketsSold = organizerSharePerTicket > 0 
        ? Math.floor(balanceRaw / organizerSharePerTicket) 
        : 0;

    return {
      ticketPrice: priceRaw / 1_000_000_000, 
      // This must match what Admin.tsx expects
      organizerRevenue: balanceRaw / 1_000_000_000, 
      ticketsSold: ticketsSold 
    };
  })();

  return { stats, refetch };
}
