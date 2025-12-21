import { getFullnodeUrl, SuiClient } from '@mysten/sui.js/client';

// Setup the Client (Connect to Testnet)
const client = new SuiClient({
	url: getFullnodeUrl('testnet'),
});

const TICKET_ID = '0x5407996118fe98580aec08e80e240e51ec6ff1b7498203fda87a92e3c5d35a5a';

async function main() {
	console.log('🔍 Fetching Ticket Data...');

	// Fetch the Object from the Blockchain
	const objectResponse = await client.getObject({
		id: TICKET_ID,
		options: {
			showContent: true, // We want the data fields
		},
	});

	// Parse the Data
	if (
		objectResponse.data?.content?.dataType !== 'moveObject'
	) {
		console.error('❌ Error: Object not found or wrong type.');
		return;
	}

	const fields = objectResponse.data.content.fields as any;

	console.log('✅ Ticket Found!');
	console.log(`🎫 Event: ${fields.name}`);
	console.log(`xm Description: ${fields.description}`);
	console.log('---------------------------------------------------');
	console.log('📛 BADGES COLLECTED:');

	// Loop through Badges and make them readable
	if (fields.badges.length === 0) {
		console.log('   (No badges yet)');
	} else {
		fields.badges.forEach((badge: any) => {
			const date = new Date(Number(badge.fields.timestamp));
			console.log(`   - [${badge.fields.name}] (Stamped at: ${date.toLocaleString()})`);
		});
	}
	console.log('---------------------------------------------------');
}

main();
