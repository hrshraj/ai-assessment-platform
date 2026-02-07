import React from 'react';

const Skeleton = ({ variant = 'text', className = '', count = 1 }) => {
    const baseClasses = 'bg-white/5 animate-pulse rounded';

    const variants = {
        text: 'h-4',
        circular: 'rounded-full',
        rectangular: '',
        avatar: 'rounded-full w-12 h-12',
        card: 'h-32',
        button: 'h-10 rounded-xl',
        title: 'h-8 w-3/4',
        paragraph: 'h-4 w-full',
        input: 'h-12 rounded-lg',
    };

    if (count > 1) {
        return (
            <div className={`space-y-2 ${className}`}>
                {Array.from({ length: count }).map((_, index) => (
                    <div key={index} className={`${baseClasses} ${variants[variant]}`} />
                ))}
            </div>
        );
    }

    return <div className={`${baseClasses} ${variants[variant]} ${className}`} />;
};

Skeleton.Card = ({ className = '' }) => (
    <div className={`bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 ${className}`}>
        <div className="flex items-center gap-4 mb-4">
            <Skeleton variant="avatar" />
            <div className="flex-1 space-y-2">
                <Skeleton variant="title" />
                <Skeleton variant="paragraph" />
            </div>
        </div>
        <div className="space-y-2">
            <Skeleton variant="paragraph" />
            <Skeleton variant="paragraph" className="w-3/4" />
        </div>
    </div>
);

Skeleton.TableRow = ({ columns = 4, className = '' }) => (
    <div className={`flex gap-4 py-4 border-b border-white/5 ${className}`}>
        {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={index} variant="text" className="flex-1" />
        ))}
    </div>
);

Skeleton.Stats = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <Skeleton variant="text" className="w-1/2 mb-2" />
                <Skeleton variant="title" />
            </div>
        ))}
    </div>
);

export default Skeleton;
