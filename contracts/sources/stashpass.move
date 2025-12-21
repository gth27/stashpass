module stashpass::event_manager {
    use sui::clock::{Self, Clock};
    use std::string::{Self, String};
    use std::vector;
    use sui::url::{Url};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    // --- ERRORS ---
    const EInsufficientPayment: u64 = 0;
    const EAlreadyHasBadge: u64 = 1;
    const EWrongEvent: u64 = 2; // Security: Ticket from Event A used at Event B

    // --- CONFIG ---
    // 1% Fee (100 Basis Points). 10000 bps = 100%
    const PROTOCOL_FEE_BPS: u64 = 100; 

    // --- STRUCTS ---

    // 1. THE PROTOCOL
    // Collects fees from all events. Shared Object.
    public struct ProtocolTreasury has key {
        id: UID,
        balance: Balance<SUI>
    }

    // Admin Cap for The Developer to withdraw fees
    public struct DeployerCap has key, store { id: UID }


    // 2. THE EVENT (The Organizer)
    public struct TicketMachine has key {
        id: UID,
        price: u64,
        balance: Balance<SUI> // The Organizer's money
    }

    public struct OrganizerCap has key, store { 
        id: UID,
        machine_id: ID // Links this Admin Cap to a specific machine
    }
    
    public struct BoothCap has key, store { 
        id: UID, 
        event_id: ID,  // Security: Only works for ONE event
        booth_name: String 
    }

    // 3. THE TICKET (The User)
    public struct Ticket has key, store {
        id: UID,
        event_id: ID, // Security: This ticket is valid for ONE event
        name: String,
        description: String,
        badges: vector<Badge> 
    }

    public struct Badge has store, drop {
        name: String,
        timestamp: u64
    }

    // --- INIT (Runs ONCE when deploy) ---
    fun init(ctx: &mut TxContext) {
        // Create the Treasury for The Developer to collect fees
        let treasury = ProtocolTreasury {
            id: object::new(ctx),
            balance: balance::zero()
        };
        transfer::share_object(treasury);

        // Give The Developer the key to the treasury
        let deployer = DeployerCap { id: object::new(ctx) };
        transfer::public_transfer(deployer, tx_context::sender(ctx));
    }

    // --- FACTORY FUNCTION (The SaaS Magic) ---
    // Anyone can call this to create their OWN event
    public entry fun create_event(
        price: u64,
        ctx: &mut TxContext
    ) {
        let machine = TicketMachine {
            id: object::new(ctx),
            price: price, 
            balance: balance::zero()
        };
        
        let machine_id = object::id(&machine);

        let organizer_cap = OrganizerCap { 
            id: object::new(ctx),
            machine_id: machine_id
        };

        // Share the machine so public can buy
        transfer::share_object(machine);
        // Give the organizer rights to the caller
        transfer::public_transfer(organizer_cap, tx_context::sender(ctx));
    }

    // --- USER FUNCTIONS ---

    public fun buy_ticket(
        machine: &mut TicketMachine, 
        treasury: &mut ProtocolTreasury, // User pays into both
        payment: Coin<SUI>, 
        ctx: &mut TxContext
    ) {
        let value = coin::value(&payment);
        assert!(value >= machine.price, EInsufficientPayment);

        let mut coin_balance = coin::into_balance(payment);
        
        // MONEY LOGIC: Calculate Fee
        let fee_amount = (machine.price * PROTOCOL_FEE_BPS) / 10000;
        let organizer_amount = machine.price - fee_amount;

        // Take the Fee for The Developer
        let fee = balance::split(&mut coin_balance, fee_amount);
        balance::join(&mut treasury.balance, fee);

        // Take the Rest for ORGANIZER
        let profit = balance::split(&mut coin_balance, organizer_amount);
        balance::join(&mut machine.balance, profit);

        // Refund any extra (if they paid too much)
        if (balance::value(&coin_balance) > 0) {
            transfer::public_transfer(coin::from_balance(coin_balance, ctx), tx_context::sender(ctx));
        } else {
            balance::destroy_zero(coin_balance);
        };

        // Issue Ticket
        let ticket = Ticket {
            id: object::new(ctx),
            event_id: object::id(machine), // Link ticket to this specific machine
            name: string::utf8(b"Event Access"),
            description: string::utf8(b"General Admission"),
            badges: vector::empty()
        };

        transfer::public_transfer(ticket, tx_context::sender(ctx));
    }

    // --- ORGANIZER FUNCTIONS ---

    // Organizer withdraws ONLY their money
    public fun withdraw_profits(
        cap: &OrganizerCap,
        machine: &mut TicketMachine,
        ctx: &mut TxContext
    ) {
        // Security: Ensure this Cap matches this Machine
        assert!(object::id(machine) == cap.machine_id, EWrongEvent);

        let amount = balance::value(&machine.balance);
        let cash = coin::take(&mut machine.balance, amount, ctx);
        transfer::public_transfer(cash, tx_context::sender(ctx));
    }

    // Deployer withdraw fees
    public fun collect_fees(
        _: &DeployerCap,
        treasury: &mut ProtocolTreasury,
        ctx: &mut TxContext
    ) {
        let amount = balance::value(&treasury.balance);
        let cash = coin::take(&mut treasury.balance, amount, ctx);
        transfer::public_transfer(cash, tx_context::sender(ctx));
    }

    public fun create_booth(
        cap: &OrganizerCap, 
        name: String, 
        ctx: &mut TxContext
    ) {
        let booth = BoothCap {
            id: object::new(ctx),
            event_id: cap.machine_id, // Link booth to the same event
            booth_name: name
        };
        transfer::public_transfer(booth, tx_context::sender(ctx));
    }

    // --- STAFF FUNCTIONS ---

    public fun stamp_ticket(
        booth: &BoothCap,
        ticket: &mut Ticket,
        clock: &Clock,
        _ctx: &mut TxContext 
    ) {
        // SECURITY: Prevents using Event A ticket at Event B booth
        assert!(ticket.event_id == booth.event_id, EWrongEvent);
        assert!(!has_badge(ticket, &booth.booth_name), EAlreadyHasBadge);

        let badge = Badge {
            name: booth.booth_name, 
            timestamp: clock::timestamp_ms(clock)
        };

        vector::push_back(&mut ticket.badges, badge);
    }

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