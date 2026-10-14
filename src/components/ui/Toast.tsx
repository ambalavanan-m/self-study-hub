import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';
import { cn } from '../../lib/utils';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
    id: string;
    message: string;
    type: ToastType;
    onClose: (id: string) => void;
    duration?: number;
}

export function Toast({ id, message, type, onClose, duration = 3500 }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id);
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, id, onClose]);

    const config = {
        success: {
            container: 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 shadow-xl shadow-emerald-950/10',
            iconBox: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
            icon: CheckCircle2,
            closeBtn: 'hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
        },
        error: {
            container: 'bg-red-50 dark:bg-red-950/80 border-red-300 dark:border-red-800 text-red-900 dark:text-red-100 shadow-xl shadow-red-950/10',
            iconBox: 'bg-red-500/20 text-red-600 dark:text-red-400',
            icon: AlertCircle,
            closeBtn: 'hover:bg-red-500/10 text-red-600 dark:text-red-400'
        },
        info: {
            container: 'bg-primary/10 dark:bg-card border-primary/30 dark:border-primary/40 text-foreground dark:text-violet-100 shadow-xl shadow-primary/10',
            iconBox: 'bg-primary/20 text-primary dark:text-violet-300',
            icon: Info,
            closeBtn: 'hover:bg-primary/15 text-primary dark:text-violet-300'
        },
        warning: {
            container: 'bg-amber-50 dark:bg-amber-950/80 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-100 shadow-xl shadow-amber-950/10',
            iconBox: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
            icon: AlertTriangle,
            closeBtn: 'hover:bg-amber-500/10 text-amber-600 dark:text-amber-400'
        },
    };

    const current = config[type] || config.info;
    const IconComponent = current.icon;

    return (
        <div
            className={cn(
                'flex items-center w-full max-w-sm p-3.5 rounded-2xl shadow-xl border backdrop-blur-md animate-in slide-in-from-right-full fade-in duration-300',
                current.container
            )}
            role="alert"
        >
            <div className={cn("h-7 w-7 rounded-xl flex items-center justify-center shrink-0 mr-3", current.iconBox)}>
                <IconComponent className="w-4 h-4" />
            </div>
            <div className="flex-1 text-xs font-semibold leading-relaxed break-words">{message}</div>
            <button
                type="button"
                className={cn("ml-2 p-1 rounded-lg transition-colors inline-flex items-center justify-center h-6 w-6 cursor-pointer", current.closeBtn)}
                onClick={() => onClose(id)}
                aria-label="Close notification"
            >
                <X className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}
