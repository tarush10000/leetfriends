"use client";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface PartyMember {
    displayName: string;
    stats: {
        easy: number;
        medium: number;
        hard: number;
        total: number;
    };
    joinedAt: string;
}

export default function PartyDashboard() {
    const [party, setParty] = useState<any>(null);

    useEffect(() => {
        fetch("/api/party").then(res => res.json()).then(setParty);
    }, []);

    if (!party) return <p className="text-center mt-10 text-sm">Loading your party...</p>;

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Party: {party.name}</h2>
            <p className="mb-2 text-sm text-muted-foreground">Code: {party.code} — Members: {party.members.length}</p>
            <div className="grid md:grid-cols-2 gap-4">
                {party.members.map((user: PartyMember, i: number) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                    >
                        <Card className="hover:shadow-lg">
                            <CardContent className="p-4">
                                <h3 className="text-lg font-semibold">{user.displayName}</h3>
                                <p className="text-sm mt-1">
                                    Total: {user.stats.total} (E: {user.stats.easy}, M: {user.stats.medium}, H: {user.stats.hard})
                                </p>
                                <p className="text-xs text-muted-foreground">Joined: {new Date(user.joinedAt).toLocaleDateString()}</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}