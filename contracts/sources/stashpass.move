module stashpass::event_manager {
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::tx_context::{sender};
    use std::string::{Self, String};
    use std::vector;

    // --- ERROR CODES ---
    const EInsufficientPayment: u64 = 1;
    const EInvalidEvent: u64 = 2;
    const ENoBadgesForSouvenir: u64 = 3;

    // --- STRUCTS ---

    public struct OrganizerCap has key, store { id: UID }
    
    public struct BoothCap has key, store { 
        id: UID, 
        event_id: ID, 
        booth_name: String 
    }

    public struct TicketMachine has key, store { 
        id: UID, 
        price: u64, 
        balance: Balance<SUI> 
    }

    // 1. TICKET (Soulbound + Dynamic Visuals)
    // NO 'store' = Anti-Scalper (Cannot sell)
    public struct Ticket has key { 
        id: UID,
        event_id: ID,
        badges: vector<String>,
        url: String, // Mutable Image
        name: String
    }

    // 2. SOUVENIR (Tradeable NFT)
    // HAS 'store' = Secondary Market Item
    public struct Souvenir has key, store {
        id: UID,
        original_event_id: ID,
        achievements: vector<String>,
        url: String
    }

    // --- FUNCTIONS ---

    public fun create_event(price: u64, ctx: &mut TxContext) {
        let machine = TicketMachine {
            id: object::new(ctx),
            price: price,
            balance: balance::zero(),
        };
        let org_cap = OrganizerCap { id: object::new(ctx) };
        transfer::share_object(machine);
        transfer::public_transfer(org_cap, sender(ctx));
    }

    public fun buy_ticket(machine: &mut TicketMachine, payment: Coin<SUI>, ctx: &mut TxContext) {
        assert!(coin::value(&payment) == machine.price, EInsufficientPayment);
        balance::join(&mut machine.balance, coin::into_balance(payment));

        let ticket = Ticket {
            id: object::new(ctx),
            event_id: object::id(machine),
            badges: vector::empty(),
            // 🌑 Default Image (Gray)
            url: string::utf8(b"https://api.dicebear.com/9.x/shapes/svg?seed=TicketGray"), 
            name: string::utf8(b"General Admission")
        };
        // Send using transfer::transfer (Soulbound)
        transfer::transfer(ticket, sender(ctx));
    }

    // REFUND LOGIC
    public fun refund_ticket(machine: &mut TicketMachine, ticket: Ticket, ctx: &mut TxContext) {
        let Ticket { id, event_id, badges: _, url: _, name: _ } = ticket;
        assert!(event_id == object::id(machine), EInvalidEvent);
        object::delete(id); // Burn ticket

        // Return money
        let refund = coin::from_balance(balance::split(&mut machine.balance, machine.price), ctx);
        transfer::public_transfer(refund, sender(ctx));
    }

    public fun create_booth(org_cap: &OrganizerCap, name: String, ctx: &mut TxContext) {
        let booth = BoothCap {
            id: object::new(ctx),
            event_id: object::id(org_cap), 
            booth_name: name
        };
        transfer::public_transfer(booth, sender(ctx));
    }

    // STAMPING & MUTATION LOGIC
    public fun stamp_ticket(booth: &BoothCap, ticket: &mut Ticket, _clock: &sui::clock::Clock) {
        vector::push_back(&mut ticket.badges, booth.booth_name);
        
        //  UPGRADE VISUALS: Change to Gold Image
        ticket.url = string::utf8(b"https://api.dicebear.com/9.x/shapes/svg?seed=TicketGold&backgroundColor=f1c40f");
        ticket.name = string::utf8(b"VERIFIED TICKET");
    }

    // EVOLUTION LOGIC
    public fun evolve_to_souvenir(ticket: Ticket, ctx: &mut TxContext) {
        let Ticket { id, event_id, badges, url: _, name: _ } = ticket;
        object::delete(id); // Burn Ticket

        // Must have attended (1+ badge)
        assert!(vector::length(&badges) > 0, ENoBadgesForSouvenir);

        let souvenir = Souvenir {
            id: object::new(ctx),
            original_event_id: event_id,
            achievements: badges,
            // Permanent Red Souvenir Image
            url: string::utf8(b"https://api.dicebear.com/9.x/shapes/svg?seed=Souvenir&backgroundColor=e74c3c")
        };
        transfer::public_transfer(souvenir, sender(ctx));
    }
}
