import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    disabled = false,
    loading = false,
    leftIcon,
    rightIcon,
    className = '',
    onClick,
    type = 'button',
    ...props
}) => {
    const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
        primary: 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-500 hover:to-blue-500 focus:ring-purple-500 shadow-lg shadow-purple-500/25',
        secondary: 'bg-white/10 text-white border border-white/20 hover:bg-white/20 focus:ring-white/50',
        outline: 'border-2 border-purple-500 text-purple-400 hover:bg-purple-500/10 focus:ring-purple-500',
        ghost: 'text-gray-300 hover:text-white hover:bg-white/10 focus:ring-white/50',
        danger: 'bg-red-600 text-white hover:bg-red-500 focus:ring-red-500 shadow-lg shadow-red-500/25',
        success: 'bg-green-600 text-white hover:bg-green-500 focus:ring-green-500 shadow-lg shadow-green-500/25',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm gap-1.5',
        md: 'px-5 py-2.5 text-sm gap-2',
        lg: 'px-6 py-3 text-base gap-2',
        xl: 'px-8 py-4 text-lg gap-3',
    };

    const iconSizes = {
        sm: 14,
        md: 18,
        lg: 20,
        xl: 24,
    };

    return (
        <motion.button
            whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
            whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
            transition={{ duration: 0.15 }}
            className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
            disabled={disabled || loading}
            onClick={onClick}
            type={type}
            {...props}
        >
            {loading ? (
                <Loader2 size={iconSizes[size]} className="animate-spin" />
            ) : (
                leftIcon && <span className="flex-shrink-0">{leftIcon}</span>
            )}
            <span>{children}</span>
            {!loading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </motion.button>
    );
};

export default Button;
