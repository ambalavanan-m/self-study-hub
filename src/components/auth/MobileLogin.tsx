import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { AuthBackground } from './AuthBackground';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';

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
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen w-full overflow-hidden font-sans text-zinc-800">
            <AuthBackground />

            <div className="relative z-10 flex min-h-screen flex-col px-8 pt-32">
                {/* Header Section */}
                <div className="mb-12">
                    <h1 className="text-4xl font-bold text-white mb-2">Welcome</h1>
                    <p className="text-white/80 text-sm">
                        to Ambalavanan Self Study
                    </p>
                </div>

                {/* Form Section - Positioned to overlap the white wave */}
                <div className="mt-auto pb-12">
                    <h2 className="text-3xl font-bold mb-8 text-zinc-900">Sign in</h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-600">Email</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    placeholder="demo@email.com"
                                    className="w-full border-b border-zinc-300 py-2 text-zinc-900 placeholder:text-zinc-400 focus:border-[#FF8BA7] focus:outline-none bg-transparent"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-600">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="enter your password"
                                    className="w-full border-b border-zinc-300 py-2 text-zinc-900 placeholder:text-zinc-400 focus:border-[#FF8BA7] focus:outline-none bg-transparent"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-0 top-2 text-zinc-400"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                            <label className="flex items-center gap-2 text-zinc-600">
                                <input type="checkbox" className="rounded border-zinc-300 text-[#FF8BA7] focus:ring-[#FF8BA7]" />
                                Remember Me
                            </label>
                            <Link to="/reset-password" className="text-[#FF8BA7] font-medium">
                                Forgot Password?
                            </Link>
                        </div>

                        {error && <p className="text-sm text-red-500">{error}</p>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-full bg-[#FF8BA7] py-4 text-white font-semibold shadow-lg hover:bg-[#ff7a9a] transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </button>

                        <div className="text-center text-xs text-zinc-500 mt-4">
                            Don't have an Account ?{' '}
                            <Link to="/signup" className="text-[#FF8BA7] font-bold">
                                Sign up
                            </Link>
                        </div>
                    </form>
                </div>
                {/* Floating Action Button for "Continue" - mimicking the design */}
                <div className="absolute top-[45%] right-8 transform -translate-y-1/2">
                    <button onClick={handleSubmit} className="flex items-center gap-2 text-white/90 text-sm font-medium">
                        Continue <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm"><ArrowRight size={16} /></div>
                    </button>
                </div>
            </div>
        </div>
    );
}
