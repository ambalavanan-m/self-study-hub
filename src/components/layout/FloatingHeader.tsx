import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
    GraduationCap, 
    Moon, 
    Sun, 
    Sparkles, 
    LogOut, 
    ChevronDown, 
    Award, 
    BookOpen, 
    LayoutDashboard,
    User
} from 'lucide-react';
import { cn } from '../../lib/utils';

export function FloatingHeader() {
    const { user, signOut } = useAuth();
    const { theme, setTheme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Track scroll to add subtle elevation styling
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close user menu on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Determine current section info (Timetable completely removed)
    const getPageDetails = () => {
        const path = location.pathname;
        if (path === '/dashboard') return { title: 'Dashboard', icon: LayoutDashboard };
        if (path.startsWith('/cgpa')) return { title: 'CGPA & Grades', icon: GraduationCap };
        if (path.startsWith('/marks')) return { title: 'Internal Marks', icon: Award };
        if (path.startsWith('/curriculum')) return { title: 'Curriculum Audit', icon: BookOpen };
        if (path.startsWith('/grades-view')) return { title: 'Grade Distribution', icon: GraduationCap };
        if (path.startsWith('/profile')) return { title: 'Account Profile', icon: User };
        return { title: 'Study Hub', icon: Sparkles };
    };

    const pageDetails = getPageDetails();

    const handleSignOut = async () => {
        try {
            await signOut();
            navigate('/login');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <header 
            className={cn(
                "fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 z-40 w-[95vw] max-w-7xl transition-all duration-300 pointer-events-auto",
                isScrolled ? "scale-[0.99] -translate-y-0.5" : ""
            )}
        >
            <div className="glass-dock rounded-full px-3 py-2 sm:px-5 sm:py-2.5 flex items-center justify-between shadow-2xl">
                {/* Left: Brand Identity & Active Page Pill */}
                <div className="flex items-center gap-2.5 sm:gap-3">
                    <Link 
                        to="/dashboard" 
                        className="group flex items-center gap-2.5 py-1 px-1.5 rounded-full hover:bg-primary/10 transition-colors"
                    >
                        <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-gradient-to-tr from-primary to-violet-500 p-0.5 shadow-md shadow-primary/30 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                            <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-extrabold text-xs sm:text-sm tracking-tight bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent leading-none">
                                StudyTrack
                            </span>
                            <span className="text-[9px] font-semibold tracking-wider text-muted-foreground uppercase hidden sm:block mt-0.5">
                                Academic Hub
                            </span>
                        </div>
                    </Link>

                    <div className="h-4 w-[1px] bg-border/70 hidden sm:block" />

                    {/* Active Section Breadcrumb Badge */}
                    <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
                        {pageDetails.icon && <pageDetails.icon className="h-3.5 w-3.5" />}
                        <span>{pageDetails.title}</span>
                    </div>
                </div>

                {/* Center: Subtle Academic Status / Tagline (Desktop) */}
                <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-muted/40 border border-border/40 text-[11px] font-medium text-muted-foreground">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Academic Portal Active</span>
                </div>

                {/* Right: Theme Toggle & User Capsule */}
                <div className="flex items-center gap-2">
                    {/* Theme Toggle Button */}
                    <button
                        type="button"
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-muted/60 hover:bg-muted dark:bg-white/10 dark:hover:bg-white/15 flex items-center justify-center text-foreground transition-all duration-200 border border-border/60 hover:scale-105"
                        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        aria-label="Toggle Theme"
                    >
                        {theme === 'dark' ? (
                            <Sun className="h-4 w-4 text-amber-400" />
                        ) : (
                            <Moon className="h-4 w-4 text-primary" />
                        )}
                    </button>

                    {/* User Profile Pill & Dropdown */}
                    <div className="relative" ref={menuRef}>
                        <button
                            type="button"
                            onClick={() => setIsMenuOpen(prev => !prev)}
                            className="flex items-center gap-2 py-1 pl-1 pr-2 sm:pr-3 rounded-full bg-muted/50 hover:bg-muted dark:bg-white/10 dark:hover:bg-white/15 border border-border/60 transition-all hover:scale-[1.02]"
                            aria-label="User Menu"
                            aria-expanded={isMenuOpen}
                        >
                            <div className="h-7 w-7 rounded-full overflow-hidden bg-primary/20 text-primary flex items-center justify-center font-bold text-xs ring-1 ring-primary/40">
                                {user?.photoURL ? (
                                    <img 
                                        src={user.photoURL} 
                                        alt="Avatar" 
                                        className="h-full w-full object-cover" 
                                    />
                                ) : (
                                    <span>{user?.displayName?.charAt(0) || 'U'}</span>
                                )}
                            </div>
                            <span className="text-xs font-semibold text-foreground max-w-[80px] sm:max-w-[120px] truncate hidden xs:inline-block">
                                {user?.displayName?.split(' ')[0] || 'Student'}
                            </span>
                            <ChevronDown className={cn(
                                "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
                                isMenuOpen ? "rotate-180" : ""
                            )} />
                        </button>

                        {/* Dropdown Menu - Solid with reduced transparency */}
                        {isMenuOpen && (
                            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl p-2 shadow-2xl border border-slate-200/80 dark:border-white/10 text-foreground animate-in fade-in slide-in-from-top-2 duration-150 z-50 ring-1 ring-black/5 dark:ring-white/10">
                                <div className="px-3 py-2 border-b border-border/60 mb-1">
                                    <p className="text-xs font-bold truncate text-foreground">
                                        {user?.displayName || 'Student'}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground truncate">
                                        {user?.email}
                                    </p>
                                </div>

                                <Link
                                    to="/profile"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-primary/15 hover:text-primary transition-colors text-foreground"
                                >
                                    <User className="h-4 w-4 text-primary" />
                                    <span>Profile & Settings</span>
                                </Link>

                                <Link
                                    to="/curriculum"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-primary/15 hover:text-primary transition-colors text-foreground"
                                >
                                    <BookOpen className="h-4 w-4 text-primary" />
                                    <span>Curriculum Audit</span>
                                </Link>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        handleSignOut();
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors mt-1 cursor-pointer"
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
