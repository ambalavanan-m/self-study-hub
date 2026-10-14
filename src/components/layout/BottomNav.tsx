import { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    GraduationCap,
    Award,
    User,
    BookOpen,
    FileText,
    MoreHorizontal,
    X,
    Moon,
    Sun
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';

export function BottomNav() {
    const [isVisible, setIsVisible] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const lastScrollY = useRef(0);
    const location = useLocation();
    const navigate = useNavigate();
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            
            // At the top of the page, always show
            if (currentScrollY < 40) {
                setIsVisible(true);
                lastScrollY.current = currentScrollY;
                return;
            }

            // If scrolling down by more than 10px, hide (only if drawer is not open)
            if (!isDrawerOpen) {
                if (currentScrollY > lastScrollY.current + 10) {
                    setIsVisible(false);
                } 
                // If scrolling up by more than 10px, show
                else if (currentScrollY < lastScrollY.current - 10) {
                    setIsVisible(true);
                }
            }

            lastScrollY.current = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isDrawerOpen]);

    // Close drawer on route change
    useEffect(() => {
        setIsDrawerOpen(false);
    }, [location.pathname]);

    // Close drawer on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsDrawerOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Primary dock tabs
    const primaryLinks = [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/cgpa', icon: GraduationCap, label: 'CGPA' },
        { to: '/marks', icon: Award, label: 'Marks' },
        { to: '/profile', icon: User, label: 'Profile' },
    ];

    const moreDrawerLinks = [
        { 
            to: '/curriculum', 
            icon: BookOpen, 
            label: 'Curriculum & Audit', 
            desc: 'Credits required vs completed' 
        },
        { 
            to: '/grades-view', 
            icon: FileText, 
            label: 'Grades Breakdown', 
            desc: 'Course-by-course grade distribution' 
        },
    ];

    const isMoreActive = moreDrawerLinks.some(link => 
        location.pathname === link.to || location.pathname.startsWith(link.to)
    );

    return (
        <>
            {/* Backdrop for More Drawer */}
            {isDrawerOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200"
                    onClick={() => setIsDrawerOpen(false)}
                />
            )}

            {/* Slide-up "More" Drawer - Solid with reduced transparency */}
            {isDrawerOpen && (
                <div 
                    className="fixed bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 z-50 w-[92vw] max-w-sm bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl text-foreground rounded-3xl p-5 shadow-2xl border border-slate-200/80 dark:border-white/10 ring-1 ring-black/5 dark:ring-white/10 animate-in slide-in-from-bottom-6 fade-in duration-200"
                    role="dialog"
                    aria-label="More Navigation Options"
                >
                    <div className="flex items-center justify-between pb-3 border-b border-border/60 mb-3">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                            <div>
                                <h3 className="font-extrabold text-sm tracking-tight text-foreground">Academic Suite</h3>
                                <p className="text-[11px] text-muted-foreground">Additional tools & utilities</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsDrawerOpen(false)}
                            className="h-8 w-8 rounded-full bg-muted/60 hover:bg-muted dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
                            aria-label="Close drawer"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-2 max-h-[50vh] overflow-y-auto pr-1">
                        {moreDrawerLinks.map(link => {
                            const isCurrent = location.pathname === link.to;
                            return (
                                <button
                                    key={link.to}
                                    type="button"
                                    onClick={() => {
                                        setIsDrawerOpen(false);
                                        navigate(link.to);
                                    }}
                                    className={cn(
                                        "w-full flex items-center gap-3.5 p-3 rounded-2xl text-left transition-all",
                                        isCurrent 
                                            ? "bg-primary/15 text-primary border border-primary/30 shadow-sm font-semibold" 
                                            : "hover:bg-muted/60 text-foreground"
                                    )}
                                >
                                    <div className={cn(
                                        "h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all",
                                        isCurrent 
                                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/30" 
                                            : "bg-muted text-muted-foreground"
                                    )}>
                                        <link.icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-bold text-foreground truncate">{link.label}</div>
                                        <div className="text-[11px] text-muted-foreground truncate">{link.desc}</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Quick Theme Toggle in Drawer Footer */}
                    <div className="mt-4 pt-3.5 border-t border-border/60 flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">Appearance</span>
                        <button
                            type="button"
                            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/70 hover:bg-muted text-foreground text-xs font-semibold border border-border/60 transition-all shadow-sm"
                        >
                            {theme === 'dark' ? (
                                <>
                                    <Sun className="h-3.5 w-3.5 text-amber-400" />
                                    <span>Light Mode</span>
                                </>
                            ) : (
                                <>
                                    <Moon className="h-3.5 w-3.5 text-primary" />
                                    <span>Dark Mode</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Main Floating Bottom Island Dock */}
            <div 
                className={cn(
                    "fixed bottom-5 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-auto max-w-[95vw] bottom-nav transition-all duration-300 ease-in-out pointer-events-auto",
                    isVisible 
                        ? "translate-y-0 opacity-100" 
                        : "translate-y-28 opacity-0 pointer-events-none"
                )}
            >
                <nav className="glass-dock rounded-full px-2 py-1.5 sm:px-3 sm:py-2 flex items-center gap-1 sm:gap-2 shadow-2xl">
                    {/* Primary Navigation Links */}
                    {primaryLinks.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            className={({ isActive }) =>
                                cn(
                                    "flex flex-col items-center justify-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-full transition-all duration-300 min-w-[56px] sm:min-w-[68px] relative group",
                                    isActive
                                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/35 scale-105 font-bold"
                                        : "text-muted-foreground hover:text-foreground hover:bg-primary/10"
                                )
                            }
                        >
                            <link.icon className="h-4 w-4 sm:h-5 sm:w-5 mb-0.5 transition-transform group-hover:scale-110" />
                            <span className="text-[10px] tracking-tight">{link.label}</span>
                        </NavLink>
                    ))}

                    {/* "More" Trigger Button */}
                    <button
                        type="button"
                        onClick={() => setIsDrawerOpen(prev => !prev)}
                        className={cn(
                            "flex flex-col items-center justify-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-full transition-all duration-300 min-w-[56px] sm:min-w-[68px] relative group",
                            isDrawerOpen || isMoreActive
                                ? "bg-primary/20 text-primary scale-105 font-bold border border-primary/30"
                                : "text-muted-foreground hover:text-foreground hover:bg-primary/10"
                        )}
                        aria-label="More tools and navigation"
                    >
                        <MoreHorizontal className="h-4 w-4 sm:h-5 sm:w-5 mb-0.5 transition-transform group-hover:scale-110" />
                        <span className="text-[10px] tracking-tight">More</span>
                        {/* Dot indicator if active route is inside More drawer */}
                        {isMoreActive && !isDrawerOpen && (
                            <span className="absolute top-1.5 right-3 h-2 w-2 rounded-full bg-primary ring-2 ring-background animate-pulse" />
                        )}
                    </button>
                </nav>
            </div>
        </>
    );
}
