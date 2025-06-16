const { MongoClient } = require('mongodb');

async function createFriendCoupons() {
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        const db = client.db();
        const coupons = db.collection('coupons');
        
        // Create 10 friend coupons
        const friendCoupons = [];
        for (let i = 1; i <= 10; i++) {
            const code = `FRIENDS${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
            friendCoupons.push({
                code,
                name: `Friend Code #${i}`,
                description: 'Special 100% discount for friends and family',
                type: 'free_tier',
                value: 100,
                tier: 'silver', // Default to silver, but works for gold too
                maxUses: 1,
                usedCount: 0,
                validFrom: new Date(),
                validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
                isActive: true,
                applicableTiers: ['silver', 'gold'],
                applicableCycles: ['monthly', 'yearly'],
                createdBy: 'your-email@example.com', // Replace with your email
                createdAt: new Date(),
                usedBy: []
            });
        }
        
        const result = await coupons.insertMany(friendCoupons);
        console.log(`Created ${result.insertedCount} friend coupons:`);
        
        friendCoupons.forEach(coupon => {
            console.log(`- ${coupon.code}: ${coupon.name}`);
        });
        
    } finally {
        await client.close();
    }
}

// Run: node scripts/create-friend-coupons.js
if (require.main === module) {
    createFriendCoupons().catch(console.error);
}