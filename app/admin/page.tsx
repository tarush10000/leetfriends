// app/admin/page.tsx - Admin dashboard for coupon management
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import AdminCouponManager from "@/components/AdminCouponManager";

const ADMIN_EMAILS = [
    'tarushagarwal2003@gmail.com',
    '07hardiksingla@gmail.com'
];

function isAdmin(email: string): boolean {
    return ADMIN_EMAILS.includes(email);
}

export default async function AdminPage() {
    const session = await getServerSession(authOptions);
    
    if (!session) {
        redirect("/login");
    }

    if (!session.user?.email || !isAdmin(session.user.email)) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
                    <p className="text-slate-400">You don't have permission to access this page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
                    <p className="text-slate-400">Manage coupon codes and view usage statistics</p>
                </div>
                
                <AdminCouponManager />
            </div>
        </div>
    );
}