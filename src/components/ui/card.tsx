import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Card({ className, ...props }: CardProps) {
    return (
        <div
            className={cn(
                'rounded-3xl glass text-card-foreground shadow-sm',
                className
            )}
            {...props}
        />
    );
}
