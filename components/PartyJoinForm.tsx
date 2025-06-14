"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { 
    ArrowLeft,
    UserCheck,
    Lock,
    Eye,
    EyeOff,
    Users,
    CheckCircle,
    AlertCircle,
    Loader
} from "lucide-react";

interface UserProfile {
    handle: string;
    leetcodeUsername: string;
    displayName: string;
    initialStats: any;
    currentStats: any;
}

interface PartyJoinFormProps {
    userProfile: UserProfile;
}

export default function PartyJoinForm({ userProfile }: PartyJoinFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [isValidatingCode, setIsValidatingCode] = useState(false);
    
    // Form state
    const [partyCode, setPartyCode] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [codeValidation, setCodeValidation] = useState<{
        isValid: boolean;
        partyInfo?: { name: string; memberCount: number; maxMembers?: number; hasPassword: boolean };
        error?: string;
    } | null>(null);

    // Validate party code in real-time
    useEffect(() => {
        if (partyCode.length >= 4) {
            const validateCode = async () => {
                setIsValidatingCode(true);
                try {
                    const res = await fetch(`/api/party/validate?code=${partyCode}`);
                    const data = await res.json();
                    setCodeValidation(data);
                } catch (error) {
                    setCodeValidation({ isValid: false, error: "Failed to validate code" });
                } finally {
                    setIsValidatingCode(false);
                }
            };

            const timeoutId = setTimeout(validateCode, 500);
            return () => clearTimeout(timeoutId);
        } else {
            setCodeValidation(null);
        }
    }, [partyCode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch("/api/party/join", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code: partyCode.toUpperCase(),
                    password: password || null,
                    // User info is already stored in their profile
                }),
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(`Successfully joined "${data.partyName}"!`);
                router.push(`/party/${data.partyCode}`);
            } else {
                toast.error(data.error || "Failed to join party");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 py-8">
            <div className="max-w-2xl mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="text-slate-400 hover:text-white mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Button>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Join Existing Party
                    </h1>
                    <p className="text-slate-400">
                        Join an existing party with the party code
                    </p>
                </div>

                {/* User Info Preview */}
                <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm mb-6">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white font-medium">{userProfile.displayName}</p>
                                <p className="text-slate-400 text-sm">@{userProfile.handle} • LeetCode: {userProfile.leetcodeUsername}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-white font-bold">{userProfile.currentStats?.total || 0}</p>
                                <p className="text-slate-400 text-xs">Problems Solved</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Main Form */}
                <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center">
                            <Users className="w-5 h-5 mr-2" />
                            Join Party
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Party Code */}
                            <div>
                                <Label htmlFor="partyCode" className="text-slate-300">
                                    Party Code *
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="partyCode"
                                        value={partyCode}
                                        onChange={(e) => setPartyCode(e.target.value.toUpperCase())}
                                        placeholder="Enter party code"
                                        className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 pr-10"
                                        required
                                    />
                                    {isValidatingCode && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    )}
                                    {codeValidation && !isValidatingCode && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            {codeValidation.isValid ? (
                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                            ) : (
                                                <AlertCircle className="w-4 h-4 text-red-500" />
                                            )}
                                        </div>
                                    )}
                                </div>
                                
                                {/* Party Info Display */}
                                <AnimatePresence>
                                    {codeValidation?.isValid && codeValidation.partyInfo && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg"
                                        >
                                            <div className="flex items-center text-green-400 text-sm mb-2">
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Party found!
                                            </div>
                                            <div className="text-white font-medium">{codeValidation.partyInfo.name}</div>
                                            <div className="text-slate-400 text-sm">
                                                {codeValidation.partyInfo.memberCount} 
                                                {codeValidation.partyInfo.maxMembers && ` / ${codeValidation.partyInfo.maxMembers}`} members
                                                {codeValidation.partyInfo.hasPassword && (
                                                    <span className="ml-2 text-yellow-400">
                                                        • Password required
                                                    </span>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                    {codeValidation?.error && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
                                        >
                                            <div className="flex items-center text-red-400 text-sm">
                                                <AlertCircle className="w-4 h-4 mr-2" />
                                                {codeValidation.error}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Password Field */}
                            <div>
                                <Label htmlFor="password" className="text-slate-300 flex items-center">
                                    <Lock className="w-4 h-4 mr-2" />
                                    Party Password
                                    {codeValidation?.partyInfo?.hasPassword && (
                                        <span className="text-red-400 ml-1">*</span>
                                    )}
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter party password"
                                        className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 pr-10"
                                        required={codeValidation?.partyInfo?.hasPassword}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-slate-400 hover:text-white"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={loading || (partyCode.length >= 4 && !codeValidation?.isValid)}
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white h-12 text-lg font-medium"
                            >
                                {loading ? (
                                    <div className="flex items-center">
                                        <Loader className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                        Joining Party...
                                    </div>
                                ) : (
                                    <div className="flex items-center">
                                        <UserCheck className="w-5 h-5 mr-2" />
                                        Join Party
                                    </div>
                                )}
                            </Button>

                            {/* Help Text */}
                            <div className="text-center pt-4 border-t border-slate-700">
                                <p className="text-slate-400 text-sm">
                                    Don't have a party code? Ask your friend who created the party for it.
                                </p>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}