import React from 'react';

// CSS-only 3D simulation for dashboard (no Spline)
const SplineBackground = () => {
    return (
        <div className="fixed inset-0 z-0 opacity-40 pointer-events-none overflow-hidden bg-[#030303]">
            {/* Deep Nebula Effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-purple-900/40 rounded-full blur-[120px] animate-float opacity-60 mix-blend-screen"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-blue-900/40 rounded-full blur-[150px] animate-float opacity-50 mix-blend-screen" style={{ animationDelay: '2s' }}></div>
            <div className="absolute top-[30%] left-[40%] w-[40vw] h-[40vw] bg-cyan-900/30 rounded-full blur-[100px] animate-pulse opacity-30 mix-blend-screen" style={{ animationDelay: '4s' }}></div>

            {/* Starfield / Noise */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-150"></div>

            {/* Subtle Grid Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,black,transparent)]"></div>

            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"></div>
        </div>
    );
};

export default SplineBackground;
