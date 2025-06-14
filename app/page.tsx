import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LogIn, Github, LucideIcon } from "lucide-react";
import { signIn } from "next-auth/react";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-white px-4">
      <div className="flex justify-end p-4 gap-4">
        <Button variant="outline" onClick={() => signIn("google")}> <LogIn className="w-4 h-4 mr-1" /> Google </Button>
        <Button variant="outline" onClick={() => signIn("github")}> <Github className="w-4 h-4 mr-1" /> GitHub </Button>
      </div>
      <div className="flex flex-col items-center justify-center flex-1 text-center">
        <h1 className="text-5xl font-extrabold mb-4 tracking-tight bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
          LeetFriends
        </h1>
        <p className="text-lg text-zinc-400 max-w-xl">
          Maybe LeetCode was the friends we made along the way.
        </p>
      </div>
    </div>
  );
}
