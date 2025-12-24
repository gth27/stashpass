module stashpass::event_manager {
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::tx_context::{sender};
    use std::string::{Self, String};
    use std::vector;
    use sui::vec_map::{Self, VecMap}; 
    use sui::event; 

    // --- ERROR CODES ---
    const EInsufficientPayment: u64 = 1;
    const EInvalidEvent: u64 = 2;
    const ENoBadgesForSouvenir: u64 = 3;
    const EEventMismatch: u64 = 4;
    const EAlreadyStamped: u64 = 5;

    // --- STRUCTS ---

    public struct OrganizerCap has key, store { id: UID, event_id: ID }
    
    public struct Booth has key { 
        id: UID, 
        event_id: ID, 
        booth_name: String,
        record_achievement: bool 
    }

    public struct TicketMachine has key, store { id: UID, price: u64, balance: Balance<SUI> }

    public struct RewardProps has store, drop, copy {
        description: String, 
        image_url: String    
    }

    public struct RewardConfig has key, store {
        id: UID,
        event_id: ID,
        rewards: VecMap<String, RewardProps> 
    }

    public struct Ticket has key { 
        id: UID,
        event_id: ID,
        badges: vector<String>,
        url: String, 
        name: String
    }

    public struct Souvenir has key, store {
        id: UID,
        original_event_id: ID,
        achievements: vector<String>,
        url: String,
        perks: vector<String>
    }

    // --- EVENTS ---
    public struct BoothCreated has copy, drop {
        booth_id: ID,
        event_id: ID,
        name: String,
        created_by: address
    }

    // --- FUNCTIONS ---

    public fun create_event(price: u64, ctx: &mut TxContext) {
        let machine = TicketMachine { id: object::new(ctx), price: price, balance: balance::zero() };
        let machine_id = object::id(&machine);
        let org_cap = OrganizerCap { id: object::new(ctx), event_id: machine_id };

        let config = RewardConfig {
            id: object::new(ctx),
            event_id: machine_id,
            rewards: vec_map::empty()
        };

        transfer::share_object(machine);
        transfer::share_object(config); 
        transfer::public_transfer(org_cap, sender(ctx));
    }

    public fun buy_ticket(machine: &mut TicketMachine, payment: Coin<SUI>, ctx: &mut TxContext) {
        assert!(coin::value(&payment) == machine.price, EInsufficientPayment);
        balance::join(&mut machine.balance, coin::into_balance(payment));

        let ticket = Ticket {
            id: object::new(ctx),
            event_id: object::id(machine),
            badges: vector::empty(),
            url: string::utf8(b"https://api.dicebear.com/9.x/shapes/svg?seed=TicketGray"), 
            name: string::utf8(b"General Admission")
        };
        transfer::transfer(ticket, sender(ctx));
    }

    public fun update_reward_rule(
        cap: &OrganizerCap, 
        config: &mut RewardConfig, 
        badge_name: String, 
        perk_description: String, 
        perk_url: String
    ) {
        assert!(cap.event_id == config.event_id, EEventMismatch);
        let props = RewardProps { description: perk_description, image_url: perk_url };
        if (vec_map::contains(&config.rewards, &badge_name)) {
            let val = vec_map::get_mut(&mut config.rewards, &badge_name);
            *val = props;
        } else {
            vec_map::insert(&mut config.rewards, badge_name, props);
        };
    }
    
    public fun create_booth(
        cap: &OrganizerCap, 
        name: String, 
        record_achievement: bool,
        ctx: &mut TxContext
    ) {
        let booth = Booth { 
            id: object::new(ctx), 
            event_id: cap.event_id, 
            booth_name: name,
            record_achievement: record_achievement
        };

        event::emit(BoothCreated {
            booth_id: object::id(&booth),
            event_id: cap.event_id,
            name: booth.booth_name,
            created_by: sender(ctx)
        });

        transfer::share_object(booth);
    }

    public fun stamp_ticket(booth: &Booth, ticket: &mut Ticket) {
        assert!(booth.event_id == ticket.event_id, EEventMismatch);

        if (booth.record_achievement) {
            assert!(!vector::contains(&ticket.badges, &booth.booth_name), EAlreadyStamped);
            vector::push_back(&mut ticket.badges, booth.booth_name);
            
            ticket.url = string::utf8(b"https://api.dicebear.com/9.x/shapes/svg?seed=TicketGold&backgroundColor=f1c40f");
            ticket.name = string::utf8(b"VERIFIED TICKET");
        };
    }

    public fun evolve_to_souvenir(ticket: Ticket, config: &RewardConfig, ctx: &mut TxContext) {
        let Ticket { id, event_id, badges, url: _, name: _ } = ticket;
        assert!(event_id == config.event_id, EEventMismatch);
        object::delete(id); 

        assert!(vector::length(&badges) > 0, ENoBadgesForSouvenir);

        let mut final_perks = vector::empty<String>();
        let mut final_url = string::utf8(b"https://api.dicebear.com/9.x/shapes/svg?seed=Standard&backgroundColor=e74c3c");

        let mut i = 0;
        let len = vector::length(&badges);
        while (i < len) {
            let badge = vector::borrow(&badges, i);
            if (vec_map::contains(&config.rewards, badge)) {
                let props = vec_map::get(&config.rewards, badge);
                vector::push_back(&mut final_perks, props.description);
                final_url = props.image_url;
            };
            i = i + 1;
        };
        
        if (vector::is_empty(&final_perks)) {
            vector::push_back(&mut final_perks, string::utf8(b"Event Participation Badge"));
        };

        let souvenir = Souvenir {
            id: object::new(ctx),
            original_event_id: event_id,
            achievements: badges,
            url: final_url,
            perks: final_perks
        };
        transfer::public_transfer(souvenir, sender(ctx));
    }

    public fun refund_ticket(machine: &mut TicketMachine, ticket: Ticket, ctx: &mut TxContext) {
        let Ticket { id, event_id, badges: _, url: _, name: _ } = ticket;
        assert!(event_id == object::id(machine), EInvalidEvent);
        object::delete(id); 
        let refund = coin::from_balance(balance::split(&mut machine.balance, machine.price), ctx);
        transfer::public_transfer(refund, sender(ctx));
    }

    // ✅ NEW: WITHDRAW FUNDS FUNCTION
    public fun withdraw_funds(
        cap: &OrganizerCap,
        machine: &mut TicketMachine,
        ctx: &mut TxContext
    ) {
        assert!(cap.event_id == object::id(machine), EEventMismatch);
        let amount = balance::value(&machine.balance);
        let cash = coin::take(&mut machine.balance, amount, ctx);
        transfer::public_transfer(cash, sender(ctx));
    }
}
