import React from 'react';

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            <div className="hidden lg:flex flex-col justify-between bg-zinc-900 p-8 text-white">
                <div className="flex items-center gap-2 text-lg font-bold">
                    <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain" />
                    <span>StudyTrack</span>
                </div>
                <div className="space-y-4">
                    <blockquote className="space-y-2">
                        <p className="text-lg">
                            &ldquo;The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.&rdquo;
                        </p>
                        <footer className="text-sm text-zinc-400">Brian Herbert</footer>
                    </blockquote>
                </div>
            </div>
            <div className="flex items-center justify-center p-8">
                <div className="mx-auto w-full max-w-sm space-y-6">
                    <div className="flex flex-col space-y-2 text-center">
                        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                        <p className="text-sm text-muted-foreground">{subtitle}</p>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
