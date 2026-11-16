import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'accent' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    className = '',
    disabled,
    ...props
}) => {
    // Ukuran Tombol
    const sizeStyles = {
        sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
        md: 'h-10 px-4 text-sm gap-2 rounded-xl',
        lg: 'h-12 px-6 text-base gap-2.5 rounded-2xl',
    };

    // Varian Desain Bean & Bite
    const variantStyles = {
        primary:
            'bg-coffee-900 text-white hover:bg-coffee-800 active:bg-coffee-950 border border-coffee-950 shadow-sm shadow-coffee-900/20 focus:ring-2 focus:ring-coffee-700/30',
        secondary:
            'bg-coffee-100 text-coffee-800 hover:bg-coffee-200 active:bg-coffee-300 border border-coffee-200 focus:ring-2 focus:ring-coffee-400/30',
        outline:
            'bg-white text-coffee-900 hover:bg-coffee-50 active:bg-coffee-100 border border-coffee-300 hover:border-coffee-400 focus:ring-2 focus:ring-coffee-400/30',
        accent:
            'bg-crema-600 text-white hover:bg-crema-700 active:bg-crema-800 border border-crema-700 shadow-sm shadow-crema-600/20 focus:ring-2 focus:ring-crema-400/40',
        danger:
            'bg-berry-600 text-white hover:bg-berry-700 active:bg-berry-800 border border-berry-700 shadow-sm shadow-berry-600/20 focus:ring-2 focus:ring-berry-400/30',
        ghost:
            'bg-transparent text-coffee-700 hover:bg-coffee-100/60 active:bg-coffee-200/60 border border-transparent focus:ring-2 focus:ring-coffee-300/30',
    };

    return (
        <button
            disabled={disabled || isLoading}
            className={`inline-flex flex-row flex-nowrap items-center justify-center font-semibold select-none transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed outline-none active:scale-[0.98] whitespace-nowrap ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
            {...props}
        >
            {isLoading ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                    <span className="whitespace-nowrap">Memproses...</span>
                </>
            ) : (
                <>
                    {leftIcon && <span className="flex-shrink-0 inline-flex items-center">{leftIcon}</span>}
                    <span className="whitespace-nowrap inline-flex items-center gap-1.5">{children}</span>
                    {rightIcon && <span className="flex-shrink-0 inline-flex items-center">{rightIcon}</span>}
                </>
            )}
        </button>
    );
};

export default Button;
