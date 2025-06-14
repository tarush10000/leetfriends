import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import PartyPage from "@/components/PartyPage";

interface Props {
    params: Promise<{
        code: string;
    }>;
}

export default async function PartyRoute({ params }: Props) {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    // Await params in Next.js 15+
    const { code } = await params;

    return <PartyPage code={code} />;
}