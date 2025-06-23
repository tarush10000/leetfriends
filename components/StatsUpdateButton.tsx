"use client";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface StatsUpdateButtonProps {
    partyCode: string;
    onStatsUpdated?: () => void;
}

export default function StatsUpdateButton({ partyCode, onStatsUpdated }: StatsUpdateButtonProps) {
    const [updating, setUpdating] = useState(false);

    const updateStats = async () => {
        setUpdating(true);
        try {
            const response = await fetch("/api/leetcode/stats", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ partyCode }),
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(data.message);
                onStatsUpdated?.();
            } else {
                toast.error(data.error || "Failed to update stats");
            }
        } catch (error) {
            console.error("Error updating stats:", error);
            toast.error("Failed to update stats");
        } finally {
            setUpdating(false);
        }
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={updateStats}
            disabled={updating}
            className="border-green-600 bg-green-600/10 hover:bg-green-600/20 text-green-400"
        >
            <RefreshCw className={`w-4 h-4 mr-2 ${updating ? 'animate-spin' : ''}`} />
            {updating ? "Updating..." : "Update Stats"}
        </Button>
    );
}