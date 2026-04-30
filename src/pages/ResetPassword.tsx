import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';

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
            setError(err.message);
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
            <AuthLayout
            title="Reset Password"
            subtitle="Enter your email to receive a password reset link"
        >
            {success ? (
                <div className="space-y-4 text-center">
                    <div className="p-4 rounded-md bg-green-50 text-green-900 dark:bg-green-900/20 dark:text-green-100">
                        Check your email for the password reset link.
                    </div>
                    <Link to="/login">
                        <Button variant="outline" className="w-full">
                            Back to Login
                        </Button>
                    </Link>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <Button type="submit" className="w-full" isLoading={loading}>
                        Send Reset Link
                    </Button>
                </form>
            )}
            {!success && (
                <div className="text-center text-sm text-muted-foreground">
                    Remember your password?{' '}
                    <Link to="/login" className="underline underline-offset-4 hover:text-primary">
                        Sign in
                    </Link>
                </div>
            )}
        </AuthLayout>
        </>
    );
}
