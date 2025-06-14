"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Users } from "lucide-react";
import { useRouter } from "next/navigation";

interface PartyPreview {
    name: string;
    code: string;
    memberCount: number;
}

export default function Dashboard() {
    const [parties, setParties] = useState<PartyPreview[]>([]);
    const router = useRouter();

    useEffect(() => {
        fetch("/api/user/parties")
            .then((res) => res.json())
            .then((data) => setParties(data || []));
    }, []);

    return (
        <div className="p-6 max-w-4xl mx-auto text-white">
            <h1 className="text-3xl font-bold mb-4">Welcome to LeetFriends</h1>

            <div className="flex gap-4 mb-6">
                <Button onClick={() => router.push("/setup")}> <Plus className="mr-2 h-4 w-4" /> Create / Join Party </Button>
            </div>

            <h2 className="text-xl font-semibold mb-2">Your Parties</h2>
            <div className="grid sm:grid-cols-2 gap-4">
                {parties.map((party, i) => (
                    <Card key={i} className="bg-zinc-800 border-zinc-700 cursor-pointer" onClick={() => router.push(`/party/${party.code}`)}>
                        <CardContent className="p-4">
                            <h3 className="text-lg font-medium">{party.name}</h3>
                            <p className="text-sm text-zinc-400">Code: {party.code}</p>
                            <p className="text-xs text-zinc-500 flex items-center mt-2">
                                <Users className="w-4 h-4 mr-1" /> {party.memberCount} members
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
