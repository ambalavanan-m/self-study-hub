import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { updatePassword, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';

export function UpdatePassword() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                navigate('/login');
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            setError("Passwords don't match");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const user = auth.currentUser;
            if (!user) throw new Error('Not authenticated');
            await updatePassword(user, password);

            // Password updated successfully
            // Redirect to login or dashboard. 
            // Since they are technically logged in, we could go to dashboard, 
            // but usually it's safer to have them login again with new password 
            // or just stay logged in. Let's go to dashboard.
            navigate('/dashboard'); 
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout 
            title="Update Password" 
            subtitle="Enter your new password below"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="New Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                />
                <Input
                    label="Confirm New Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                />
                
                {error && <p className="text-sm text-destructive">{error}</p>}
                
                <Button type="submit" className="w-full" isLoading={loading}>
                    Update Password
                </Button>
            </form>
        </AuthLayout>
    );
}
