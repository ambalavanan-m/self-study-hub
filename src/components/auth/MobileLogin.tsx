import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { AuthBackground } from './AuthBackground';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';
import { Alert } from '../ui/Alert';

export function MobileLogin() {
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
        <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-background text-foreground">
            <AuthBackground />

            {/* Mobile View Container */}
            <div className="w-full max-w-sm flex flex-col items-center z-10 space-y-6">
                
                {/* Brand Logo & Name */}
                <div className="flex flex-col items-center">
                    <div className="h-16 w-16 flex items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-violet-500 shadow-xl shadow-primary/30 p-3 text-white mb-3">
                        <Sparkles className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-black text-foreground tracking-tight text-center">
                        StudyTrack
                    </h1>
                    <p className="text-primary text-xs font-bold tracking-wider uppercase mt-0.5">
                        Academic Portal
                    </p>
                </div>

                {/* Form Card */}
                <div className="w-full glass-dock rounded-[2rem] p-6 sm:p-8 shadow-2xl border border-white/20">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-foreground">Sign In</h2>
                        <p className="text-muted-foreground text-xs mt-1">Access your academic tracker and dashboard</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email Field */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Email</label>
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

                        {/* Password Field */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Password</label>
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
                        </div>

                        {/* Actions Row */}
                        <div className="flex items-center justify-between text-xs pt-1">
                            <label className="flex items-center gap-2 cursor-pointer select-none text-muted-foreground hover:text-foreground transition-colors">
                                <input 
                                    type="checkbox" 
                                    className="rounded border-border text-primary focus:ring-primary h-4 w-4 transition-colors" 
                                />
                                Remember Me
                            </label>
                            <Link to="/reset-password" className="text-primary hover:text-primary/80 font-semibold transition-colors">
                                Forgot Password?
                            </Link>
                        </div>

                        {/* Error Alert */}
                        {error && <Alert variant="error" message={error} />}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-2xl bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-700 py-3.5 text-primary-foreground font-semibold shadow-lg shadow-primary/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none mt-2 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-current" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Signing In...
                                </span>
                            ) : (
                                <>
                                    Sign In <ArrowRight size={16} className="ml-1" />
                                </>
                            )}
                        </button>

                        {/* Switch Page Link */}
                        <div className="text-center text-xs text-muted-foreground pt-2">
                            Don't have an account?{' '}
                            <Link to="/signup" className="text-primary font-bold hover:text-primary/80 transition-colors">
                                Register Now
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
