"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    Plus,
    Lock,
    Eye,
    EyeOff,
    UserCheck,
    ArrowLeft,
    Settings,
    AlertCircle,
    CheckCircle
} from "lucide-react";

export default function SetupForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [mode, setMode] = useState<"create" | "join">(
        searchParams.get("mode") === "join" ? "join" : "create"
    );
    const [handle, setHandle] = useState("");
    const [leetcodeUsername, setLeetcodeUsername] = useState("");
    const [partyName, setPartyName] = useState("");
    const [partyCode, setPartyCode] = useState("");
    const [password, setPassword] = useState("");
    const [maxMembers, setMaxMembers] = useState<number>(10);
    const [enableMemberLimit, setEnableMemberLimit] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isValidatingCode, setIsValidatingCode] = useState(false);
    const [codeValidation, setCodeValidation] = useState<{
        isValid: boolean;
        partyInfo?: { name: string; memberCount: number; maxMembers?: number; hasPassword: boolean };
        error?: string;
    } | null>(null);

    // Validate party code in real-time for join mode
    useEffect(() => {
        if (mode === "join" && partyCode.length >= 4) {
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
    }, [partyCode, mode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const endpoint = mode === "create" ? "/api/party/create" : "/api/party/join";
        const payload =
            mode === "create"
                ? {
                    handle,
                    leetcodeUsername,
                    partyName,
                    password: password || null,
                    maxMembers: enableMemberLimit ? maxMembers : null
                }
                : { handle, leetcodeUsername, code: partyCode, password };

        try {
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Unknown error");

            toast.success(
                mode === "create"
                    ? `Party "${partyName}" created successfully! Code: ${data.partyCode}`
                    : `Successfully joined the party!`
            );
            router.push("/dashboard");
        } catch (err: unknown) {
            if (err instanceof Error) toast.error(err.message);
            else toast.error("Something went wrong");
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
                        {mode === "create" ? "Create New Party" : "Join Existing Party"}
                    </h1>
                    <p className="text-slate-400">
                        {mode === "create"
                            ? "Set up a new LeetCode competition party for you and your friends"
                            : "Join an existing party with the party code"
                        }
                    </p>
                </div>

                {/* Mode Toggle */}
                <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm mb-6">
                    <CardContent className="p-6">
                        <div className="flex rounded-lg bg-slate-900/50 p-1">
                            <Button
                                type="button"
                                variant={mode === "create" ? "default" : "ghost"}
                                onClick={() => setMode("create")}
                                className={`flex-1 ${mode === "create"
                                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                                        : "text-slate-400 hover:text-white"
                                    }`}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Create Party
                            </Button>
                            <Button
                                type="button"
                                variant={mode === "join" ? "default" : "ghost"}
                                onClick={() => setMode("join")}
                                className={`flex-1 ${mode === "join"
                                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                                        : "text-slate-400 hover:text-white"
                                    }`}
                            >
                                <UserCheck className="w-4 h-4 mr-2" />
                                Join Party
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Main Form */}
                <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center">
                            {mode === "create" ? (
                                <>
                                    <Settings className="w-5 h-5 mr-2" />
                                    Party Configuration
                                </>
                            ) : (
                                <>
                                    <Users className="w-5 h-5 mr-2" />
                                    Join Party
                                </>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 pt-0">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Personal Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-white">Personal Information</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="handle" className="text-slate-300">
                                            Display Handle *
                                        </Label>
                                        <Input
                                            id="handle"
                                            value={handle}
                                            onChange={(e) => setHandle(e.target.value)}
                                            placeholder="Your display name"
                                            className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="leetcode" className="text-slate-300">
                                            LeetCode Username *
                                        </Label>
                                        <Input
                                            id="leetcode"
                                            value={leetcodeUsername}
                                            onChange={(e) => setLeetcodeUsername(e.target.value)}
                                            placeholder="Your LeetCode username"
                                            className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Party Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-white">
                                    {mode === "create" ? "Party Configuration" : "Party Details"}
                                </h3>

                                <AnimatePresence mode="wait">
                                    {mode === "create" ? (
                                        <motion.div
                                            key="create"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            className="space-y-4"
                                        >
                                            <div>
                                                <Label htmlFor="partyName" className="text-slate-300">
                                                    Party Name *
                                                </Label>
                                                <Input
                                                    id="partyName"
                                                    value={partyName}
                                                    onChange={(e) => setPartyName(e.target.value)}
                                                    placeholder="Give your party a cool name"
                                                    className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                                                    required
                                                />
                                            </div>

                                            {/* Member Limit Setting */}
                                            <div className="space-y-3">
                                                <div className="flex items-center space-x-3">
                                                    <input
                                                        type="checkbox"
                                                        id="enableLimit"
                                                        checked={enableMemberLimit}
                                                        onChange={(e) => setEnableMemberLimit(e.target.checked)}
                                                        className="w-4 h-4 text-purple-600 bg-slate-900 border-slate-600 rounded focus:ring-purple-500"
                                                    />
                                                    <Label htmlFor="enableLimit" className="text-slate-300">
                                                        Set member limit
                                                    </Label>
                                                </div>

                                                <AnimatePresence>
                                                    {enableMemberLimit && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: "auto" }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            className="ml-7"
                                                        >
                                                            <div className="flex items-center space-x-3">
                                                                <Input
                                                                    type="number"
                                                                    value={maxMembers}
                                                                    onChange={(e) => setMaxMembers(Math.max(2, parseInt(e.target.value) || 2))}
                                                                    min="2"
                                                                    max="100"
                                                                    className="w-24 bg-slate-900/50 border-slate-600 text-white"
                                                                />
                                                                <span className="text-slate-400 text-sm">
                                                                    maximum members (2-100)
                                                                </span>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="join"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-4"
                                        >
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
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Password Field */}
                                <div>
                                    <Label htmlFor="password" className="text-slate-300 flex items-center">
                                        <Lock className="w-4 h-4 mr-2" />
                                        Party Password {mode === "create" && "(optional)"}
                                        {mode === "join" && codeValidation?.partyInfo?.hasPassword && (
                                            <span className="text-red-400 ml-1">*</span>
                                        )}
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder={mode === "create" ? "Optional password for your party" : "Enter party password"}
                                            className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 pr-10"
                                            required={mode === "join" && codeValidation?.partyInfo?.hasPassword}
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
                                    {mode === "create" && (
                                        <p className="text-xs text-slate-500 mt-1">
                                            Leave empty to create a public party, or set a password for privacy
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="pt-4">
                                <Button
                                    type="submit"
                                    disabled={loading || (mode === "join" && partyCode.length >= 4 && !codeValidation?.isValid)}
                                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white h-12 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <div className="flex items-center">
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                            {mode === "create" ? "Creating Party..." : "Joining Party..."}
                                        </div>
                                    ) : (
                                        <div className="flex items-center">
                                            {mode === "create" ? (
                                                <>
                                                    <Plus className="w-5 h-5 mr-2" />
                                                    Create Party
                                                </>
                                            ) : (
                                                <>
                                                    <UserCheck className="w-5 h-5 mr-2" />
                                                    Join Party
                                                </>
                                            )}
                                        </div>
                                    )}
                                </Button>
                            </div>

                            {/* Help Text */}
                            <div className="text-center pt-4 border-t border-slate-700">
                                <p className="text-slate-400 text-sm">
                                    {mode === "create" ? (
                                        "Once created, share the party code with your friends to invite them!"
                                    ) : (
                                        "Don't have a party code? Ask your friend who created the party for it."
                                    )}
                                </p>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}