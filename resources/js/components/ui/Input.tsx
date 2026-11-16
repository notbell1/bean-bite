import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    isPassword?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            label,
            error,
            helperText,
            leftIcon,
            rightIcon,
            isPassword = false,
            type = 'text',
            className = '',
            disabled,
            ...props
        },
        ref
    ) => {
        const [showPassword, setShowPassword] = useState(false);

        const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

        return (
            <div className="w-full">
                {label && (
                    <label className="block text-xs font-semibold uppercase tracking-wider text-coffee-800 mb-1.5">
                        {label}
                    </label>
                )}

                <div className="relative flex items-center">
                    {leftIcon && (
                        <div className="absolute left-3.5 text-coffee-400 pointer-events-none flex items-center">
                            {leftIcon}
                        </div>
                    )}

                    <input
                        ref={ref}
                        type={inputType}
                        disabled={disabled}
                        className={`w-full h-11 px-4 text-sm bg-white border rounded-xl text-coffee-950 placeholder-coffee-400 transition-all duration-200 outline-none shadow-xs ${
                            leftIcon ? 'pl-10' : ''
                        } ${rightIcon || isPassword ? 'pr-11' : ''} ${
                            error
                                ? 'border-berry-500 focus:border-berry-600 focus:ring-2 focus:ring-berry-100 bg-berry-50/20'
                                : 'border-coffee-200 focus:border-coffee-700 focus:ring-2 focus:ring-coffee-200/50 hover:border-coffee-300'
                        } ${
                            disabled
                                ? 'bg-coffee-50 text-coffee-400 cursor-not-allowed border-coffee-200'
                                : ''
                        } ${className}`}
                        {...props}
                    />

                    {isPassword ? (
                        <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 text-coffee-400 hover:text-coffee-700 p-1 rounded-md transition focus:outline-none"
                        >
                            {showPassword ? (
                                <EyeOff className="w-4 h-4" />
                            ) : (
                                <Eye className="w-4 h-4" />
                            )}
                        </button>
                    ) : (
                        rightIcon && (
                            <div className="absolute right-3.5 text-coffee-400 pointer-events-none flex items-center">
                                {rightIcon}
                            </div>
                        )
                    )}
                </div>

                {error ? (
                    <p className="text-xs text-berry-600 mt-1 font-medium">{error}</p>
                ) : (
                    helperText && (
                        <p className="text-xs text-coffee-500 mt-1">{helperText}</p>
                    )
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;
