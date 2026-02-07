import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const FormField = ({
    label,
    type = 'text',
    placeholder,
    value,
    onChange,
    error,
    helperText,
    disabled = false,
    required = false,
    leftIcon,
    rightIcon,
    className = '',
    ...props
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
        <div className={`space-y-1.5 ${className}`}>
            {label && (
                <label className="block text-sm font-medium text-gray-300">
                    {label}
                    {required && <span className="text-red-400 ml-1">*</span>}
                </label>
            )}
            
            <div className="relative">
                {leftIcon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {leftIcon}
                    </div>
                )}
                
                <input
                    type={inputType}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    className={`w-full bg-white/5 border rounded-xl px-4 py-2.5 text-white placeholder-gray-500 
                        focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 
                        transition-all duration-200
                        ${leftIcon ? 'pl-10' : ''}
                        ${rightIcon || isPassword ? 'pr-10' : ''}
                        ${error ? 'border-red-500/50' : 'border-white/10'}
                        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    {...props}
                />
                
                {(rightIcon || isPassword) && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {isPassword ? (
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        ) : (
                            rightIcon
                        )}
                    </div>
                )}
            </div>
            
            {(error || helperText) && (
                <p className={`text-sm ${error ? 'text-red-400' : 'text-gray-500'}`}>
                    {error || helperText}
                </p>
            )}
        </div>
    );
};

export default FormField;
