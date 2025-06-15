import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { connectToDatabase } from "./mongodb";

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        }),
    ],

    callbacks: {
        async signIn({ user, account, profile }) {
            try {
                const db = await connectToDatabase();
                const users = db.collection("users");

                // Check if user exists
                const existingUser = await users.findOne({ email: user.email });

                if (!existingUser) {
                    // Create new user
                    await users.insertOne({
                        email: user.email,
                        name: user.name,
                        image: user.image,
                        provider: account?.provider,
                        providerId: account?.providerAccountId,
                        createdAt: new Date(),
                        onboarded: false,
                    });
                } else {
                    // Update last login and provider info if needed
                    await users.updateOne(
                        { email: user.email },
                        {
                            $set: {
                                lastLogin: new Date(),
                                // Update image if it's different
                                ...(user.image && user.image !== existingUser.image && { image: user.image }),
                                // Update name if it's different
                                ...(user.name && user.name !== existingUser.name && { name: user.name }),
                            }
                        }
                    );
                }

                return true;
            } catch (error) {
                console.error("Error during sign in:", error);
                return false;
            }
        },

        async redirect({ url, baseUrl }) {
            // Handle redirects properly for production
            console.log('Redirect callback:', { url, baseUrl });

            // If the URL is relative, make it absolute with the correct base URL
            if (url.startsWith('/')) {
                return `${baseUrl}${url}`;
            }

            // If the URL is on the same domain, allow it
            if (url.startsWith(baseUrl)) {
                return url;
            }

            // Default to dashboard
            return `${baseUrl}/dashboard`;
        },

        async session({ session, token }) {
            return session;
        },
    },

    pages: {
        signIn: '/login',
        error: '/login',
    },

    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },

    // Add debug logging for production issues
    debug: process.env.NODE_ENV === 'development',
};