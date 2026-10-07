import React, { useState } from 'react';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { auth, db } from '../../lib/firebase';
import {
    updateEmail,
    verifyBeforeUpdateEmail,
    reauthenticateWithCredential,
    EmailAuthProvider
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Mail, AlertCircle, CheckCircle2, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

interface ChangeEmailModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentEmail: string;
    onSuccess: (newEmail: string) => void;
}

export function ChangeEmailModal({
    isOpen,
    onClose,
    currentEmail,
    onSuccess,
}: ChangeEmailModalProps) {
    const { showNotification } = useNotification();
    const [newEmail, setNewEmail] = useState('');
    const [confirmEmail, setConfirmEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleReset = () => {
        setNewEmail('');
        setConfirmEmail('');
        setCurrentPassword('');
        setShowPassword(false);
        setError(null);
    };

    const handleClose = () => {
        handleReset();
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const trimmedNewEmail = newEmail.trim().toLowerCase();
        const trimmedConfirmEmail = confirmEmail.trim().toLowerCase();

        // Basic validation
        if (!trimmedNewEmail) {
            setError('Please enter a new email address.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedNewEmail)) {
            setError('Please enter a valid email address format.');
            return;
        }

        if (trimmedNewEmail === currentEmail.trim().toLowerCase()) {
            setError('New email address must be different from your current email.');
            return;
        }

        if (trimmedNewEmail !== trimmedConfirmEmail) {
            setError('The new email addresses do not match.');
            return;
        }

        if (!currentPassword) {
            setError('Please enter your current password to confirm your identity.');
            return;
        }

        const currentUser = auth.currentUser;
        if (!currentUser || !currentUser.email) {
            setError('You must be logged in to update your email.');
            return;
        }

        setLoading(true);

        try {
            // Step 1: Re-authenticate to ensure security compliance
            const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
            await reauthenticateWithCredential(currentUser, credential);

            // Step 2: Attempt email update
            let verificationSent = false;
            try {
                await updateEmail(currentUser, trimmedNewEmail);
            } catch (updateErr: any) {
                // If the Firebase configuration requires verification before updating
                if (
                    updateErr.code === 'auth/operation-not-allowed' ||
                    updateErr.code === 'auth/requires-recent-login' ||
                    updateErr.message?.toLowerCase().includes('verify')
                ) {
                    await verifyBeforeUpdateEmail(currentUser, trimmedNewEmail);
                    verificationSent = true;
                } else {
                    throw updateErr;
                }
            }

            // Step 3: Update Firestore profile doc if available
            try {
                await setDoc(
                    doc(db, 'profiles', currentUser.uid),
                    {
                        email: trimmedNewEmail,
                        user_id: currentUser.uid,
                        updated_at: new Date().toISOString()
                    },
                    { merge: true }
                );
            } catch (fsErr) {
                console.warn('Could not update email in firestore profile:', fsErr);
            }

            if (verificationSent) {
                showNotification(
                    `A verification link has been sent to ${trimmedNewEmail}. Please verify it to complete the update.`,
                    'info'
                );
            } else {
                showNotification(`Email successfully updated to ${trimmedNewEmail}!`, 'success');
                onSuccess(trimmedNewEmail);
            }

            handleClose();
        } catch (err: any) {
            console.error('Error updating email:', err);
            let errMsg = 'Failed to update email. Please try again.';

            if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                errMsg = 'Incorrect current password. Please re-check and try again.';
            } else if (err.code === 'auth/email-already-in-use') {
                errMsg = 'This email address is already in use by another account.';
            } else if (err.code === 'auth/invalid-email') {
                errMsg = 'The email address provided is invalid.';
            } else if (err.code === 'auth/too-many-requests') {
                errMsg = 'Too many attempts. Please wait a moment and try again.';
            } else if (err.message) {
                errMsg = err.message;
            }

            setError(errMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Change Account Email"
            className="max-w-md"
        >
            <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                {/* Information Header */}
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-xs">
                    <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div className="space-y-0.5 text-muted-foreground">
                        <span className="font-semibold text-foreground block">
                            Security Verification
                        </span>
                        <span>
                            To protect your account, enter your new email address along with your current password.
                        </span>
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{error}</span>
                    </div>
                )}

                {/* Current Email Display */}
                <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                        Current Email
                    </label>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/60 border border-border/80 text-sm font-medium text-foreground">
                        <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="truncate">{currentEmail || 'Not configured'}</span>
                    </div>
                </div>

                {/* New Email Input */}
                <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                        New Email Address <span className="text-destructive">*</span>
                    </label>
                    <Input
                        type="email"
                        placeholder="e.g. yourname@gmail.com"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        required
                        autoFocus
                    />
                </div>

                {/* Confirm New Email Input */}
                <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                        Confirm New Email <span className="text-destructive">*</span>
                    </label>
                    <Input
                        type="email"
                        placeholder="Re-enter your new email"
                        value={confirmEmail}
                        onChange={(e) => setConfirmEmail(e.target.value)}
                        required
                    />
                </div>

                {/* Current Password Input */}
                <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                        Current Password <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                        <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter your current password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            className="pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
                            title={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? (
                                <EyeOff className="w-4 h-4" />
                            ) : (
                                <Eye className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                        Required to verify account ownership before updating email.
                    </p>
                </div>

                {/* Modal Footer Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/60">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleClose}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        isLoading={loading}
                        className="gap-2"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        Update Email
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
