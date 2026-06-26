import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'error' | 'success' | 'info' | 'warning';
    title?: string;
    message: string;
}

export function Alert({ variant = 'error', title, message, className, ...props }: AlertProps) {
    const variants = {
        error: {
            bg: 'bg-red-50/80 border-red-200/60 text-red-800 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-300',
            icon: <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
        },
        success: {
            bg: 'bg-emerald-50/80 border-emerald-200/60 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-300',
            icon: <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
        },
        info: {
            bg: 'bg-sky-50/80 border-sky-200/60 text-sky-800 dark:bg-sky-950/20 dark:border-sky-900/30 dark:text-sky-300',
            icon: <Info className="h-5 w-5 text-sky-500 shrink-0 mt-0.5" />
        },
        warning: {
            bg: 'bg-amber-50/80 border-amber-200/60 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-300',
            icon: <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        }
    };

    const current = variants[variant] || variants.error;

    return (
        <div 
            className={cn(
                "flex items-start gap-3 border rounded-2xl p-3.5 text-xs shadow-sm backdrop-blur-md text-left transition-colors",
                current.bg,
                className
            )}
            {...props}
        >
            {current.icon}
            <div className="flex-1">
                {title && <h5 className="font-bold leading-none mb-1 text-sm">{title}</h5>}
                <p className="leading-relaxed font-semibold">{message}</p>
            </div>
        </div>
    );
}
