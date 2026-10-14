import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { AuthBackground } from './AuthBackground';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Clock, CheckCircle2, TrendingUp, Sparkles } from 'lucide-react';
import { Alert } from '../ui/Alert';

export function DesktopLogin() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await signInWithEmailAndPassword(auth, formData.email, formData.password);
            navigate('/dashboard');
        } catch (err: any) {
            let message = 'Failed to sign in. Please try again.';
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                message = 'Invalid email or password.';
            } else if (err.code === 'auth/invalid-email') {
                message = 'Please enter a valid email address.';
            }
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen max-h-screen w-full flex items-center justify-center bg-background p-6 md:p-12 relative overflow-hidden font-sans text-foreground">
            <AuthBackground />

            {/* Split Glassmorphic Card Container */}
            <div className="w-full max-w-5xl h-[82vh] max-h-[660px] min-h-[580px] glass-dock rounded-[2.5rem] overflow-hidden flex shadow-2xl relative">
                
                {/* Left Panel: Mock Academic Analytics & Schedule Dashboard */}
                <div className="w-[55%] bg-gradient-to-br from-card/80 to-primary/10 p-10 flex flex-col justify-between border-r border-border/50 relative overflow-hidden">
                    {/* Glowing decorative shape inside panel */}
                    <div className="absolute -top-[10%] -left-[10%] w-64 h-64 rounded-full bg-primary/20 blur-3xl pointer-events-none"></div>

                    {/* Logo & Header */}
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="h-12 w-12 flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-tr from-primary to-violet-500 shadow-md shadow-primary/25 p-2 text-white">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-foreground text-lg leading-tight">StudyTrack</h3>
                            <p className="text-[10px] font-bold text-primary tracking-wider uppercase mt-0.5">Self Study Hub</p>
                        </div>
                    </div>

                    {/* Mock Study Analytics Panel */}
                    <div className="my-auto space-y-5 relative z-10 max-w-md w-full">
                        <div className="space-y-1">
                            <span className="bg-primary/15 text-primary text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-primary/20">
                                Academic Suite
                            </span>
                            <h2 className="text-3xl font-extrabold text-foreground tracking-tight leading-tight pt-1">
                                Your Academic Journey, Elevated.
                            </h2>
                        </div>

                        {/* Interactive Widget 1: Schedule Slots Grid */}
                        <div className="glass-card rounded-2xl p-5 shadow-sm space-y-3">
                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Course Focus & Objectives</h4>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                                    <div className="flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full bg-primary"></span>
                                        <span className="font-semibold text-foreground text-xs">Advanced Algorithms</span>
                                    </div>
                                    <span className="text-[9px] text-muted-foreground font-semibold">09:00 - 10:30 AM</span>
                                </div>
                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
                                    <div className="flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full bg-violet-500"></span>
                                        <span className="font-semibold text-foreground text-xs">Linear Algebra & Stats</span>
                                    </div>
                                    <span className="text-[9px] text-muted-foreground font-semibold">11:00 AM - 12:30 PM</span>
                                </div>
                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                                    <div className="flex items-center gap-2">
                                        <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 relative flex items-center justify-center">
                                            <span className="absolute animate-ping inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
                                        </span>
                                        <span className="font-semibold text-foreground text-xs">Focus Study Session</span>
                                    </div>
                                    <span className="text-[9px] text-muted-foreground font-semibold">02:00 - 04:30 PM</span>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Widget 2: Custom SVG Area Sparkline & Progress */}
                        <div className="glass-card rounded-2xl p-5 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-xl text-primary">
                                        <Clock size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Weekly Study</p>
                                        <h4 className="text-base font-extrabold text-foreground">34.5 Hours Tracked</h4>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-emerald-500 text-xs font-bold flex items-center gap-1">
                                        <TrendingUp size={12} /> +28%
                                    </span>
                                    <span className="text-[9px] text-muted-foreground">efficiency</span>
                                </div>
                            </div>

                            {/* SVG Sparkline Graph */}
                            <div className="h-16 w-full relative overflow-hidden rounded-xl bg-primary/5 border border-primary/10">
                                <svg className="w-full h-full text-primary" viewBox="0 0 100 30" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="chartGlowViolet" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.4" />
                                            <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                    <path d="M 0 25 Q 15 12, 30 20 T 60 8 T 90 2 L 100 2 L 100 30 L 0 30 Z" fill="url(#chartGlowViolet)" />
                                    <path d="M 0 25 Q 15 12, 30 20 T 60 8 T 90 2 L 100 2" stroke="#7C3AED" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                                    <circle cx="90" cy="2" r="1.5" fill="#7C3AED" />
                                </svg>
                            </div>
                        </div>

                        {/* Feature Summary */}
                        <div className="flex justify-between px-1 text-[11px] text-muted-foreground font-semibold">
                            <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-primary" /> Auto GPA Calculator</span>
                            <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-primary" /> Marks Tracking</span>
                            <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-primary" /> Degree Audit</span>
                        </div>
                    </div>

                    {/* Footer branding details */}
                    <div className="text-[10px] text-muted-foreground font-semibold tracking-wide relative z-10">
                        © {new Date().getFullYear()} StudyTrack. Deep Indigo & Electric Violet Suite.
                    </div>
                </div>

                {/* Right Panel: Sign-in Form */}
                <div className="w-[45%] bg-card/90 p-12 flex flex-col justify-center relative">
                    <div className="w-full max-w-sm mx-auto z-10">
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-foreground">Welcome Back</h2>
                            <p className="text-muted-foreground text-sm mt-1.5">Sign in to your academic dashboard.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Email */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Email Address</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                                        <Mail size={18} />
                                    </div>
                                    <input
                                        type="email"
                                        placeholder="Enter your email"
                                        className="w-full bg-background border border-border rounded-2xl py-3.5 pl-11 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-sm shadow-sm"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Password</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter your password"
                                        className="w-full bg-background border border-border rounded-2xl py-3.5 pl-11 pr-12 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-sm shadow-sm"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                <div className="flex justify-end pt-0.5">
                                    <Link to="/reset-password" className="text-xs text-primary hover:text-primary/80 font-semibold transition-colors">
                                        Forgot Password?
                                    </Link>
                                </div>
                            </div>

                            {/* Error Alert */}
                            {error && <Alert variant="error" message={error} />}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-2xl bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-700 py-3.5 text-primary-foreground font-semibold shadow-lg shadow-primary/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none mt-4 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-5 w-5 text-current" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Signing in...
                                    </span>
                                ) : (
                                    <>
                                        Sign In to Academic Hub <ArrowRight size={16} className="ml-1" />
                                    </>
                                )}
                            </button>

                            {/* Footer links */}
                            <div className="text-center text-xs text-muted-foreground pt-4">
                                Don't have an account?{' '}
                                <Link to="/signup" className="text-primary font-bold hover:text-primary/80 transition-colors">
                                    Register Now
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
