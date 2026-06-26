import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';

export function DashboardLayout() {
    return (
        <div className="min-h-screen bg-background relative">
            {/* Main Content */}
            <main className="pt-6 pb-32 px-4 min-h-screen">
                <div className="mx-auto max-w-6xl xl:max-w-7xl 2xl:max-w-[90vw]">
                    <Outlet />
                </div>
            </main>

            {/* Floating Bottom Navigation */}
            <BottomNav />
        </div>
    );
}
