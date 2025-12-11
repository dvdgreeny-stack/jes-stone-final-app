
export const THEME = {
    colors: {
        // Base Backgrounds
        background: "bg-stone",
        surface: "bg-paper",
        surfaceHighlight: "bg-stone-light",
        
        // Text Colors
        textMain: "text-navy",
        textSecondary: "text-slate",
        textHighlight: "text-gold",
        textWarning: "text-rose",
        textInverse: "text-white", // For buttons
        textLink: "text-gold hover:text-navy",

        // Borders
        borderSubtle: "border-stone",
        borderHighlight: "border-gold/50",
        borderWarning: "border-rose",

        // Interactive Elements
        buttonPrimary: "bg-navy text-white hover:bg-navy-light transition-all shadow-md",
        buttonSecondary: "bg-transparent border-2 border-navy text-navy hover:bg-navy hover:text-white font-bold transition-all",
        buttonDanger: "bg-white border border-rose text-rose hover:bg-rose hover:text-white transition-all",
        
        // Inputs
        inputBg: "bg-stone-light",
        inputBorder: "border-stone-300",
        inputFocus: "focus:ring-gold focus:border-gold",
    },
    
    // Special Effects (Sophisticated Shadows instead of Neon Glow)
    effects: {
        glow: "shadow-soft hover:shadow-soft-hover transition-all duration-300",
        glowText: "", // Removed neon text glow for cleaner look
    }
};