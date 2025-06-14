import { Suspense } from 'react';
import SetupContent from './SetupContent';

export default function SetupPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading setup...</p>
                </div>
            </div>
        }>
            <SetupContent />
        </Suspense>
    );
}