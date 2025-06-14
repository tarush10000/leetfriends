"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import ChallengeForm from "@/components/ChallengeForm";

export default function PartyPage({ code }: { code: string }) {
    const [party, setParty] = useState<any>(null);

    useEffect(() => {
        fetch(`/api/party/${code}`)
            .then((res) => res.json())
            .then(setParty);
    }, [code]);

    if (!party) return <p className="text-center mt-10 text-sm text-muted-foreground">Loading...</p>;

    return (
        <div className="p-6 max-w-4xl mx-auto text-white">
            <h2 className="text-2xl font-bold mb-4">{party.name} ({party.code})</h2>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
                {party.members.map((user: any, i: number) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <Card className="bg-zinc-800 border-zinc-700">
                            <CardContent className="p-4">
                                <h3 className="text-lg font-semibold">{user.displayName}</h3>
                                <p className="text-sm">Total: {user.stats.total} (E: {user.stats.easy}, M: {user.stats.medium}, H: {user.stats.hard})</p>
                                <p className="text-xs text-zinc-400">Joined: {new Date(user.joinedAt).toLocaleDateString()}</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <ChallengeForm partyCode={party.code} />
        </div>
    );
}
