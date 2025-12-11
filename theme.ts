
export const THEME = {
    colors: {
        // Base Backgrounds
        background: "bg-steel", // Cool Steel Blue
        surface: "bg-pearl",    // Pure White
        surfaceHighlight: "bg-off-white",
        
        // Text Colors
        textMain: "text-navy",
        textSecondary: "text-slate",
        textHighlight: "text-gold",
        textWarning: "text-rose",
        textInverse: "text-white", // For buttons
        textLink: "text-gold hover:text-navy",
        textGhost: "text-slate/20", // For watermarks

        // Borders - DEFINED & CRISP (Darker for less fuzz)
        borderSubtle: "border-slate-300", // Was 200, now 300 for visibility
        borderHighlight: "border-gold",   // Active/Highlight
        borderWarning: "border-rose",

        // Interactive Elements
        buttonPrimary: "bg-navy text-white hover:bg-navy-light hover:shadow-lg transition-all shadow-md tracking-wider uppercase text-sm font-bold",
        buttonSecondary: "bg-white border-2 border-navy text-navy hover:bg-navy hover:text-white font-bold transition-all shadow-sm tracking-wider uppercase text-sm",
        buttonDanger: "bg-white border border-rose text-rose hover:bg-rose hover:text-white transition-all",
        
        // Inputs - DEFINED OUTLINES (Darker border, crisp shadow)
        inputBg: "bg-white",
        inputBorder: "border-slate-400 shadow-crisp", // High contrast border
        inputFocus: "focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none", // Gold ring on focus
    },
    
    // Special Effects
    effects: {
        // Card: Floating Backlit Style
        // bg-pearl (white) + border-slate-300 (crisp edge) + shadow-floating (backlight/lift)
        card: "bg-pearl rounded-xl border border-slate-300 shadow-floating hover:shadow-floating-hover transition-all duration-500",
        
        // Glow effect for special containers (optional)
        glow: "shadow-floating hover:shadow-floating-hover transition-all duration-300 border border-slate-300",
    }
};