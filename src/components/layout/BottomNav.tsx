import { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    GraduationCap,
    Calendar,
    User,
    LogOut,
    Menu,
    X
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

export function BottomNav() {
    const { signOut } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const location = useLocation();

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Close menu on route change
    useEffect(() => {
        setIsOpen(false);
    }, [location]);

    const primaryLinks = [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/cgpa', icon: GraduationCap, label: 'CGPA' },
        { to: '/timetable', icon: Calendar, label: 'Timetable' },
    ];

    const secondaryLinks = [
        { to: '/profile', icon: User, label: 'Profile' },
    ];

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-auto max-w-[95vw]" ref={menuRef}>
            {/* Popup Menu */}
            <div className={cn(
                "absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-64 glass rounded-2xl p-2 transition-all duration-300 origin-bottom",
                isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4 pointer-events-none"
            )}>
                <div className="grid grid-cols-2 gap-2">
                    {secondaryLinks.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            className={({ isActive }) =>
                                cn(
                                    "flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200",
                                    isActive
                                        ? "bg-primary/20 text-primary"
                                        : "text-muted-foreground hover:bg-white/5 hover:text-primary"
                                )
                            }
                        >
                            <link.icon className="h-6 w-6 mb-1" />
                            <span className="text-xs font-medium">{link.label}</span>
                        </NavLink>
                    ))}



                    <button
                        onClick={() => signOut()}
                        className="col-span-2 flex items-center justify-center gap-2 p-3 rounded-xl text-muted-foreground transition-all duration-200 hover:bg-destructive/10 hover:text-destructive mt-2 border-t border-white/10"
                    >
                        <LogOut className="h-5 w-5" />
                        <span className="text-sm font-medium">Sign Out</span>
                    </button>
                </div>
            </div>

            {/* Main Navigation Bar */}
            <nav className="glass rounded-full px-4 py-3 flex items-center gap-1 shadow-xl ring-1 ring-white/20">
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
                        <link.icon className="h-5 w-5 mb-1" />
                        <span className="text-[10px] font-medium">{link.label}</span>
                    </NavLink>
                ))}

                <div className="w-px h-8 bg-border mx-1" />

                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 min-w-[64px]",
                        isOpen
                            ? "bg-primary/20 text-primary scale-110"
                            : "text-muted-foreground hover:text-primary hover:bg-white/5"
                    )}
                >
                    {isOpen ? (
                        <X className="h-5 w-5 mb-1" />
                    ) : (
                        <Menu className="h-5 w-5 mb-1" />
                    )}
                    <span className="text-[10px] font-medium">More</span>
                </button>
            </nav>
        </div>
    );
}
