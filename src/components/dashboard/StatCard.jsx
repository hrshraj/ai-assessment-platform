import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const StatCard = ({ 
    title, 
    value, 
    change, 
    changeLabel,
    icon: Icon,
    color = 'purple',
    delay = 0 
}) => {
    const colors = {
        purple: 'from-purple-500/20 to-blue-500/20 border-purple-500/30',
        green: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
        blue: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
        yellow: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30',
        red: 'from-red-500/20 to-pink-500/20 border-red-500/30',
    };

    const iconColors = {
        purple: 'text-purple-400',
        green: 'text-green-400',
        blue: 'text-blue-400',
        yellow: 'text-yellow-400',
        red: 'text-red-400',
    };

    const getTrendIcon = () => {
        if (!change) return <Minus size={16} className="text-gray-400" />;
        const isPositive = change > 0;
        return isPositive 
            ? <TrendingUp size={16} className="text-green-400" />
            : <TrendingDown size={16} className="text-red-400" />;
    };

    const getTrendColor = () => {
        if (!change) return 'text-gray-400';
        return change > 0 ? 'text-green-400' : 'text-red-400';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.3 }}
            className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-6`}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm text-gray-400 mb-1">{title}</p>
                    <p className="text-3xl font-bold text-white">{value}</p>
                    
                    {change !== undefined && (
                        <div className="flex items-center gap-2 mt-2">
                            {getTrendIcon()}
                            <span className={`text-sm font-medium ${getTrendColor()}`}>
                                {change > 0 ? '+' : ''}{change}%
                            </span>
                            {changeLabel && (
                                <span className="text-xs text-gray-500">{changeLabel}</span>
                            )}
                        </div>
                    )}
                </div>
                
                {Icon && (
                    <div className={`p-3 rounded-xl bg-white/5 ${iconColors[color]}`}>
                        <Icon size={24} />
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default StatCard;
