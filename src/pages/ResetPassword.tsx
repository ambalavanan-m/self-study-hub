import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { DesktopResetPassword } from '../components/auth/DesktopResetPassword';
import { AuthBackground } from '../components/auth/AuthBackground';
import { Mail, ArrowRight, Sparkles } from 'lucide-react';
import { Alert } from '../components/ui/Alert';

export function ResetPassword() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [email, setEmail] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            await sendPasswordResetEmail(auth, email, {
                url: `${window.location.origin}/update-password`,
            });
            setSuccess(true);
        } catch (err: any) {
            let message = 'Failed to send reset link. Please try again.';
            if (err.code === 'auth/user-not-found') {
                message = 'No account found with this email.';
            } else if (err.code === 'auth/invalid-email') {
                message = 'Please enter a valid email address.';
            }
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <SEO 
                title="Reset Password | StudyTrack" 
                description="Recover your StudyTrack account password. Enter your email to receive a secure reset link."
            />
            {/* Mobile View - Clean Centered Card */}
            <div className="block md:hidden relative h-screen max-h-screen w-full overflow-hidden flex items-center justify-center px-4 font-sans bg-background text-foreground">
                <AuthBackground />

                <div className="relative z-10 w-full max-w-sm flex flex-col items-center space-y-5">
                    {/* Brand Logo & Name */}
                    <div className="flex flex-col items-center">
                        <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-violet-500 shadow-xl shadow-primary/30 p-2.5 text-white mb-2">
                            <Sparkles className="w-7 h-7" />
                        </div>
                        <h1 className="text-2xl font-black text-foreground tracking-tight text-center">
                            StudyTrack
                        </h1>
                        <p className="text-primary text-[10px] font-bold tracking-wider uppercase mt-0.5">
                            Academic Portal
                        </p>
                    </div>

                    {/* Form Card */}
                    <div className="w-full glass-dock rounded-[2rem] p-6 shadow-2xl border border-white/20">
                        <div className="mb-5">
                            <h2 className="text-2xl font-bold text-foreground">Reset Password</h2>
                            <p className="text-muted-foreground text-xs mt-1">Enter your email to receive a password reset link</p>
                        </div>

                        {success ? (
                            <div className="space-y-5 text-center">
                                <Alert variant="success" message="Check your email for the password reset link." />
                                <Link to="/login" className="w-full rounded-2xl bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-700 py-3.5 text-primary-foreground font-semibold shadow-lg shadow-primary/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                                    Back to Login <ArrowRight size={16} />
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Email Address</label>
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

                                {error && <Alert variant="error" message={error} />}

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
                                            Sending...
                                        </span>
                                    ) : (
                                        <>
                                            Send Link <ArrowRight size={16} className="ml-1" />
                                        </>
                                    )}
                                </button>

                                <div className="text-center text-xs text-muted-foreground pt-3">
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

            {/* Desktop View */}
            <div className="hidden md:block">
                <DesktopResetPassword />
            </div>
        </>
    );
}
