
export const THEME = {
    colors: {
        // Base Backgrounds
        background: "bg-navy",
        surface: "bg-light-navy",
        surfaceHighlight: "bg-lightest-navy",
        
        // Text Colors
        textMain: "text-lightest-slate",
        textSecondary: "text-slate",
        textHighlight: "text-bright-cyan",
        textWarning: "text-bright-pink",
        textLink: "text-bright-cyan hover:text-opacity-80",

        // Borders
        borderSubtle: "border-lightest-navy",
        borderHighlight: "border-bright-cyan",
        borderWarning: "border-bright-pink",

        // Interactive Elements
        buttonPrimary: "bg-bright-cyan text-navy hover:bg-opacity-90",
        buttonSecondary: "bg-navy border border-bright-cyan text-bright-cyan hover:bg-bright-cyan/10",
        buttonDanger: "bg-navy border border-bright-pink text-bright-pink hover:bg-bright-pink/10",
        
        // Inputs
        inputBg: "bg-navy",
        inputBorder: "border-lightest-navy",
        inputFocus: "focus:ring-bright-cyan",
    },
    
    // Special Effects
    effects: {
        // The signature "Neon Glow" effect
        glow: "shadow-[0_5px_15px_rgba(100,255,218,0.4)] hover:shadow-[0_8px_25px_rgba(100,255,218,0.6)] transition-all",
        glowText: "drop-shadow-[0_0_5px_rgba(100,255,218,0.5)]",
    }
};
