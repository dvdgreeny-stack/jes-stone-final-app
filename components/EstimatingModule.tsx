import React, { useState, useMemo } from 'react';
import { THEME } from '../theme';
import { CalculatorIcon, TrashIcon, ClipboardListIcon, SparklesIcon, LoadingSpinner } from './icons';
import { submitSurveyData } from '../services/apiService';
import { BRANDING } from '../branding';
import { translations } from '../translations';
import type { UserSession, SurveyData } from '../types';

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
            items: [
                { description: 'Full Paint (1 Bed)', quantity: 1, unitPrice: 450 },
                { description: 'Labor Hour', quantity: 4, unitPrice: 75 }, // Minor repairs
            ]
        },
        {
            id: 'pkg-kitchen-lux',
            name: 'Luxury Kitchen Upgrade',
            description: 'Quartz, Backsplash, & Cab Paint',
            items: [
                { description: 'Quartz Countertop', quantity: 45, unitPrice: 45 },
                { description: 'Backsplash Tile', quantity: 25, unitPrice: 12 },
                { description: 'Cabinet Paint', quantity: 1, unitPrice: 900 },
            ]
        }
    ];

    // --- State ---
    const [items, setItems] = useState<LineItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<string>(Object.keys(PRICE_BOOK)[0]);
    const [qty, setQty] = useState<number>(1);
    const [budgetCap, setBudgetCap] = useState<number>(5000); // Default CapEx Limit
    const [activeTab, setActiveTab] = useState<'build' | 'packages'>('build');
    const [ccEmails, setCcEmails] = useState<string>('');
    
    // Submission State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    // --- Calculations ---
    const total = useMemo(() => {
        return items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    }, [items]);

    const budgetPercent = Math.min((total / budgetCap) * 100, 100);
    let budgetColor = "bg-emerald-500";
    if (budgetPercent > 75) budgetColor = "bg-yellow-500";
    if (budgetPercent >= 100) budgetColor = "bg-rose-500";

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

        const notes = `*** ESTIMATE REQUEST ***\n\nTarget Budget: $${budgetCap}\nEstimated Total: $${total.toFixed(2)}\n\nLine Items:\n${estimateDetails}`;
        
        // Combine session email with CC emails
        const primaryEmail = session.profile?.email || '';
        const combinedEmails = ccEmails.trim() ? `${primaryEmail}, ${ccEmails}` : primaryEmail;

        const otherServicesText = `CapEx Limit: $${budgetCap}`;

        // Construct payload manually to match the strict 'any' type used in App.tsx
        // This ensures the 'other' key is present for the Google Sheet column.
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
            
            unitInfo: 'Multiple/General CapEx',
            services: ['Estimate Request', 'Budget Approval'],
            
            // CRITICAL: Send as arrays for backend .join() compatibility
            other: [otherServicesText],        
            otherServices: [otherServicesText], 

            timeline: 'CapEx Budget - Future',
            notes: notes,
            contactMethods: ['Email Reply'],
            attachments: []
        };

        try {
            await submitSurveyData(BRANDING.defaultApiUrl, payload);
            setSubmitSuccess(true);
            setItems([]); // Clear cart
            setCcEmails('');
        } catch (error) {
            alert("Failed to submit estimate. Please check connection.");
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
                <p className={`${THEME.colors.textSecondary} max-w-md mx-auto mb-6`}>
                    {t.estSuccessMsg}
                </p>
                <button 
                    onClick={() => setSubmitSuccess(false)}
                    className={`${THEME.colors.buttonPrimary} px-6 py-2 rounded`}
                >
                    {t.estNewButton}
                </button>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-300">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
                <div>
                    <h2 className={`text-2xl font-bold ${THEME.colors.textMain} mb-1`}>{t.estTitle}</h2>
                    <p className={`${THEME.colors.textSecondary} text-sm`}>{t.estSubtitle}</p>
                </div>
                
                {/* Budget Thermometer */}
                <div className={`flex-1 w-full md:max-w-md ${THEME.colors.surface} p-3 rounded-lg border ${THEME.colors.borderSubtle} shadow-sm`}>
                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
                        <span className={THEME.colors.textSecondary}>{t.estBudgetUtil}</span>
                        <span className={total > budgetCap ? THEME.colors.textWarning : THEME.colors.textHighlight}>
                            ${total.toFixed(0)} / <input 
                                type="number" 
                                value={budgetCap} 
                                onChange={(e) => setBudgetCap(Number(e.target.value))}
                                className="w-16 text-right border-b border-slate-300 focus:outline-none focus:border-gold bg-transparent"
                            />
                        </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-500 ease-out ${budgetColor}`} 
                            style={{ width: `${budgetPercent}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Builder Column */}
                <div className={`lg:col-span-1 ${THEME.colors.surface} rounded-lg border ${THEME.colors.borderSubtle} overflow-hidden h-fit`}>
                    <div className="flex border-b border-slate-200">
                        <button 
                            onClick={() => setActiveTab('build')}
                            className={`flex-1 py-3 text-sm font-bold uppercase tracking-wide ${activeTab === 'build' ? 'bg-navy text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            {t.estTabBuild}
                        </button>
                        <button 
                            onClick={() => setActiveTab('packages')}
                            className={`flex-1 py-3 text-sm font-bold uppercase tracking-wide ${activeTab === 'packages' ? 'bg-navy text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            {t.estTabPackages}
                        </button>
                    </div>

                    <div className="p-6">
                        {activeTab === 'build' ? (
                            <div className="space-y-4">
                                <div>
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
                                <button 
                                    onClick={handleAddItem}
                                    className={`w-full ${THEME.colors.buttonSecondary} py-2 rounded font-bold transition-all`}
                                >
                                    {t.estAddButton}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {PACKAGES.map(pkg => (
                                    <button 
                                        key={pkg.id}
                                        onClick={() => handleAddPackage(pkg)}
                                        className="w-full text-left p-3 border border-slate-200 rounded hover:border-gold hover:shadow-md transition-all group"
                                    >
                                        <div className="font-bold text-navy group-hover:text-gold">{pkg.name}</div>
                                        <div className="text-xs text-slate-500">{pkg.description}</div>
                                        <div className="text-xs font-bold text-slate-400 mt-1">{t.estPkgIncludes} {pkg.items.length} {t.estPkgItems}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Summary Column */}
                <div className={`lg:col-span-2 ${THEME.colors.surface} rounded-lg overflow-hidden border ${THEME.colors.borderSubtle} flex flex-col`}>
                    <div className="flex-1">
                        <table className="w-full text-left text-sm">
                            <thead className={`${THEME.colors.background} ${THEME.colors.textSecondary} uppercase text-xs font-bold`}>
                                <tr>
                                    <th className="p-4">{t.estTableDesc}</th>
                                    <th className="p-4 text-center">{t.estTableQty}</th>
                                    <th className="p-4 text-right">{t.estTablePrice}</th>
                                    <th className="p-4 text-right">{t.estTableTotal}</th>
                                    <th className="p-4 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${THEME.colors.borderSubtle}`}>
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className={`p-12 text-center ${THEME.colors.textSecondary} italic`}>
                                            <CalculatorIcon className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                            {t.estEmptyState}
                                        </td>
                                    </tr>
                                ) : (
                                    items.map(item => (
                                        <tr key={item.id} className={`hover:${THEME.colors.background}/50`}>
                                            <td className={`p-4 ${THEME.colors.textMain}`}>{item.description}</td>
                                            <td className={`p-4 text-center ${THEME.colors.textSecondary}`}>{item.quantity}</td>
                                            <td className={`p-4 text-right ${THEME.colors.textSecondary}`}>${item.unitPrice.toFixed(2)}</td>
                                            <td className={`p-4 text-right ${THEME.colors.textMain} font-bold`}>${(item.quantity * item.unitPrice).toFixed(2)}</td>
                                            <td className="p-4 text-right">
                                                <button onClick={() => handleRemoveItem(item.id)} className={`${THEME.colors.textWarning} hover:text-opacity-80`}>
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Footer Area */}
                    <div className={`${THEME.colors.background} border-t ${THEME.colors.borderHighlight} p-6`}>
                        <div className="flex justify-between items-center mb-6">
                            <div className={`text-sm font-bold ${THEME.colors.textSecondary} uppercase tracking-wider`}>{t.estTotalLabel}</div>
                            <div className={`text-3xl font-bold ${THEME.colors.textMain}`}>${total.toFixed(2)}</div>
                        </div>

                         {/* CC Managers Input */}
                        <div className="mb-4">
                            <label className={`block text-xs font-bold ${THEME.colors.textSecondary} uppercase mb-1`}>
                                {translations.en.ccManagersLabel}
                            </label>
                            <input 
                                type="text" 
                                value={ccEmails}
                                onChange={(e) => setCcEmails(e.target.value)}
                                placeholder="e.g. boss@company.com, regional@company.com"
                                className={`w-full p-2 text-sm rounded border ${THEME.colors.inputBorder} ${THEME.colors.inputFocus}`}
                            />
                        </div>
                        
                        <button 
                            onClick={handleSubmitEstimate}
                            disabled={items.length === 0 || isSubmitting}
                            className={`w-full ${THEME.colors.buttonPrimary} py-4 rounded shadow-lg text-lg flex justify-center items-center gap-2 ${items.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.01]'}`}
                        >
                            {isSubmitting ? <LoadingSpinner /> : <SparklesIcon className="h-5 w-5 text-gold" />}
                            {isSubmitting ? t.submittingButton : t.estSubmitButton}
                        </button>
                        <p className="text-center text-xs text-slate-400 mt-3 flex items-center justify-center gap-2">
                            <span>{t.estSubmittingAs} <strong className={THEME.colors.textMain}>{session.profile?.email}</strong></span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};