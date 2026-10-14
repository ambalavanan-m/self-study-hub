import React from 'react';
import { Sparkles } from 'lucide-react';
import { AuthBackground } from '../auth/AuthBackground';

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-background text-foreground relative overflow-hidden">
            <AuthBackground />
            <div className="hidden lg:flex flex-col justify-between p-12 glass-dock m-6 rounded-[2.5rem] border border-white/20 relative z-10">
                <div className="flex items-center gap-3 text-lg font-bold">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-primary to-violet-500 shadow-md shadow-primary/30 flex items-center justify-center text-white p-2">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <span className="font-extrabold text-xl tracking-tight">StudyTrack</span>
                </div>
                <div className="space-y-4 max-w-md">
                    <blockquote className="space-y-2">
                        <p className="text-xl font-medium leading-relaxed text-foreground">
                            &ldquo;The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.&rdquo;
                        </p>
                        <footer className="text-sm font-semibold text-primary">— Brian Herbert</footer>
                    </blockquote>
                </div>
                <div className="text-xs text-muted-foreground">
                    Deep Indigo & Electric Violet Academic Suite
                </div>
            </div>
            <div className="flex items-center justify-center p-8 relative z-10">
                <div className="mx-auto w-full max-w-sm space-y-6 glass-card p-8 rounded-3xl border border-white/20 shadow-xl">
                    <div className="flex flex-col space-y-2 text-center">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
                        <p className="text-sm text-muted-foreground">{subtitle}</p>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
