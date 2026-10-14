export function AuthBackground() {
    return (
        <div className="absolute inset-0 -z-10 overflow-hidden bg-background">
            {/* Ambient background glows for Deep Indigo & Electric Violet aesthetic */}
            <div className="absolute -top-[10%] -left-[10%] w-[75vw] h-[75vw] rounded-full bg-primary/20 dark:bg-primary/25 blur-[120px] pointer-events-none"></div>
            <div className="absolute top-[20%] -right-[20%] w-[70vw] h-[70vw] rounded-full bg-indigo-500/15 dark:bg-indigo-600/20 blur-[130px] pointer-events-none"></div>
            <div className="absolute -bottom-[10%] left-[10%] w-[85vw] h-[85vw] rounded-full bg-violet-600/15 dark:bg-violet-500/20 blur-[140px] pointer-events-none"></div>

            {/* Subtle decorative dot grid pattern */}
            <div 
                className="absolute inset-0 opacity-[0.04] dark:opacity-[0.07] pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, #7c3aed 1px, transparent 0)',
                    backgroundSize: '24px 24px'
                }}
            ></div>
            
            {/* Elegant glowing decorative paths */}
            <svg className="absolute inset-0 w-full h-full opacity-35 dark:opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="curveGradViolet" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.4" />
                        <stop offset="50%" stopColor="#6366F1" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#A855F7" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path d="M-100 150 C 200 350, 100 550, 800 350" stroke="url(#curveGradViolet)" strokeWidth="1.5" fill="none" />
                <path d="M-50 250 C 300 450, 200 650, 900 450" stroke="url(#curveGradViolet)" strokeWidth="0.75" fill="none" />
            </svg>
        </div>
    );
}
