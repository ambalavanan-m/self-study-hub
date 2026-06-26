import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { AuthBackground } from './AuthBackground';
import { ArrowRight, Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { Alert } from '../ui/Alert';

export function MobileSignup() {
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
        <div className="relative h-screen max-h-screen w-full overflow-hidden flex items-center justify-center px-6 font-sans bg-slate-50 text-slate-800">
            <AuthBackground />

            <div className="relative z-10 w-full max-w-md flex flex-col">
                {/* Logo & Branding */}
                <div className="flex flex-col items-center mb-4">
                    <div className="h-12 w-12 flex items-center justify-center overflow-hidden rounded-2xl bg-white border border-slate-200/60 p-2.5 shadow-md mb-2">
                        <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-800 tracking-wide text-center">
                        Ambalavanan
                    </h1>
                    <p className="text-slate-500 text-[10px] font-semibold tracking-wider uppercase mt-0.5">
                        Self Study Hub
                    </p>
                </div>

                {/* Form Card - Frosted Light Glassmorphism */}
                <div className="w-full bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white/60 p-5 sm:p-6 shadow-xl shadow-sky-900/5">
                    <div className="mb-4">
                        <h2 className="text-xl font-bold text-slate-800">Sign Up</h2>
                        <p className="text-slate-500 text-[11px] mt-0.5">Create an account to track your sessions</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3">
                        {/* Name Field */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase">Full Name</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <User size={18} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Enter your name"
                                    className="w-full bg-white border border-slate-200/80 rounded-2xl py-3 pl-11 pr-4 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-colors text-sm shadow-sm"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        {/* Email Field */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase">Email</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="w-full bg-white border border-slate-200/80 rounded-2xl py-3 pl-11 pr-4 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-colors text-sm shadow-sm"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase">Password</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Create a password"
                                    className="w-full bg-white border border-slate-200/80 rounded-2xl py-3 pl-11 pr-12 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-colors text-sm shadow-sm"
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

                        {/* Confirm Password Field */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase">Confirm Password</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    placeholder="Confirm your password"
                                    className="w-full bg-white border border-slate-200/80 rounded-2xl py-3 pl-11 pr-4 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-colors text-sm shadow-sm"
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
                                    Creating Account...
                                </span>
                            ) : (
                                <>
                                    Register <ArrowRight size={16} className="ml-1" />
                                </>
                            )}
                        </button>

                        {/* Switch Page Link */}
                        <div className="text-center text-xs text-slate-400 pt-2">
                            Already have an account?{' '}
                            <Link to="/login" className="text-sky-600 font-bold hover:text-sky-700 transition-colors">
                                Sign In
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
