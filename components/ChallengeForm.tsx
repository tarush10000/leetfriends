"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";

export default function ChallengeForm({ partyCode }: { partyCode: string }) {
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChallenge = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/challenge/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url, partyCode }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Unknown error");
            toast.success("Challenge sent!");
            setUrl("");
        } catch (err: unknown) {
            if (err instanceof Error) toast.error(err.message);
            else toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-8">
            <h3 className="text-xl font-semibold mb-2">Send a Challenge</h3>
            <div className="flex gap-2">
                <Input
                    placeholder="Paste LeetCode problem link"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="flex-1"
                />
                <Button onClick={handleChallenge} disabled={loading}>
                    {loading ? "Sending..." : "Send"}
                </Button>
            </div>
        </div>
    );
}
