export function AuthBackground() {
    return (
        <div className="absolute inset-0 -z-10 overflow-hidden bg-slate-50">
            {/* Ambient background glows - static for speed optimization (no CPU layout repaints) */}
            <div className="absolute -top-[10%] -left-[10%] w-[80vw] h-[80vw] rounded-full bg-sky-100/70 blur-[100px] pointer-events-none"></div>
            <div className="absolute top-[20%] -right-[20%] w-[70vw] h-[70vw] rounded-full bg-blue-100/60 blur-[100px] pointer-events-none"></div>
            <div className="absolute -bottom-[10%] left-[10%] w-[90vw] h-[90vw] rounded-full bg-teal-50/80 blur-[120px] pointer-events-none"></div>

            {/* Subtle decorative dot grid pattern with low opacity for light mode */}
            <div 
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, #0284c7 1px, transparent 0)',
                    backgroundSize: '24px 24px'
                }}
            ></div>
            
            {/* Elegant pastel decorative paths for light mode depth */}
            <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="curveGradLight" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.3" />
                        <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#0D9488" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path d="M-100 150 C 200 350, 100 550, 800 350" stroke="url(#curveGradLight)" strokeWidth="1.5" fill="none" />
                <path d="M-50 250 C 300 450, 200 650, 900 450" stroke="url(#curveGradLight)" strokeWidth="0.75" fill="none" />
            </svg>
        </div>
    );
}
