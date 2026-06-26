import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { AuthBackground } from './AuthBackground';
import { Mail, ArrowRight, Clock, CheckCircle2, TrendingUp } from 'lucide-react';
import { Alert } from '../ui/Alert';

export function DesktopResetPassword() {
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
        <div className="h-screen max-h-screen w-full flex items-center justify-center bg-slate-50 p-6 md:p-12 relative overflow-hidden font-sans text-slate-800">
            <AuthBackground />

            {/* Split Glassmorphic Card Container */}
            <div className="w-full max-w-5xl h-[80vh] max-h-[640px] min-h-[560px] bg-white/30 backdrop-blur-xl rounded-[2.5rem] overflow-hidden flex shadow-2xl border border-white/60 relative">
                
                {/* Left Panel: Mock Academic Analytics & Schedule Dashboard */}
                <div className="w-[55%] bg-gradient-to-br from-white/70 to-sky-100/40 p-10 flex flex-col justify-between border-r border-slate-200/50 relative overflow-hidden">
                    <div className="absolute -top-[10%] -left-[10%] w-60 h-60 rounded-full bg-sky-200/40 blur-3xl pointer-events-none"></div>

                    {/* Logo & Header */}
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="h-12 w-12 flex items-center justify-center overflow-hidden rounded-2xl bg-white shadow-md p-2 border border-slate-100">
                            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-slate-800 text-lg leading-tight">Ambalavanan</h3>
                            <p className="text-[10px] font-bold text-sky-600 tracking-wider uppercase mt-0.5">Self Study Hub</p>
                        </div>
                    </div>

                    {/* Mock Study Analytics Panel */}
                    <div className="my-auto space-y-5 relative z-10 max-w-md w-full">
                        <div className="space-y-1">
                            <span className="bg-sky-100 text-sky-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                Account Recovery
                            </span>
                            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight leading-tight pt-1">
                                Get back on track in just a few clicks.
                            </h2>
                        </div>

                        {/* Interactive Widget 1: Schedule Slots Grid */}
                        <div className="bg-white/80 border border-slate-100/50 rounded-2xl p-5 shadow-sm space-y-3">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today's Timetable</h4>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-sky-50/50 border border-sky-100/40">
                                    <div className="flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full bg-sky-500"></span>
                                        <span className="font-semibold text-slate-700 text-xs">Advanced Chemistry</span>
                                    </div>
                                    <span className="text-[9px] text-slate-400 font-semibold">09:00 - 10:30 AM</span>
                                </div>
                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-teal-50/50 border border-teal-100/40">
                                    <div className="flex items-center gap-2">
                                        <span className="h-2.5 w-2.5 rounded-full bg-teal-500 relative flex items-center justify-center">
                                            <span className="absolute animate-ping inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500"></span>
                                        </span>
                                        <span className="font-semibold text-slate-700 text-xs">Self Study Session</span>
                                    </div>
                                    <span className="text-[9px] text-slate-400 font-semibold">02:00 - 04:30 PM</span>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Widget 2: Custom SVG Area Sparkline & Progress */}
                        <div className="bg-white/80 border border-slate-100/50 rounded-2xl p-5 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-sky-50 rounded-xl text-sky-600">
                                        <Clock size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Study Duration</p>
                                        <h4 className="text-base font-extrabold text-slate-800">32.5 Hours This Week</h4>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-emerald-500 text-xs font-bold flex items-center gap-1">
                                        <TrendingUp size={12} /> +24%
                                    </span>
                                </div>
                            </div>

                            {/* SVG Sparkline Graph */}
                            <div className="h-16 w-full relative overflow-hidden rounded-xl bg-sky-50/20 border border-sky-100/20">
                                <svg className="w-full h-full text-sky-500" viewBox="0 0 100 30" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                                            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                    <path d="M 0 25 Q 15 12, 30 20 T 60 8 T 90 2 L 100 2 L 100 30 L 0 30 Z" fill="url(#chartGlow)" />
                                    <path d="M 0 25 Q 15 12, 30 20 T 60 8 T 90 2 L 100 2" stroke="#0ea5e9" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                                </svg>
                            </div>
                        </div>

                        {/* Feature Summary */}
                        <div className="flex justify-between px-1 text-[11px] text-slate-500 font-semibold">
                            <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-sky-500" /> Automatic Scheduler</span>
                            <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-sky-500" /> Grade Tracker</span>
                        </div>
                    </div>

                    <div className="text-[10px] text-slate-400 font-semibold tracking-wide relative z-10">
                        © {new Date().getFullYear()} StudyTrack. All rights reserved.
                    </div>
                </div>

                {/* Right Panel: Reset Password Form */}
                <div className="w-[45%] bg-white p-12 flex flex-col justify-center relative">
                    <div className="absolute -bottom-[10%] -right-[10%] w-48 h-48 rounded-full bg-blue-50 blur-3xl pointer-events-none"></div>

                    <div className="w-full max-w-sm mx-auto z-10">
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-slate-800">Reset Password</h2>
                            <p className="text-slate-400 text-sm mt-1.5">Enter your email to receive a password reset link.</p>
                        </div>

                        {success ? (
                            <div className="space-y-6 text-center">
                                <Alert variant="success" message="Check your email for the password reset link. We have sent recovery details to your inbox." />
                                <Link to="/login" className="w-full rounded-2xl bg-gradient-to-r from-sky-400 to-blue-500 py-3.5 text-white font-semibold shadow-lg shadow-sky-400/20 hover:from-sky-500 hover:to-blue-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                                    Back to Login <ArrowRight size={16} />
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Email */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold tracking-wider text-slate-400 uppercase">Email Address</label>
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

                                {/* Error Alert */}
                                {error && <Alert variant="error" message={error} />}

                                {/* Submit Button */}
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
                                            Sending Link...
                                        </span>
                                    ) : (
                                        <>
                                            Send Reset Link <ArrowRight size={16} className="ml-1" />
                                        </>
                                    )}
                                </button>

                                {/* Footer links */}
                                <div className="text-center text-xs text-slate-400 pt-4">
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
        </div>
    );
}
