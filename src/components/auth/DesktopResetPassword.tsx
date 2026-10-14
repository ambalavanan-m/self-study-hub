import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { AuthBackground } from './AuthBackground';
import { Mail, ArrowRight, Clock, CheckCircle2, TrendingUp, Sparkles } from 'lucide-react';
import { Alert } from '../ui/Alert';

export function DesktopResetPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            await sendPasswordResetEmail(auth, email);
            setSuccess(true);
        } catch (err: any) {
            let message = 'Failed to send password reset email. Please try again.';
            if (err.code === 'auth/user-not-found') {
                message = 'No account found with this email address.';
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
                
                {/* Left Panel */}
                <div className="w-[55%] bg-gradient-to-br from-card/80 to-primary/10 p-10 flex flex-col justify-between border-r border-border/50 relative overflow-hidden">
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
                                Account Recovery
                            </span>
                            <h2 className="text-3xl font-extrabold text-foreground tracking-tight leading-tight pt-1">
                                Get back on track in just a few clicks.
                            </h2>
                        </div>

                        {/* Interactive Widget 1 */}
                        <div className="glass-card rounded-2xl p-5 shadow-sm space-y-3">
                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Security & Recovery</h4>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                                    <div className="flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full bg-primary"></span>
                                        <span className="font-semibold text-foreground text-xs">Direct Email Dispatch</span>
                                    </div>
                                    <span className="text-[9px] text-muted-foreground font-semibold">Immediate</span>
                                </div>
                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
                                    <div className="flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full bg-violet-500"></span>
                                        <span className="font-semibold text-foreground text-xs">Encrypted Auth Link</span>
                                    </div>
                                    <span className="text-[9px] text-muted-foreground font-semibold">One-Time Token</span>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Widget 2 */}
                        <div className="glass-card rounded-2xl p-5 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-xl text-primary">
                                        <Clock size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Fast Recovery</p>
                                        <h4 className="text-base font-extrabold text-foreground">Under 60 Seconds</h4>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-emerald-500 text-xs font-bold flex items-center gap-1">
                                        <TrendingUp size={12} /> Secure
                                    </span>
                                </div>
                            </div>

                            {/* SVG Sparkline Graph */}
                            <div className="h-16 w-full relative overflow-hidden rounded-xl bg-primary/5 border border-primary/10">
                                <svg className="w-full h-full text-primary" viewBox="0 0 100 30" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="chartGlowVioletReset" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.4" />
                                            <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                    <path d="M 0 25 Q 15 12, 30 20 T 60 8 T 90 2 L 100 2 L 100 30 L 0 30 Z" fill="url(#chartGlowVioletReset)" />
                                    <path d="M 0 25 Q 15 12, 30 20 T 60 8 T 90 2 L 100 2" stroke="#7C3AED" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                                    <circle cx="90" cy="2" r="1.5" fill="#7C3AED" />
                                </svg>
                            </div>
                        </div>

                        {/* Feature Summary */}
                        <div className="flex justify-between px-1 text-[11px] text-muted-foreground font-semibold">
                            <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-primary" /> Automatic Scheduler</span>
                            <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-primary" /> Grade Tracker</span>
                            <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-primary" /> PDF Exporter</span>
                        </div>
                    </div>

                    <div className="text-[10px] text-muted-foreground font-semibold tracking-wide relative z-10">
                        © {new Date().getFullYear()} StudyTrack. Deep Indigo & Electric Violet Suite.
                    </div>
                </div>

                {/* Right Panel: Reset Password Form */}
                <div className="w-[45%] bg-card/90 p-12 flex flex-col justify-center relative">
                    <div className="w-full max-w-sm mx-auto z-10">
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-foreground">Reset Password</h2>
                            <p className="text-muted-foreground text-sm mt-1.5">Enter your email to receive a password reset link.</p>
                        </div>

                        {success ? (
                            <div className="space-y-6 text-center">
                                <Alert variant="success" message="Check your email for the password reset link. We have sent recovery details to your inbox." />
                                <Link to="/login" className="w-full rounded-2xl bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-700 py-3.5 text-primary-foreground font-semibold shadow-lg shadow-primary/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                                    Back to Login <ArrowRight size={16} />
                                </Link>
                            </div>
                        ) : (
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
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
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
                                            Sending Link...
                                        </span>
                                    ) : (
                                        <>
                                            Send Reset Link <ArrowRight size={16} className="ml-1" />
                                        </>
                                    )}
                                </button>

                                {/* Footer links */}
                                <div className="text-center text-xs text-muted-foreground pt-4">
                                    Remembered your password?{' '}
                                    <Link to="/login" className="text-primary font-bold hover:text-primary/80 transition-colors">
                                        Sign In
                                    </Link>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
