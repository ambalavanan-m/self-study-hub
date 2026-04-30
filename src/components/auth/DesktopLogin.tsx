import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { User, Lock } from 'lucide-react';

export function DesktopLogin() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
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
        <div className="min-h-screen w-full flex items-center justify-center bg-[#1a3c34] p-8 font-sans">
            <div className="w-full max-w-6xl h-[80vh] bg-white rounded-[3rem] overflow-hidden flex shadow-2xl relative">

                {/* Left Side - Illustration */}
                <div className="w-[60%] relative bg-white flex items-center justify-center overflow-hidden">
                    {/* Background Blob/Wave */}
                    <div className="absolute inset-0 bg-[#e6f0ee]">
                        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="absolute top-0 left-0 w-full h-full opacity-50">
                            <path fill="#d1e3e0" d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,81.6,-46.6C91.4,-34.1,98.1,-19.2,95.8,-5.2C93.5,8.8,82.2,21.9,71.6,33.5C61,45.1,51.1,55.2,39.6,63.6C28.1,72,15,78.7,1.4,76.3C-12.2,73.9,-26.3,62.4,-39.2,52.2C-52.1,42,-63.8,33.1,-71.3,21.3C-78.8,9.5,-82.1,-5.2,-78.3,-18.8C-74.5,-32.4,-63.6,-44.9,-51.2,-52.8C-38.8,-60.7,-24.9,-64,-11.2,-62.1C2.5,-60.2,16.2,-53.1,30.5,-83.6L44.7,-76.4Z" transform="translate(100 100) scale(1.1)" />
                        </svg>
                    </div>

                    {/* Christmas Tree Illustration (SVG) */}
                    <div className="relative z-10 w-80 h-80">
                        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            {/* Tree Body */}
                            <path d="M50 15 L20 80 H80 L50 15Z" fill="#2d5a4c" />
                            <path d="M50 25 L25 80 H75 L50 25Z" fill="#366b5b" />
                            {/* Snow/Decorations */}
                            <circle cx="35" cy="70" r="2" fill="#ff7b7b" />
                            <circle cx="65" cy="70" r="2" fill="#ff7b7b" />
                            <circle cx="50" cy="50" r="2" fill="#ff7b7b" />
                            <circle cx="40" cy="60" r="2" fill="#f0e68c" />
                            <circle cx="60" cy="60" r="2" fill="#f0e68c" />
                            <circle cx="45" cy="40" r="2" fill="#f0e68c" />
                            <circle cx="55" cy="40" r="2" fill="#ff7b7b" />
                            {/* Star */}
                            <path d="M50 10 L52 14 L56 14 L53 17 L54 21 L50 19 L46 21 L47 17 L44 14 L48 14 Z" fill="#ffd700" />
                            {/* Trunk */}
                            <rect x="46" y="80" width="8" height="10" fill="#4a3728" />
                            {/* Person/Character (Simplified) */}
                            <circle cx="30" cy="85" r="3" fill="#333" />
                            <path d="M30 88 L25 95 H35 L30 88" fill="#333" />
                        </svg>
                    </div>

                    {/* Logo/Text top left */}
                    <div className="absolute top-8 left-8 flex items-center gap-2">
                        <div className="h-10 w-10 flex items-center justify-center overflow-hidden rounded-lg">
                            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <h3 className="font-bold text-[#2d5a4c] text-sm leading-tight">Ambalavanan<br />Self study</h3>
                        </div>
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="w-[40%] bg-[#2d5a4c] p-12 flex flex-col justify-center text-white relative">
                    {/* Curve Separator */}
                    <div className="absolute top-0 bottom-0 left-0 w-24 overflow-hidden pointer-events-none -translate-x-[99%]">
                        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
                            <path d="M100 0 C 30 20 30 80 100 100 V 0 Z" fill="#2d5a4c" />
                        </svg>
                    </div>

                    <div className="max-w-sm mx-auto w-full z-10">
                        <h2 className="text-4xl font-bold mb-2">Login</h2>
                        <p className="text-white/60 mb-8 text-sm">Sign in to continue</p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/80">Username</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60">
                                        <User size={20} />
                                    </div>
                                    <input
                                        type="email"
                                        placeholder="Enter your username"
                                        className="w-full bg-[#1a3c34]/50 border border-transparent rounded-full py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#5f9ea0] transition-all"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/80">Password</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60">
                                        <Lock size={20} />
                                    </div>
                                    <input
                                        type="password"
                                        placeholder="Enter your password"
                                        className="w-full bg-[#1a3c34]/50 border border-transparent rounded-full py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#5f9ea0] transition-all"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <Link to="/reset-password" className="text-xs text-[#5f9ea0] hover:text-white transition-colors">
                                        Forgot Password?
                                    </Link>
                                </div>
                            </div>

                            {error && <p className="text-sm text-red-300 bg-red-900/20 p-2 rounded">{error}</p>}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-full bg-[#5f9ea0] py-3 text-white font-semibold shadow-lg hover:bg-[#4d8284] transition-colors disabled:opacity-50 mt-4"
                            >
                                {loading ? 'Logging in...' : 'Login to Website'}
                            </button>

                            <div className="text-center text-xs text-white/60 mt-6">
                                Don't have an account?{' '}
                                <Link to="/signup" className="text-[#5f9ea0] hover:text-white underline">
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
