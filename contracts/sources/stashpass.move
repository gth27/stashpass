module stashpass::event_manager {
    use sui::clock::{Self, Clock};
    use std::string::{Self, String};
    use std::vector;
    use sui::url::{Url};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    // Error: You paid less than the price
    const EInsufficientPayment: u64 = 0;
    const EAlreadyHasBadge: u64 = 1;

    // --- STRUCTS ---
    public struct Ticket has key, store {
        id: UID,
        name: String,
        description: String,
        badges: vector<Badge> 
    }

    public struct Badge has store, drop {
        name: String,
        image_url: Url,
        timestamp: u64
    }

    public struct TicketMachine has key {
        id: UID,
        price: u64,
        balance: Balance<SUI>
    }

    public struct OrganizerCap has key { id: UID }
    
    public struct BoothCap has key, store { 
        id: UID, 
        booth_name: String 
    }

    // --- INIT ---
    fun init(ctx: &mut TxContext) {
        let admin_cap = OrganizerCap { id: object::new(ctx) };
        transfer::transfer(admin_cap, tx_context::sender(ctx));

        let machine = TicketMachine {
            id: object::new(ctx),
            // PRICE SET TO 0.1 SUI (100,000,000 MIST)
            price: 100_000_000, 
            balance: balance::zero()
        };
        transfer::share_object(machine);
    }

    // --- FUNCTIONS ---

    public fun buy_ticket(
        machine: &mut TicketMachine, 
        payment: Coin<SUI>, 
        ctx: &mut TxContext
    ) {
        let value = coin::value(&payment);
        assert!(value >= machine.price, EInsufficientPayment);

        let coin_balance = coin::into_balance(payment);
        balance::join(&mut machine.balance, coin_balance);

        let ticket = Ticket {
            id: object::new(ctx),
            name: string::utf8(b"Sui Hackathon 2025"),
            description: string::utf8(b"Access to all zones"),
            badges: vector::empty()
        };

        transfer::public_transfer(ticket, tx_context::sender(ctx));
    }

    public fun withdraw(
        _: &OrganizerCap,
        machine: &mut TicketMachine,
        ctx: &mut TxContext
    ) {
        let amount = balance::value(&machine.balance);
        let cash = coin::take(&mut machine.balance, amount, ctx);
        transfer::public_transfer(cash, tx_context::sender(ctx));
    }

    // Create a Booth (Only Organizer can do this)
    public fun create_booth(
        _: &OrganizerCap, 
        name: String, 
        ctx: &mut TxContext
    ) {
        let booth = BoothCap {
            id: object::new(ctx),
            booth_name: name
        };
        // Send the BoothCap to the Organizer (who can then send it to staff)
        transfer::public_transfer(booth, tx_context::sender(ctx));
    }

    // Stamp a Ticket (Only BoothCap holder can do this)
    public fun stamp_ticket(
        booth: &BoothCap,
        ticket: &mut Ticket,
        clock: &Clock,
        _ctx: &mut TxContext 
    ) {
        // SECURITY CHECK
        assert!(!has_badge(ticket, &booth.booth_name), EAlreadyHasBadge);

        let badge = Badge {
            name: booth.booth_name, 
            image_url: sui::url::new_unsafe_from_bytes(b"https://example.com/badge.png"),
            timestamp: clock::timestamp_ms(clock)
        };

        vector::push_back(&mut ticket.badges, badge);
    }
    // Helper: Check if a ticket already has a badge from this booth
    fun has_badge(ticket: &Ticket, booth_name: &String): bool {
        let count = vector::length(&ticket.badges);
        let mut i = 0;
        while (i < count) {
            let badge = vector::borrow(&ticket.badges, i);
            if (&badge.name == booth_name) {
                return true
            };
            i = i + 1;
        };
        false
    }
}