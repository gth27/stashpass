import { getFullnodeUrl, SuiClient } from '@mysten/sui.js/client';

// Setup the Client (Connect to Testnet)
const client = new SuiClient({
	url: getFullnodeUrl('testnet'),
});

const TICKET_ID = 'YOUR_TICKET_ID_HERE';

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
	if (objectResponse.data?.content?.dataType !== 'moveObject') {
		console.error('❌ Error: Object not found or wrong type.');
		return;
	}

	const fields = objectResponse.data.content.fields as any;

	console.log('✅ Ticket Found!');
	console.log(`🎫 Name: ${fields.name}`);
	console.log(`🔗 Image URL: ${fields.url}`);
	console.log('---------------------------------------------------');
	console.log('📛 BADGES COLLECTED:');

	// Loop through Badges and make them readable
	if (fields.badges.length === 0) {
		console.log('   (No badges yet)');
	} else {
        // FIXED: Badges are now simple strings
		fields.badges.forEach((badgeName: string, index: number) => {
			console.log(`   - [${index + 1}] ${badgeName}`);
		});
	}
	console.log('---------------------------------------------------');
}

main();
