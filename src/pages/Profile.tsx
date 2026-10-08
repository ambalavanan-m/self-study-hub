import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile, updatePassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { User, Lock, Download, Upload, FileJson, FileText, LogOut, Sliders, Sparkles, Mail } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';
import { SEO } from '../components/SEO';
import { CustomPDFModal } from '../components/profile/CustomPDFModal';
import { CustomMarksPDFModal } from '../components/marks/CustomMarksPDFModal';
import { ChangeEmailModal } from '../components/profile/ChangeEmailModal';

export function Profile() {
    const { user, signOut } = useAuth();
    const [loading, setLoading] = useState(false);
    const [isCustomPDFModalOpen, setIsCustomPDFModalOpen] = useState(false);
    const [isCustomMarksPDFModalOpen, setIsCustomMarksPDFModalOpen] = useState(false);
    const [isChangeEmailModalOpen, setIsChangeEmailModalOpen] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [formData, setFormData] = useState({
        name: user?.displayName || '',
        email: user?.email || '',
        password: '',
        confirmPassword: '',
        avatarUrl: user?.photoURL || '',
    });

    // Refs for file inputs
    const cgpaInputRef = useRef<HTMLInputElement>(null);
    const timetableInputRef = useRef<HTMLInputElement>(null);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const currentUser = auth.currentUser;
            if (currentUser) {
                await updateProfile(currentUser, {
                    displayName: formData.name,
                    photoURL: formData.avatarUrl || null
                });
                if (formData.password) {
                    if (formData.password !== formData.confirmPassword) {
                        throw new Error('Passwords do not match');
                    }
                    await updatePassword(currentUser, formData.password);
                }
            }
            setMessage({ type: 'success', text: 'Profile updated successfully' });
            setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (type: 'cgpa' | 'timetable', format: 'json' | 'pdf') => {
        if (!user) return;
        try {
            const { exportCGPA, exportTimetable } = await import('../lib/export');
            if (type === 'cgpa') await exportCGPA({ format, userId: user.uid });
            if (type === 'timetable') await exportTimetable({ format, userId: user.uid });
            setMessage({ type: 'success', text: `${type.toUpperCase()} exported successfully` });
        } catch (error: any) {
            console.error(error);
            setMessage({ type: 'error', text: 'Export failed: ' + error.message });
        }
    };

    const handleImport = async (type: 'cgpa' | 'timetable', e: React.ChangeEvent<HTMLInputElement>) => {
        if (!user || !e.target.files?.[0]) return;
        const file = e.target.files[0];

        try {
            const { importCGPA, importTimetable } = await import('../lib/import');
            if (type === 'cgpa') await importCGPA({ file, userId: user.uid });
            if (type === 'timetable') await importTimetable({ file, userId: user.uid });
            setMessage({ type: 'success', text: `${type.toUpperCase()} imported successfully` });
        } catch (error: any) {
            console.error(error);
            setMessage({ type: 'error', text: 'Import failed: ' + error.message });
        } finally {
            // Reset input
            if (e.target) e.target.value = '';
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            <SEO 
                title="Profile | StudyTrack" 
                description="Manage your account settings, preferences, and data with StudyTrack. Export your academic progress or import backups."
            />
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Profile & Settings</h1>
                    <p className="text-muted-foreground">
                        Manage your account settings and preferences.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <Button variant="destructive" onClick={() => signOut()}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <Card className="p-6">
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex flex-col items-center justify-center space-y-4 pb-6 border-b">
                            <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-background shadow-lg bg-muted flex items-center justify-center">
                                {formData.avatarUrl ? (
                                    <img src={formData.avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                                ) : (
                                    <User className="h-12 w-12 text-muted-foreground" />
                                )}
                            </div>
                            <div className="w-full">
                                <Input
                                    label="Profile Image Link"
                                    value={formData.avatarUrl}
                                    onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                                    placeholder="Enter image URL (e.g., from Google Drive)"
                                />
                            </div>
                        </div>

                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Personal Information
                        </h2>

                        <Input
                            label="Full Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-sm font-medium leading-none">
                                    Email Address
                                </label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsChangeEmailModalOpen(true)}
                                    className="h-7 px-2.5 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                                >
                                    <Mail className="h-3.5 w-3.5" />
                                    Change Email
                                </Button>
                            </div>
                            <Input
                                value={formData.email}
                                disabled
                                className="bg-muted font-medium cursor-not-allowed"
                            />
                            <p className="text-[11px] text-muted-foreground mt-1.5">
                                Your login email address. Click "Change Email" above to update it.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Lock className="h-5 w-5" />
                            Security
                        </h2>

                        <Input
                            label="New Password"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="Leave blank to keep current password"
                        />

                        <Input
                            label="Confirm New Password"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            placeholder="Confirm new password"
                        />
                    </div>

                    {message && (
                        <div className={`p-3 rounded-md text-sm ${message.type === 'success'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                            {message.text}
                        </div>
                    )}

                    <div className="flex justify-end">
                        <Button type="submit" isLoading={loading}>
                            Save Changes
                        </Button>
                    </div>
                </form>
            </Card>

            <Card className="p-6">
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Download className="h-5 w-5" />
                        Data Management
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Export your data to JSON or PDF, or import data from JSON backups.
                    </p>

                    {/* Master Custom PDF Builder Card */}
                    <div className="space-y-3 p-4 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/30 rounded-2xl">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <h3 className="font-bold text-base flex items-center gap-2 text-foreground">
                                    <Sparkles className="h-4 w-4 text-primary" />
                                    Custom Academic PDF Report
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Generate a personalized PDF with customizable sections: CGPA, Grade Distribution, and Curriculum Baskets.
                                </p>
                            </div>
                        </div>
                        <Button 
                            variant="primary" 
                            size="sm" 
                            className="w-full sm:w-auto gap-2"
                            onClick={() => setIsCustomPDFModalOpen(true)}
                        >
                            <Sliders className="h-4 w-4" /> Customize & Export PDF
                        </Button>
                    </div>

                    {/* CGPA */}
                    <div className="space-y-3 p-4 glass border border-white/20 rounded-2xl">
                        <h3 className="font-medium">CGPA & Grades</h3>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleExport('cgpa', 'json')}>
                                <FileJson className="mr-2 h-4 w-4" /> Export JSON
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleExport('cgpa', 'pdf')}>
                                <FileText className="mr-2 h-4 w-4" /> Quick PDF
                            </Button>
                            <Button variant="secondary" size="sm" onClick={() => cgpaInputRef.current?.click()}>
                                <Upload className="mr-2 h-4 w-4" /> Import JSON
                            </Button>
                            <input
                                type="file"
                                ref={cgpaInputRef}
                                className="hidden"
                                accept=".json"
                                onChange={(e) => handleImport('cgpa', e)}
                            />
                        </div>
                    </div>

                    {/* Timetable */}
                    <div className="space-y-3 p-4 glass border border-white/20 rounded-2xl">
                        <h3 className="font-medium">Timetable</h3>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleExport('timetable', 'json')}>
                                <FileJson className="mr-2 h-4 w-4" /> Export JSON
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleExport('timetable', 'pdf')}>
                                <FileText className="mr-2 h-4 w-4" /> Quick PDF
                            </Button>
                            <Button variant="secondary" size="sm" onClick={() => timetableInputRef.current?.click()}>
                                <Upload className="mr-2 h-4 w-4" /> Import JSON
                            </Button>
                            <input
                                type="file"
                                ref={timetableInputRef}
                                className="hidden"
                                accept=".json"
                                onChange={(e) => handleImport('timetable', e)}
                            />
                        </div>
                    </div>

                    {/* Course Marks & Assessments */}
                    <div className="space-y-3 p-4 glass border border-white/20 rounded-2xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium">Course Marks & Assessments</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Export customizable PDF reports with CAT, Internal, and Lab assessment breakdowns.
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" onClick={() => setIsCustomMarksPDFModalOpen(true)}>
                                <Sliders className="mr-2 h-4 w-4 text-primary" /> Customize & Export PDF
                            </Button>
                        </div>
                    </div>

                </div>
            </Card>
            </div>

            <CustomPDFModal
                isOpen={isCustomPDFModalOpen}
                onClose={() => setIsCustomPDFModalOpen(false)}
            />

            <CustomMarksPDFModal
                isOpen={isCustomMarksPDFModalOpen}
                onClose={() => setIsCustomMarksPDFModalOpen(false)}
            />

            <ChangeEmailModal
                isOpen={isChangeEmailModalOpen}
                onClose={() => setIsChangeEmailModalOpen(false)}
                currentEmail={formData.email}
                onSuccess={(newEmail) => {
                    setFormData(prev => ({ ...prev, email: newEmail }));
                    setMessage({ type: 'success', text: `Email updated successfully to ${newEmail}!` });
                }}
            />
        </div>
    );
}
