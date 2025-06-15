// lib/rateLimit.ts
interface RateLimitEntry {
    count: number;
    resetTime: number;
}

class RateLimiter {
    private limits = new Map<string, RateLimitEntry>();

    // Clean up expired entries periodically
    private cleanup() {
        const now = Date.now();
        for (const [key, entry] of this.limits.entries()) {
            if (now > entry.resetTime) {
                this.limits.delete(key);
            }
        }
    }

    public checkLimit(
        identifier: string, 
        maxRequests: number, 
        windowMs: number
    ): { allowed: boolean; remainingRequests: number; resetTime: number } {
        this.cleanup();
        
        const now = Date.now();
        const key = identifier;
        const entry = this.limits.get(key);

        if (!entry || now > entry.resetTime) {
            // Create new entry or reset expired one
            const newEntry: RateLimitEntry = {
                count: 1,
                resetTime: now + windowMs
            };
            this.limits.set(key, newEntry);
            
            return {
                allowed: true,
                remainingRequests: maxRequests - 1,
                resetTime: newEntry.resetTime
            };
        }

        if (entry.count >= maxRequests) {
            return {
                allowed: false,
                remainingRequests: 0,
                resetTime: entry.resetTime
            };
        }

        // Increment count
        entry.count++;
        this.limits.set(key, entry);

        return {
            allowed: true,
            remainingRequests: maxRequests - entry.count,
            resetTime: entry.resetTime
        };
    }
}

// Global rate limiter instances
export const statsUpdateLimiter = new RateLimiter();
export const aiRequestLimiter = new RateLimiter();
export const partyCreationLimiter = new RateLimiter();

// Rate limit configurations
export const RATE_LIMITS = {
    STATS_UPDATE: {
        maxRequests: 1, // 1 request per party
        windowMs: 5 * 60 * 1000, // 5 minutes
    },
    AI_REQUESTS: {
        maxRequests: 20, // 20 requests per user
        windowMs: 60 * 1000, // 1 minute
    },
    PARTY_CREATION: {
        maxRequests: 5, // 5 parties per user
        windowMs: 24 * 60 * 60 * 1000, // 24 hours
    },
    PARTY_JOIN: {
        maxRequests: 10, // 10 joins per user
        windowMs: 60 * 60 * 1000, // 1 hour
    }
};

// Helper function to get user limits from database
export async function getUserLimits(db: any, userEmail: string) {
    const users = db.collection("users");
    const user = await users.findOne({ email: userEmail });
    
    // Count user's parties
    const parties = db.collection("parties");
    const userPartiesCount = await parties.countDocuments({
        "members.email": userEmail
    });

    const userCreatedPartiesCount = await parties.countDocuments({
        createdBy: userEmail
    });

    return {
        totalParties: userPartiesCount,
        createdParties: userCreatedPartiesCount,
        maxParties: 10, // Maximum parties a user can be in
        maxCreatedParties: 5, // Maximum parties a user can create
        isPremium: user?.isPremium || false // For future premium features
    };
}