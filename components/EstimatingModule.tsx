
import React, { useState, useMemo } from 'react';
import { THEME } from '../theme';
import { CalculatorIcon, TrashIcon, ClipboardListIcon, SparklesIcon, LoadingSpinner } from './icons';
import { submitSurveyData } from '../services/apiService';
import { BRANDING } from '../branding';
import { translations } from '../translations';
import type { UserSession } from '../types';

interface LineItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
}

interface Package {
    id: string;
    name: string;
    description: string;
    grade: 'A' | 'B' | 'C';
    items: Omit<LineItem, 'id'>[];
}

interface Props {
    session: UserSession;
    lang: 'en' | 'es';
}

export const EstimatingModule: React.FC<Props> = ({ session, lang }) => {
    const t = translations[lang];

    // --- Configuration ---
    const PRICE_BOOK = {
        'Quartz Countertop': 45, // per sq ft
        'Granite Countertop': 38, // per sq ft
        'Backsplash Tile': 12, // per sq ft
        'LVP Flooring': 3.50, // per sq ft
        'Baseboards (4")': 2.25, // per ln ft
        'Cabinet Paint': 900, // per set
        'Cabinet Box Replaced': 150, // per unit
        'Tub Resurface': 350, // flat
        'Full Paint (1 Bed)': 450, // flat
        'Full Paint (2 Bed)': 650, // flat
        'Labor Hour': 75, // per hour
    };

    const PACKAGES: Package[] = [
        {
            id: 'pkg-1-std',
            name: 'Standard 1-Bed Make Ready',
            description: 'Paint, Clean, and Basic Repairs',
            grade: 'B',
            items: [
                { description: 'Full Paint (1 Bed)', quantity: 1, unitPrice: 450 },
                { description: 'Labor Hour', quantity: 4, unitPrice: 75 },
            ]
        },
        {
            id: 'pkg-kitchen-lux',
            name: 'Luxury Kitchen Upgrade',
            description: 'Quartz, Backsplash, & Cab Paint',
            grade: 'C',
            items: [
                { description: 'Quartz Countertop', quantity: 45, unitPrice: 45 },
                { description: 'Backsplash Tile', quantity: 25, unitPrice: 12 },
                { description: 'Cabinet Paint', quantity: 1, unitPrice: 900 },
            ]
        },
        {
            id: 'pkg-value-turn',
            name: 'Value Turn',
            description: 'Essential repairs only',
            grade: 'A',
            items: [
                { description: 'Labor Hour', quantity: 6, unitPrice: 75 },
                { description: 'Tub Resurface', quantity: 1, unitPrice: 350 },
            ]
        }
    ];

    // --- State ---
    const [items, setItems] = useState<LineItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<string>(Object.keys(PRICE_BOOK)[0]);
    const [qty, setQty] = useState<number>(1);
    const [margin, setMargin] = useState<number>(10); // Default 10% margin
    const [gradeFilter, setGradeFilter] = useState<'ALL' | 'A' | 'B' | 'C'>('ALL');
    const [ccEmails, setCcEmails] = useState<string>('');
    
    // Submission State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    // --- Calculations ---
    const subtotal = useMemo(() => {
        return items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    }, [items]);

    const total = useMemo(() => {
        return subtotal * (1 + (margin / 100));
    }, [subtotal, margin]);

    // --- Handlers ---
    const handleAddItem = () => {
        const newItem: LineItem = {
            id: Date.now().toString(),
            description: selectedItem,
            quantity: qty,
            unitPrice: PRICE_BOOK[selectedItem as keyof typeof PRICE_BOOK]
        };
        setItems([...items, newItem]);
    };

    const handleAddPackage = (pkg: Package) => {
        const newItems = pkg.items.map(i => ({
            ...i,
            id: Math.random().toString(36).substr(2, 9)
        }));
        setItems([...items, ...newItems]);
    };

    const handleRemoveItem = (id: string) => {
        setItems(items.filter(i => i.id !== id));
    };

    const handleSubmitEstimate = async () => {
        setIsSubmitting(true);
        
        const estimateDetails = items.map(i => 
            `- ${i.description} (x${i.quantity}): $${(i.quantity * i.unitPrice).toFixed(2)}`
        ).join('\n');

        const notes = `*** SOFT BID REQUEST ***\n\nMargin Applied: ${margin}%\nSubtotal: $${subtotal.toFixed(2)}\nTotal Estimate: $${total.toFixed(2)}\n\nLine Items:\n${estimateDetails}`;
        
        const primaryEmail = session.profile?.email || '';
        const combinedEmails = ccEmails.trim() ? `${primaryEmail}, ${ccEmails}` : primaryEmail;

        const payload: any = {
            propertyId: session.company.properties[0]?.id || 'unknown',
            propertyName: session.company.properties[0]?.name || 'Unknown',
            propertyAddress: session.company.properties[0]?.address || 'Unknown',
            contactName: `${session.profile?.firstName} ${session.profile?.lastName}`,
            firstName: session.profile?.firstName || '',
            lastName: session.profile?.lastName || '',
            email: combinedEmails, 
            phone: session.profile?.phone || '',
            title: session.profile?.title || 'Manager',
            unitInfo: 'Soft Bid Generation',
            services: ['Estimate Request'],
            timeline: 'CapEx Budget',
            notes: notes,
            contactMethods: ['Email Reply'],
        };

        try {
            await submitSurveyData(BRANDING.defaultApiUrl, payload);
            setSubmitSuccess(true);
            setItems([]);
            setCcEmails('');
        } catch (error) {
            alert("Failed to submit estimate.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitSuccess) {
        return (
            <div className="animate-in fade-in duration-500 py-12 text-center">
                <div className="inline-block p-4 rounded-full bg-emerald-50 mb-4">
                    <ClipboardListIcon className="h-12 w-12 text-emerald-600" />
                </div>
                <h2 className={`text-2xl font-bold ${THEME.colors.textMain} mb-2`}>{t.estSuccessTitle}</h2>
                <p className={`${THEME.colors.textSecondary} max-w-md mx-auto mb-6`}>{t.estSuccessMsg}</p>
                <button onClick={() => setSubmitSuccess(false)} className={`${THEME.colors.buttonPrimary} px-6 py-2 rounded`}>{t.estNewButton}</button>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-300">
            <div className="mb-6">
                <h2 className={`text-2xl font-bold ${THEME.colors.textMain} mb-1`}>{t.estTitle}</h2>
                <p className={`${THEME.colors.textSecondary} text-sm`}>{t.estSubtitle}</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                
                {/* LEFT COLUMN: Configurator */}
                <div className={`lg:w-1/2 flex flex-col gap-6`}>
                    
                    {/* Controls */}
                    <div className={`${THEME.colors.surface} p-6 rounded-xl border ${THEME.colors.borderSubtle} shadow-sm`}>
                        <h3 className={`font-bold ${THEME.colors.textMain} mb-4 flex items-center gap-2`}>
                            <CalculatorIcon className="h-5 w-5 text-gold" /> {t.estTabBuild}
                        </h3>
                        
                        {/* Margin Slider */}
                        <div className="mb-6">
                            <div className="flex justify-between mb-2">
                                <label className={`text-xs font-bold ${THEME.colors.textSecondary} uppercase`}>{t.estMarginLabel}</label>
                                <span className={`text-sm font-bold ${THEME.colors.textMain}`}>{margin}%</span>
                            </div>
                            <input 
                                type="range" 
                                min="0" 
                                max="30" 
                                value={margin} 
                                onChange={(e) => setMargin(Number(e.target.value))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-gold"
                            />
                        </div>

                        {/* Item Adder */}
                        <div className="grid grid-cols-4 gap-2 mb-4">
                            <div className="col-span-3">
                                <label className={`block text-xs ${THEME.colors.textSecondary} mb-1 uppercase`}>{t.estItemLabel}</label>
                                <select 
                                    value={selectedItem}
                                    onChange={(e) => setSelectedItem(e.target.value)}
                                    className={`w-full ${THEME.colors.inputBg} ${THEME.colors.textMain} p-2 border ${THEME.colors.inputBorder} rounded focus:ring-1 ${THEME.colors.inputFocus}`}
                                >
                                    {Object.keys(PRICE_BOOK).map(k => (
                                        <option key={k} value={k}>{k} (${PRICE_BOOK[k as keyof typeof PRICE_BOOK]})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={`block text-xs ${THEME.colors.textSecondary} mb-1 uppercase`}>{t.estQtyLabel}</label>
                                <input 
                                    type="number" 
                                    min="1"
                                    value={qty}
                                    onChange={(e) => setQty(Number(e.target.value))}
                                    className={`w-full ${THEME.colors.inputBg} ${THEME.colors.textMain} p-2 border ${THEME.colors.inputBorder} rounded focus:ring-1 ${THEME.colors.inputFocus}`}
                                />
                            </div>
                        </div>
                        <button onClick={handleAddItem} className={`w-full ${THEME.colors.buttonSecondary} py-2 rounded font-bold transition-all mb-6`}>
                            {t.estAddButton}
                        </button>
                    </div>

                    {/* Packages */}
                    <div className={`${THEME.colors.surface} p-6 rounded-xl border ${THEME.colors.borderSubtle} shadow-sm`}>
                        <div className="flex justify-between items-center mb-4">
                             <h3 className={`font-bold ${THEME.colors.textMain}`}>{t.estTabPackages}</h3>
                             <div className="flex gap-1">
                                {['ALL', 'A', 'B', 'C'].map(g => (
                                    <button 
                                        key={g} 
                                        onClick={() => setGradeFilter(g as any)}
                                        className={`text-[10px] px-2 py-1 rounded font-bold border ${gradeFilter === g ? 'bg-navy text-white border-navy' : 'bg-white text-slate-500 border-slate-200'}`}
                                    >
                                        {g}
                                    </button>
                                ))}
                             </div>
                        </div>
                        <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto pr-2">
                            {PACKAGES.filter(p => gradeFilter === 'ALL' || p.grade === gradeFilter).map(pkg => (
                                <button 
                                    key={pkg.id}
                                    onClick={() => handleAddPackage(pkg)}
                                    className="text-left p-3 border border-slate-200 rounded hover:border-gold hover:shadow-md transition-all group bg-white"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="font-bold text-navy group-hover:text-gold">{pkg.name}</div>
                                        <div className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${pkg.grade === 'C' ? 'bg-gold text-white' : 'bg-slate-100 text-slate-500'}`}>
                                            Grade {pkg.grade}
                                        </div>
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">{pkg.description}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Live Receipt */}
                <div className={`lg:w-1/2 flex flex-col h-full`}>
                    <div className={`${THEME.colors.surface} rounded-xl border ${THEME.colors.borderSubtle} shadow-lg overflow-hidden flex flex-col h-full min-h-[500px] relative`}>
                         {/* Receipt Header */}
                        <div className="bg-navy p-6 text-white text-center relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-xl font-bold tracking-widest uppercase">Soft Bid Estimate</h3>
                                <p className="text-xs text-slate-300 mt-1">
                                    {new Date().toLocaleString('en-US', { timeZone: 'America/Chicago', dateStyle: 'medium', timeStyle: 'short' })}
                                </p>
                            </div>
                            <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-gold rounded-full opacity-20 blur-xl"></div>
                            <div className="absolute -top-4 -right-4 w-20 h-20 bg-white rounded-full opacity-10 blur-xl"></div>
                        </div>

                        {/* Receipt Body */}
                        <div className="flex-1 p-0 overflow-y-auto bg-slate-50/50">
                            <table className="w-full text-left text-sm">
                                <thead className={`text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200`}>
                                    <tr>
                                        <th className="p-4">{t.estTableDesc}</th>
                                        <th className="p-4 text-center">{t.estTableQty}</th>
                                        <th className="p-4 text-right">{t.estTablePrice}</th>
                                        <th className="p-4 w-8"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="p-12 text-center text-slate-400 italic">
                                                {t.estEmptyState}
                                            </td>
                                        </tr>
                                    ) : (
                                        items.map(item => (
                                            <tr key={item.id} className="hover:bg-slate-50">
                                                <td className="p-4 font-medium text-navy">{item.description}</td>
                                                <td className="p-4 text-center text-slate-600">{item.quantity}</td>
                                                <td className="p-4 text-right text-slate-600">${(item.quantity * item.unitPrice).toFixed(2)}</td>
                                                <td className="p-4 text-center">
                                                    <button onClick={() => handleRemoveItem(item.id)} className="text-rose hover:text-rose/70"><TrashIcon className="h-4 w-4" /></button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Receipt Footer */}
                        <div className="p-6 bg-white border-t border-slate-200">
                             <div className="space-y-2 mb-6">
                                <div className="flex justify-between text-sm text-slate-500">
                                    <span>Subtotal</span>
                                    <span>${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-slate-500">
                                    <span>Margin ({margin}%)</span>
                                    <span>${(total - subtotal).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xl font-extrabold text-navy pt-2 border-t border-slate-100">
                                    <span>{t.estTotalLabel}</span>
                                    <span>${total.toFixed(2)}</span>
                                </div>
                            </div>
                            
                            <div className="mb-4">
                                <input 
                                    type="text" 
                                    value={ccEmails}
                                    onChange={(e) => setCcEmails(e.target.value)}
                                    placeholder={t.ccManagersLabel}
                                    className={`w-full p-2 text-xs rounded border ${THEME.colors.inputBorder} ${THEME.colors.inputFocus}`}
                                />
                            </div>

                            <button 
                                onClick={handleSubmitEstimate}
                                disabled={items.length === 0 || isSubmitting}
                                className={`w-full ${THEME.colors.buttonPrimary} py-3 rounded shadow-lg text-sm flex justify-center items-center gap-2 ${items.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isSubmitting ? <LoadingSpinner /> : <SparklesIcon className="h-4 w-4 text-gold" />}
                                {isSubmitting ? t.submittingButton : t.estSubmitButton}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
