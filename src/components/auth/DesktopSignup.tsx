import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { AuthBackground } from './AuthBackground';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Clock, CheckCircle2, TrendingUp, User } from 'lucide-react';
import { Alert } from '../ui/Alert';

export function DesktopSignup() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords don't match");
            setLoading(false);
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            await updateProfile(user, { displayName: formData.name });

            try {
                await setDoc(doc(db, 'profiles', user.uid), {
                    user_id: user.uid,
                    name: formData.name,
                });
            } catch (profileError) {
                console.error('Error creating profile:', profileError);
            }

            navigate('/dashboard');
        } catch (err: any) {
            let message = 'Failed to create account. Please try again.';
            if (err.code === 'auth/email-already-in-use') {
                message = 'This email is already registered.';
            } else if (err.code === 'auth/weak-password') {
                message = 'Password should be at least 6 characters.';
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
                
                {/* Left Panel: Unique Mock Academic Analytics & Schedule Dashboard (Shared style with DesktopLogin) */}
                <div className="w-[55%] bg-gradient-to-br from-white/70 to-sky-100/40 p-10 flex flex-col justify-between border-r border-slate-200/50 relative overflow-hidden">
                    {/* Glowing decorative shape inside panel */}
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
                                Start Your Journey
                            </span>
                            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight leading-tight pt-1">
                                Create an account to unlock your potential.
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
                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-violet-50/50 border border-violet-100/40">
                                    <div className="flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full bg-violet-500"></span>
                                        <span className="font-semibold text-slate-700 text-xs">Calculus II Lecture</span>
                                    </div>
                                    <span className="text-[9px] text-slate-400 font-semibold">11:00 AM - 12:30 PM</span>
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
                                    <span className="text-[9px] text-slate-400">efficiency</span>
                                </div>
                            </div>

                            {/* SVG Sparkline Graph - Smooth client-side rendering without bundle cost */}
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
                                    <circle cx="90" cy="2" r="1.5" fill="#0ea5e9" />
                                </svg>
                            </div>
                        </div>

                        {/* Feature Summary */}
                        <div className="flex justify-between px-1 text-[11px] text-slate-500 font-semibold">
                            <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-sky-500" /> Automatic Scheduler</span>
                            <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-sky-500" /> Grade Tracker</span>
                            <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-sky-500" /> PDF Exporter</span>
                        </div>
                    </div>

                    {/* Footer branding details */}
                    <div className="text-[10px] text-slate-400 font-semibold tracking-wide relative z-10">
                        © {new Date().getFullYear()} StudyTrack. All rights reserved.
                    </div>
                </div>

                {/* Right Panel: Sign-up Form */}
                <div className="w-[45%] bg-white p-10 flex flex-col justify-center relative overflow-y-auto">
                    {/* Ambient subtle shape on right side */}
                    <div className="absolute -bottom-[10%] -right-[10%] w-48 h-48 rounded-full bg-blue-50 blur-3xl pointer-events-none"></div>

                    <div className="w-full max-w-sm mx-auto z-10">
                        <div className="mb-6">
                            <h2 className="text-3xl font-bold text-slate-800">Sign Up</h2>
                            <p className="text-slate-400 text-sm mt-1">Create an account to get started.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Full Name */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold tracking-wider text-slate-400 uppercase">Full Name</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <User size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Enter your name"
                                        className="w-full bg-white border border-slate-200/80 rounded-2xl py-3.5 pl-11 pr-4 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-colors text-sm shadow-sm"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold tracking-wider text-slate-400 uppercase">Email Address</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <Mail size={18} />
                                    </div>
                                    <input
                                        type="email"
                                        placeholder="Enter your email"
                                        className="w-full bg-white border border-slate-200/80 rounded-2xl py-3.5 pl-11 pr-4 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-colors text-sm shadow-sm"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold tracking-wider text-slate-400 uppercase">Password</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Create a password"
                                        className="w-full bg-white border border-slate-200/80 rounded-2xl py-3.5 pl-11 pr-12 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-colors text-sm shadow-sm"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold tracking-wider text-slate-400 uppercase">Confirm Password</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        type="password"
                                        placeholder="Confirm your password"
                                        className="w-full bg-white border border-slate-200/80 rounded-2xl py-3.5 pl-11 pr-4 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-colors text-sm shadow-sm"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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
                                        Creating account...
                                    </span>
                                ) : (
                                    <>
                                        Register Account <ArrowRight size={16} className="ml-1" />
                                    </>
                                )}
                            </button>

                            {/* Footer links */}
                            <div className="text-center text-xs text-slate-400 pt-3">
                                Already have an account?{' '}
                                <Link to="/login" className="text-sky-600 font-bold hover:text-sky-700 transition-colors">
                                    Sign In
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
