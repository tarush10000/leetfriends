// components/SyncSolvedProblemsButton.tsx
"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, CheckCircle, AlertCircle, Zap } from "lucide-react";
import { useState } from "react";

interface SyncSolvedProblemsButtonProps {
    leetcodeUsername?: string;
    onSyncComplete?: (markedCount: number) => void;
    className?: string;
}

export default function SyncSolvedProblemsButton({ 
    leetcodeUsername, 
    onSyncComplete,
    className = "" 
}: SyncSolvedProblemsButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [showBulkOption, setShowBulkOption] = useState(false);
    const { toast } = useToast();

    const handleSync = async (bulkMarkAll = false) => {
        if (!leetcodeUsername) {
            toast({
                title: "LeetCode username required",
                description: "Please set your LeetCode username in your profile first.",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);
        setShowBulkOption(false);

        try {
            const response = await fetch('/api/interview-prep/mark-solved-completed', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    leetcodeUsername: leetcodeUsername,
                    bulkMarkAll: bulkMarkAll
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Success case
                const details = data.details;
                let detailsText = "";
                
                if (bulkMarkAll) {
                    detailsText = `Marked all ${data.markedCount} interview questions as completed.`;
                } else if (details) {
                    detailsText = `• ${data.markedCount} newly marked\n• ${details.previouslyCompleted || 0} already completed`;
                    if (details.couldNotAccess > 0) {
                        detailsText += `\n• ${details.couldNotAccess} solved problems not accessible via API`;
                    }
                } else {
                    detailsText = `Found ${data.totalSolved || data.foundSpecific} solved problems.`;
                }

                toast({
                    title: bulkMarkAll ? "Bulk sync completed! 🎉" : "Sync completed successfully! 🎉",
                    description: `${data.message}\n${detailsText}`,
                    variant: "default",
                });

                // Call the callback if provided
                if (onSyncComplete) {
                    onSyncComplete(data.markedCount);
                }
            } else if (!data.success && data.canBulkMark) {
                // Show bulk mark option
                setShowBulkOption(true);
                toast({
                    title: "Limited sync results",
                    description: data.bulkMarkMessage || data.message,
                    variant: "default",
                });
            } else if (response.status === 422 && data.fallbackMode) {
                // LeetCode API unavailable - show helpful message
                toast({
                    title: "Unable to auto-sync from LeetCode",
                    description: "LeetCode's API is currently unavailable. You can manually mark problems as completed or try again later.",
                    variant: "destructive",
                });
            } else {
                // Other errors
                throw new Error(data.error || data.message || 'Sync failed');
            }

        } catch (error) {
            console.error('Sync error:', error);
            
            const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
            const isNetworkError = errorMessage.includes('fetch') || errorMessage.includes('network');
            
            toast({
                title: "Sync failed",
                description: isNetworkError ? 
                    "Network error. Please check your connection and try again." : 
                    `${errorMessage}. You can manually mark problems as completed.`,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleBulkMark = () => {
        handleSync(true);
    };

    return (
        <div className="flex items-center gap-2">
            <Button
                onClick={() => handleSync(false)}
                disabled={isLoading || !leetcodeUsername}
                className={`bg-green-600 hover:bg-green-700 text-white ${className}`}
                size="sm"
            >
                {isLoading ? (
                    <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Syncing...
                    </>
                ) : (
                    <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Sync Solved Problems
                    </>
                )}
            </Button>

            {showBulkOption && (
                <Button
                    onClick={handleBulkMark}
                    disabled={isLoading || !leetcodeUsername}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                    size="sm"
                >
                    <Zap className="w-4 h-4 mr-2" />
                    Mark All as Completed
                </Button>
            )}
        </div>
    );
}