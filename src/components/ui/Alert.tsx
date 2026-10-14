import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'error' | 'success' | 'info' | 'warning';
    title?: string;
    message: string;
    onClose?: () => void;
}

export function Alert({ variant = 'error', title, message, onClose, className, ...props }: AlertProps) {
    const config = {
        error: {
            container: 'bg-red-50/90 dark:bg-red-950/40 border-red-200 dark:border-red-900/50 text-red-900 dark:text-red-200 shadow-sm shadow-red-500/5',
            iconBox: 'bg-red-500/15 text-red-600 dark:text-red-400',
            icon: AlertCircle,
            closeHover: 'hover:bg-red-500/10 text-red-600 dark:text-red-400'
        },
        success: {
            container: 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-200 shadow-sm shadow-emerald-500/5',
            iconBox: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
            icon: CheckCircle2,
            closeHover: 'hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
        },
        info: {
            container: 'bg-primary/10 dark:bg-primary/20 border-primary/25 dark:border-primary/40 text-foreground dark:text-violet-200 shadow-sm shadow-primary/5',
            iconBox: 'bg-primary/20 text-primary dark:text-violet-300',
            icon: Info,
            closeHover: 'hover:bg-primary/15 text-primary dark:text-violet-300'
        },
        warning: {
            container: 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200 shadow-sm shadow-amber-500/5',
            iconBox: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
            icon: AlertTriangle,
            closeHover: 'hover:bg-amber-500/10 text-amber-600 dark:text-amber-400'
        }
    };

    const current = config[variant] || config.error;
    const IconComponent = current.icon;

    return (
        <div 
            className={cn(
                "flex items-start gap-3 border rounded-2xl p-3.5 text-xs backdrop-blur-md text-left transition-all duration-200 animate-in fade-in slide-in-from-top-1",
                current.container,
                className
            )}
            role="alert"
            {...props}
        >
            <div className={cn("h-7 w-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5", current.iconBox)}>
                <IconComponent className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
                {title && <h5 className="font-bold leading-none mb-1 text-sm">{title}</h5>}
                <p className="leading-relaxed font-semibold break-words">{message}</p>
            </div>
            {onClose && (
                <button
                    type="button"
                    onClick={onClose}
                    className={cn(
                        "h-6 w-6 rounded-lg flex items-center justify-center transition-colors shrink-0 -mr-1 -mt-0.5 cursor-pointer",
                        current.closeHover
                    )}
                    aria-label="Dismiss alert"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            )}
        </div>
    );
}
