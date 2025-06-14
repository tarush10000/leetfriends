"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function SetupForm() {
    const router = useRouter();
    const [mode, setMode] = useState<"create" | "join">("create");
    const [handle, setHandle] = useState("");
    const [leetcodeUsername, setLeetcodeUsername] = useState("");
    const [partyName, setPartyName] = useState("");
    const [partyCode, setPartyCode] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const endpoint = mode === "create" ? "/api/party/create" : "/api/party/join";
        const payload =
            mode === "create"
                ? { handle, leetcodeUsername, partyName, password }
                : { handle, leetcodeUsername, code: partyCode, password };

        try {
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Unknown error");

            toast.success("Success!");
            router.push("/");
        } catch (err: unknown) {
            if (err instanceof Error) toast.error(err.message);
            else toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto mt-10">
            <div className="flex justify-center gap-4 mb-2">
                <Button type="button" variant={mode === "create" ? "default" : "secondary"} onClick={() => setMode("create")}>
                    Create Party
                </Button>
                <Button type="button" variant={mode === "join" ? "default" : "secondary"} onClick={() => setMode("join")}>
                    Join Party
                </Button>
            </div>

            <div>
                <Label htmlFor="handle">Your Handle</Label>
                <Input id="handle" value={handle} onChange={(e) => setHandle(e.target.value)} required />
            </div>

            <div>
                <Label htmlFor="leetcode">LeetCode Username</Label>
                <Input id="leetcode" value={leetcodeUsername} onChange={(e) => setLeetcodeUsername(e.target.value)} required />
            </div>

            {mode === "create" ? (
                <div>
                    <Label htmlFor="partyName">Party Name</Label>
                    <Input id="partyName" value={partyName} onChange={(e) => setPartyName(e.target.value)} required />
                </div>
            ) : (
                <div>
                    <Label htmlFor="partyCode">Party Code</Label>
                    <Input id="partyCode" value={partyCode} onChange={(e) => setPartyCode(e.target.value)} required />
                </div>
            )}

            <div>
                <Label htmlFor="password">Party Password (optional)</Label>
                <Input id="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Submitting..." : mode === "create" ? "Create Party" : "Join Party"}
            </Button>
        </form>
    );
}
