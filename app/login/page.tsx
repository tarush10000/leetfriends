"use client";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

export default function LoginPage() {
    return (
        <div className="flex flex-col items-center justify-center h-screen space-y-6">
            <h1 className="text-3xl font-bold">LeetFriends</h1>
            <Button onClick={() => signIn("google", { callbackUrl: "/setup" })}>
                <LogIn className="mr-2 h-4 w-4" /> Login with Google
            </Button>
        </div>
    );
}