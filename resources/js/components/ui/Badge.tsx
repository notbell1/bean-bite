import React from 'react';

export type BadgeVariant =
    | 'coffee'
    | 'crema'
    | 'matcha'
    | 'berry'
    | 'neutral'
    | 'outline';

export interface BadgeProps {
    children: React.ReactNode;
    variant?: BadgeVariant;
    size?: 'sm' | 'md';
    icon?: React.ReactNode;
    className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
    children,
    variant = 'coffee',
    size = 'md',
    icon,
    className = '',
}) => {
    const sizeStyles = {
        sm: 'text-[11px] px-2 py-0.5 gap-1',
        md: 'text-xs px-2.5 py-1 gap-1.5',
    };

    const variantStyles = {
        coffee:
            'bg-coffee-100 text-coffee-800 border border-coffee-200/80 font-semibold',
        crema:
            'bg-crema-100 text-crema-800 border border-crema-200 font-semibold',
        matcha:
            'bg-matcha-100 text-matcha-700 border border-matcha-200 font-semibold',
        berry:
            'bg-berry-100 text-berry-700 border border-berry-200 font-semibold',
        neutral:
            'bg-coffee-50 text-coffee-600 border border-coffee-200 font-medium',
        outline:
            'bg-transparent text-coffee-800 border border-coffee-300 font-semibold',
    };

    return (
        <span
            className={`inline-flex items-center rounded-full select-none leading-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        >
            {icon && <span className="flex-shrink-0">{icon}</span>}
            <span>{children}</span>
        </span>
    );
};

export default Badge;
