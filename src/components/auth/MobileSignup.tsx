import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { AuthBackground } from './AuthBackground';
import { Eye, EyeOff } from 'lucide-react';

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
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen w-full overflow-hidden font-sans text-zinc-800">
            <AuthBackground />

            <div className="relative z-10 flex min-h-screen flex-col px-8 pt-24">
                {/* Header Section */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Join Us</h1>
                    <p className="text-white/80 text-sm">
                        Create an account to get started
                    </p>
                </div>

                {/* Form Section */}
                <div className="mt-auto pb-8">
                    <h2 className="text-3xl font-bold mb-6 text-zinc-900">Sign up</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-zinc-600">Full Name</label>
                            <input
                                type="text"
                                placeholder="John Doe"
                                className="w-full border-b border-zinc-300 py-2 text-zinc-900 placeholder:text-zinc-400 focus:border-[#FF8BA7] focus:outline-none bg-transparent"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-zinc-600">Email</label>
                            <input
                                type="email"
                                placeholder="name@example.com"
                                className="w-full border-b border-zinc-300 py-2 text-zinc-900 placeholder:text-zinc-400 focus:border-[#FF8BA7] focus:outline-none bg-transparent"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-zinc-600">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="create a password"
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
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-zinc-600">Confirm Password</label>
                            <input
                                type="password"
                                placeholder="confirm your password"
                                className="w-full border-b border-zinc-300 py-2 text-zinc-900 placeholder:text-zinc-400 focus:border-[#FF8BA7] focus:outline-none bg-transparent"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                required
                            />
                        </div>


                        {error && <p className="text-sm text-red-500">{error}</p>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-full bg-[#FF8BA7] py-4 text-white font-semibold shadow-lg hover:bg-[#ff7a9a] transition-colors disabled:opacity-50 mt-4"
                        >
                            {loading ? 'Creating Account...' : 'Sign Up'}
                        </button>

                        <div className="text-center text-xs text-zinc-500 mt-4">
                            Already have an account?{' '}
                            <Link to="/login" className="text-[#FF8BA7] font-bold">
                                Sign in
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
