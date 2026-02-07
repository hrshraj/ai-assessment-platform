import React from 'react';
import { motion } from 'framer-motion';

const Card = ({ 
    children, 
    variant = 'default', 
    hoverable = false,
    padding = 'md',
    className = '',
    onClick,
    ...props 
}) => {
    const baseClasses = 'bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl';
    
    const paddingClasses = {
        none: '',
        sm: 'p-3',
        md: 'p-6',
        lg: 'p-8',
    };

    const variants = {
        default: 'border-white/10',
        elevated: 'border-white/20 shadow-xl',
        success: 'border-green-500/30 bg-green-500/5',
        warning: 'border-yellow-500/30 bg-yellow-500/5',
        error: 'border-red-500/30 bg-red-500/5',
        info: 'border-blue-500/30 bg-blue-500/5',
    };

    const Component = hoverable ? motion.div : 'div';
    const motionProps = hoverable ? {
        whileHover: { scale: 1.02, y: -2 },
        whileTap: { scale: 0.98 },
        transition: { duration: 0.2 },
    } : {};

    return (
        <Component
            className={`${baseClasses} ${paddingClasses[padding]} ${variants[variant]} ${className}`}
            onClick={onClick}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
            {...motionProps}
            {...props}
        >
            {children}
        </Component>
    );
};

Card.Header = ({ children, className = '' }) => (
    <div className={`mb-4 ${className}`}>{children}</div>
);

Card.Title = ({ children, className = '' }) => (
    <h3 className={`text-lg font-semibold text-white ${className}`}>{children}</h3>
);

Card.Subtitle = ({ children, className = '' }) => (
    <p className={`text-sm text-gray-400 ${className}`}>{children}</p>
);

Card.Body = ({ children, className = '' }) => (
    <div className={className}>{children}</div>
);

Card.Footer = ({ children, className = '' }) => (
    <div className={`mt-4 pt-4 border-t border-white/10 ${className}`}>{children}</div>
);

export default Card;
