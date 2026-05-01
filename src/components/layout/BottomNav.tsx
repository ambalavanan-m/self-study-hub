import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    GraduationCap,
    Calendar,
    User
} from 'lucide-react';
import { cn } from '../../lib/utils';

export function BottomNav() {
    const primaryLinks = [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/cgpa', icon: GraduationCap, label: 'CGPA' },
        { to: '/timetable', icon: Calendar, label: 'Timetable' },
        { to: '/profile', icon: User, label: 'Profile' },
    ];

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-auto max-w-[95vw]">
            {/* Main Navigation Bar */}
            <nav className="glass rounded-full px-4 py-3 flex items-center gap-1 shadow-xxl ring-1 ring-white/20">
                {primaryLinks.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        className={({ isActive }) =>
                            cn(
                                "flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 min-w-[64px]",
                                isActive
                                    ? "bg-primary/20 text-primary scale-110"
                                    : "text-muted-foreground hover:text-primary hover:bg-white/5"
                            )
                        }
                    >
                        <link.icon className="h-4 w-5 mb-1" />
                        <span className="text-[10px] font-medium">{link.label}</span>
                    </NavLink>
                ))}
            </nav>
        </div>
    );
}
