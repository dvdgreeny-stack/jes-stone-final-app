
export const THEME = {
    colors: {
        // Base Backgrounds
        background: "bg-stone",
        surface: "bg-pearl", // Changed from white to Pearl
        surfaceHighlight: "bg-white",
        
        // Text Colors
        textMain: "text-navy",
        textSecondary: "text-slate",
        textHighlight: "text-gold",
        textWarning: "text-rose",
        textInverse: "text-white", // For buttons
        textLink: "text-gold hover:text-navy",
        textGhost: "text-slate/20", // For watermarks

        // Borders
        borderSubtle: "border-stone-300",
        borderHighlight: "border-gold/30",
        borderWarning: "border-rose",

        // Interactive Elements
        buttonPrimary: "bg-navy text-white hover:bg-navy-light hover:shadow-lg transition-all shadow-md tracking-wider uppercase text-sm",
        buttonSecondary: "bg-white/50 border border-navy text-navy hover:bg-navy hover:text-white font-bold transition-all shadow-sm tracking-wider uppercase text-sm",
        buttonDanger: "bg-white border border-rose text-rose hover:bg-rose hover:text-white transition-all",
        
        // Inputs (The "Backlit" feel)
        inputBg: "bg-white/80 backdrop-blur-sm",
        inputBorder: "border-transparent shadow-inner-light",
        inputFocus: "focus:ring-2 focus:ring-gold/50 focus:shadow-pearl focus:bg-white", // Glows when clicked
    },
    
    // Special Effects
    effects: {
        // The Pearl Glow: Soft gold/white halo
        glow: "shadow-pearl hover:shadow-pearl-hover transition-all duration-500 border border-white/50",
        card: "bg-pearl rounded-xl shadow-pearl border border-white/60",
    }
};