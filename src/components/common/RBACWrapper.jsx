import React from 'react';
import { Navigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

const RBACWrapper = ({ children, requiredRole, userRole }) => {
    // Mock user role logic if not provided (assume 'guest' if null)
    const currentRole = userRole || 'guest';

    if (currentRole === 'admin') {
        // Admin has access to everything
        return children;
    }

    if (currentRole !== requiredRole) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-black text-white">
                <AlertTriangle size={64} className="text-red-500 mb-4" />
                <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
                <p className="text-gray-400">You do not have permission to view this sector.</p>
                <button
                    onClick={() => window.location.href = '/'}
                    className="mt-8 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                >
                    Return to Safety
                </button>
            </div>
        );
    }

    return children;
};

export default RBACWrapper;
