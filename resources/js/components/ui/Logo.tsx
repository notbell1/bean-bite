import React from 'react';

interface LogoProps {
    variant?: 'icon' | 'horizontal' | 'badge';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    showTagline?: boolean;
    theme?: 'dark' | 'light';
}

export const MoneraLogoIcon: React.FC<{ size?: number; className?: string }> = ({
    size = 36,
    className = '',
}) => {
    return (
        <img
            src="/images/icon.png"
            alt="Monera Coffee • Bean & Bite"
            width={size}
            height={size}
            className={`object-contain rounded-xl select-none flex-shrink-0 ${className}`}
            style={{ width: `${size}px`, height: `${size}px` }}
        />
    );
};

export const Logo: React.FC<LogoProps> = ({
    variant = 'horizontal',
    size = 'md',
    className = '',
    showTagline = true,
    theme = 'dark',
}) => {
    const sizeMap = {
        sm: { icon: 28, text: 'text-xs', sub: 'text-[9px]' },
        md: { icon: 36, text: 'text-sm', sub: 'text-[10px]' },
        lg: { icon: 44, text: 'text-base', sub: 'text-xs' },
        xl: { icon: 56, text: 'text-xl', sub: 'text-sm' },
    };

    const currentSize = sizeMap[size];

    if (variant === 'icon') {
        return <MoneraLogoIcon size={currentSize.icon} className={className} />;
    }

    const isDark = theme === 'dark';

    return (
        <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
            <MoneraLogoIcon size={currentSize.icon} />
            <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 leading-none">
                    <span
                        className={`font-black tracking-tight ${
                            isDark ? 'text-white' : 'text-coffee-950'
                        } ${currentSize.text}`}
                    >
                        MONERA
                    </span>
                    <span
                        className={`font-bold tracking-wider ${
                            isDark ? 'text-crema-400' : 'text-crema-600'
                        } ${currentSize.text}`}
                    >
                        COFFEE
                    </span>
                </div>
                {showTagline && (
                    <span
                        className={`font-medium tracking-wide truncate mt-0.5 ${
                            isDark ? 'text-coffee-400' : 'text-coffee-500'
                        } ${currentSize.sub}`}
                    >
                        Powered by Bean & Bite
                    </span>
                )}
            </div>
        </div>
    );
};

export default Logo;
