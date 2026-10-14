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

    // Primary bottom bar tabs (Timetable and Attendance removed from navigation)
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

            {/* Slide-up "More" Drawer */}
            {isDrawerOpen && (
                <div 
                    className="fixed bottom-28 sm:bottom-32 left-1/2 -translate-x-1/2 z-50 w-[92vw] max-w-sm bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl text-foreground rounded-3xl p-5 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 border border-white/60 dark:border-white/15 animate-in slide-in-from-bottom-6 fade-in duration-200"
                    role="dialog"
                    aria-label="More Navigation Options"
                >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-white/10 mb-3">
                        <div>
                            <h3 className="font-bold text-base tracking-tight text-slate-900 dark:text-white">More Tools</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Additional academic navigation</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsDrawerOpen(false)}
                            className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center text-slate-600 dark:text-white/80 transition-all"
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
                                            ? "bg-primary/15 text-primary dark:bg-primary/25 dark:text-white border border-primary/25 shadow-sm" 
                                            : "hover:bg-slate-100/70 dark:hover:bg-white/10 text-slate-900 dark:text-white"
                                    )}
                                >
                                    <div className={cn(
                                        "h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all",
                                        isCurrent 
                                            ? "bg-primary text-primary-foreground" 
                                            : "bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white"
                                    )}>
                                        <link.icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">{link.label}</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{link.desc}</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Quick Theme Toggle in Drawer Footer */}
                    <div className="mt-4 pt-3.5 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Appearance</span>
                        <button
                            type="button"
                            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100/90 hover:bg-slate-200/90 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white text-xs font-semibold border border-slate-200 dark:border-white/10 transition-all shadow-sm"
                        >
                            {theme === 'dark' ? (
                                <>
                                    <Sun className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
                                    <span>Light Mode</span>
                                </>
                            ) : (
                                <>
                                    <Moon className="h-3.5 w-3.5 text-sky-500" />
                                    <span>Dark Mode</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Main Floating Bottom Navigation Bar */}
            <div 
                className={cn(
                    "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-auto max-w-[95vw] bottom-nav transition-all duration-300 ease-in-out",
                    isVisible 
                        ? "translate-y-0 opacity-100 pointer-events-auto" 
                        : "translate-y-28 opacity-0 pointer-events-none"
                )}
            >
                <nav className="glass rounded-full px-2 py-2 sm:px-4 sm:py-3 flex items-center gap-0.5 sm:gap-1 shadow-xxl ring-1 ring-white/20">
                    {/* Primary Navigation Links */}
                    {primaryLinks.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            className={({ isActive }) =>
                                cn(
                                    "flex flex-col items-center justify-center p-1 sm:p-2 rounded-xl transition-all duration-300 min-w-[52px] sm:min-w-[64px]",
                                    isActive
                                        ? "bg-primary/20 text-primary scale-105"
                                        : "text-muted-foreground hover:text-primary hover:bg-white/5"
                                )
                            }
                        >
                            <link.icon className="h-4 w-4 sm:h-4 sm:w-5 mb-1" />
                            <span className="text-[10px] font-medium">{link.label}</span>
                        </NavLink>
                    ))}

                    {/* "More" Trigger Button */}
                    <button
                        type="button"
                        onClick={() => setIsDrawerOpen(prev => !prev)}
                        className={cn(
                            "flex flex-col items-center justify-center p-1 sm:p-2 rounded-xl transition-all duration-300 min-w-[52px] sm:min-w-[64px] relative",
                            isDrawerOpen || isMoreActive
                                ? "bg-primary/20 text-primary scale-105"
                                : "text-muted-foreground hover:text-primary hover:bg-white/5"
                        )}
                        aria-label="More tools and navigation"
                    >
                        <MoreHorizontal className="h-4 w-4 sm:h-4 sm:w-5 mb-1" />
                        <span className="text-[10px] font-medium">More</span>
                        {/* Dot indicator if active route is inside More drawer */}
                        {isMoreActive && !isDrawerOpen && (
                            <span className="absolute top-1 right-2 h-1.5 w-1.5 rounded-full bg-primary ring-2 ring-background" />
                        )}
                    </button>
                </nav>
            </div>
        </>
    );
}
