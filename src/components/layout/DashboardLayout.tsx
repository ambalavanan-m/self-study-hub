import { Outlet } from 'react-router-dom';
import { FloatingHeader } from './FloatingHeader';
import { BottomNav } from './BottomNav';

export function DashboardLayout() {
    return (
        <div className="min-h-screen bg-background relative selection:bg-primary/20 selection:text-primary">
            {/* Top Floating Island Header */}
            <FloatingHeader />

            {/* Main Content Area */}
            <main className="pt-20 sm:pt-24 pb-32 px-3 sm:px-6 min-h-screen">
                <div className="mx-auto max-w-6xl xl:max-w-7xl 2xl:max-w-[85vw] animate-in fade-in duration-300">
                    <Outlet />
                </div>
            </main>

            {/* Bottom Floating Island Dock */}
            <BottomNav />
        </div>
    );
}
