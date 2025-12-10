import React, { useState, useMemo } from 'react';
import { THEME } from '../theme';
import { translations } from '../translations';
import { CalculatorIcon, TrashIcon } from './icons';

interface LineItem {
    id: string;
    category: string;
    description: string;
    quantity: number;
    unitPrice: number;
}

export const EstimatingModule: React.FC = () => {
    // Hardcoded simple price list for the MVP
    // In a real SaaS, this would come from the Google Sheet "Pricing" tab
    const PRICE_BOOK = {
        'Quartz Countertop': 45, // per sq ft
        'Granite Countertop': 38, // per sq ft
        'Backsplash Tile': 12, // per sq ft
        'LVP Flooring': 3.50, // per sq ft
        'Cabinet Box': 150, // per unit
        'Labor Hour': 75, // per hour
    };

    const [items, setItems] = useState<LineItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<string>(Object.keys(PRICE_BOOK)[0]);
    const [qty, setQty] = useState<number>(1);

    const handleAddItem = () => {
        const newItem: LineItem = {
            id: Date.now().toString(),
            category: 'Material',
            description: selectedItem,
            quantity: qty,
            unitPrice: PRICE_BOOK[selectedItem as keyof typeof PRICE_BOOK]
        };
        setItems([...items, newItem]);
    };

    const handleRemoveItem = (id: string) => {
        setItems(items.filter(i => i.id !== id));
    };

    const total = useMemo(() => {
        return items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    }, [items]);

    return (
        <div className="animate-in fade-in duration-300">
            <h2 className={`text-2xl font-bold ${THEME.colors.textMain} mb-2`}>Quick Estimator</h2>
            <p className={`${THEME.colors.textSecondary} mb-6`}>Draft budget estimates for approval.</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calculator Input */}
                <div className={`lg:col-span-1 ${THEME.colors.surface} p-6 rounded-lg h-fit border ${THEME.colors.borderSubtle}`}>
                    <h3 className={`font-bold ${THEME.colors.textHighlight} mb-4 flex items-center gap-2`}>
                        <CalculatorIcon className="h-5 w-5" /> Add Line Item
                    </h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className={`block text-xs ${THEME.colors.textSecondary} mb-1 uppercase`}>Item</label>
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
                             <label className={`block text-xs ${THEME.colors.textSecondary} mb-1 uppercase`}>Quantity</label>
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
                            Add to Estimate
                        </button>
                    </div>
                </div>

                {/* Estimate Summary */}
                <div className={`lg:col-span-2 ${THEME.colors.surface} rounded-lg overflow-hidden border ${THEME.colors.borderSubtle}`}>
                    <table className="w-full text-left text-sm">
                        <thead className={`${THEME.colors.background} ${THEME.colors.textSecondary} uppercase text-xs font-bold`}>
                            <tr>
                                <th className="p-4">Description</th>
                                <th className="p-4 text-center">Qty</th>
                                <th className="p-4 text-right">Price</th>
                                <th className="p-4 text-right">Total</th>
                                <th className="p-4 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${THEME.colors.borderSubtle}`}>
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className={`p-8 text-center ${THEME.colors.textSecondary} italic`}>
                                        No items added yet.
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
                        <tfoot className={`${THEME.colors.background} border-t ${THEME.colors.borderHighlight}`}>
                            <tr>
                                <td colSpan={3} className={`p-4 text-right font-bold ${THEME.colors.textSecondary} uppercase tracking-wider`}>Total Estimate</td>
                                <td className={`p-4 text-right font-bold text-xl ${THEME.colors.textHighlight}`}>${total.toFixed(2)}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                    <div className="p-4 flex justify-end">
                        <button className={`${THEME.colors.buttonPrimary} px-6 py-2 rounded font-bold disabled:opacity-50`} disabled={items.length === 0}>
                            Save & Email Quote
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};