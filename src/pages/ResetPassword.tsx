import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { DesktopResetPassword } from '../components/auth/DesktopResetPassword';
import { AuthBackground } from '../components/auth/AuthBackground';
import { Mail, ArrowRight } from 'lucide-react';
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
            <div className="block md:hidden relative h-screen max-h-screen w-full overflow-hidden flex items-center justify-center px-6 font-sans bg-slate-50 text-slate-800">
                <AuthBackground />

                <div className="relative z-10 w-full max-w-md flex flex-col">
                    {/* Logo & Branding */}
                    <div className="flex flex-col items-center mb-6">
                        <div className="h-14 w-14 flex items-center justify-center overflow-hidden rounded-2xl bg-white border border-slate-200/60 p-2.5 shadow-md mb-3">
                            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-wide text-center">
                            Ambalavanan
                        </h1>
                        <p className="text-slate-500 text-xs font-semibold tracking-wider uppercase mt-0.5">
                            Self Study Hub
                        </p>
                    </div>

                    {/* Form Card */}
                    <div className="w-full bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white/60 p-6 sm:p-8 shadow-xl shadow-sky-900/5">
                        <div className="mb-5">
                            <h2 className="text-2xl font-bold text-slate-800">Reset Password</h2>
                            <p className="text-slate-500 text-xs mt-1">Enter your email to receive a password reset link</p>
                        </div>

                        {success ? (
                            <div className="space-y-5 text-center">
                                <Alert variant="success" message="Check your email for the password reset link." />
                                <Link to="/login" className="w-full rounded-2xl bg-gradient-to-r from-sky-400 to-blue-500 py-3.5 text-white font-semibold shadow-lg shadow-sky-400/20 hover:from-sky-500 hover:to-blue-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                                    Back to Login <ArrowRight size={16} />
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Email Address</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                            <Mail size={18} />
                                        </div>
                                        <input
                                            type="email"
                                            placeholder="Enter your email"
                                            className="w-full bg-white border border-slate-200/80 rounded-2xl py-3.5 pl-11 pr-4 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-colors text-sm shadow-sm"
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
                                    className="w-full rounded-2xl bg-gradient-to-r from-sky-400 to-blue-500 py-3.5 text-white font-semibold shadow-lg shadow-sky-400/20 hover:from-sky-500 hover:to-blue-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none mt-4 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
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

                                <div className="text-center text-xs text-slate-400 pt-3">
                                    Remembered your password?{' '}
                                    <Link to="/login" className="text-sky-600 font-bold hover:text-sky-700 transition-colors">
                                        Sign In
                                    </Link>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            {/* Desktop View - Premium Visual Split Card */}
            <div className="hidden md:block">
                <DesktopResetPassword />
            </div>
        </>
    );
}
