
import React, { useState } from 'react';
import { THEME } from '../theme';
import { ChartBarIcon, ClipboardListIcon, SparklesIcon } from './icons';
import { translations } from '../translations';

interface Props {
    lang: 'en' | 'es';
}

export const AssetManagerModule: React.FC<Props> = ({ lang }) => {
    const t = translations[lang];
    const [approvals, setApprovals] = useState([
        { id: 1, prop: 'The Arts at Park Place', item: 'Clubhouse Reno', cost: 12500, roi: '18%' },
        { id: 2, prop: 'Canyon Creek', item: 'Unit 204 Full Turn', cost: 4200, roi: '12%' },
        { id: 3, prop: 'Vantage Point', item: 'Pool Deck Resurface', cost: 8500, roi: '15%' },
    ]);

    const handleApprove = (id: number) => {
        setApprovals(approvals.filter(a => a.id !== id));
        alert("Approved & Sent to Accounting");
    };

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className={`text-3xl font-bold ${THEME.colors.textMain} tracking-tight`}>{t.assetTitle}</h2>
                    <p className={`${THEME.colors.textSecondary}`}>{t.assetSubtitle}</p>
                </div>
                <button className={`flex items-center gap-2 px-4 py-2 ${THEME.colors.surface} border ${THEME.colors.borderHighlight} rounded-full text-xs font-bold ${THEME.colors.textHighlight} hover:bg-slate-50 transition-colors`}>
                    <SparklesIcon className="h-4 w-4" />
                    {t.assetGeminiInsight}
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[
                    { label: t.assetKpiBudget, val: '$1.2M', trend: '+12% YTD', color: 'text-navy' },
                    { label: t.assetKpiDeployed, val: '$850k', trend: '71% Utilized', color: 'text-gold' },
                    { label: t.assetKpiRoi, val: '14.5%', trend: 'On Target', color: 'text-emerald-600' }
                ].map((kpi, idx) => (
                    <div key={idx} className={`${THEME.colors.surface} p-6 rounded-xl border ${THEME.colors.borderSubtle} shadow-sm hover:shadow-md transition-shadow`}>
                        <h3 className={`text-xs font-bold uppercase ${THEME.colors.textSecondary} mb-2 tracking-wider`}>{kpi.label}</h3>
                        <div className={`text-4xl font-extrabold ${kpi.color} mb-1`}>{kpi.val}</div>
                        <div className="text-xs text-slate-400 font-medium">{kpi.trend}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Approval Queue */}
                <div className={`${THEME.colors.surface} p-6 rounded-xl border ${THEME.colors.borderSubtle} shadow-sm`}>
                    <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-2">
                        <ClipboardListIcon className="h-5 w-5 text-gold" />
                        <h3 className={`font-bold ${THEME.colors.textMain}`}>{t.assetApprovalQueue}</h3>
                        <span className="ml-auto bg-rose text-white text-xs font-bold px-2 py-0.5 rounded-full">{approvals.length}</span>
                    </div>
                    
                    <div className="space-y-4">
                        {approvals.length === 0 ? (
                            <p className="text-center text-slate-400 py-8 italic">All caught up!</p>
                        ) : (
                            approvals.map(app => (
                                <div key={app.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 border border-slate-100 rounded-lg bg-slate-50/50">
                                    <div>
                                        <div className={`font-bold ${THEME.colors.textMain}`}>{app.item}</div>
                                        <div className="text-xs text-slate-500">{app.prop}</div>
                                        <div className="text-xs font-bold text-emerald-600 mt-1">Proj. ROI: {app.roi}</div>
                                    </div>
                                    <div className="flex items-center gap-4 w-full sm:w-auto">
                                        <div className={`text-lg font-bold ${THEME.colors.textMain}`}>${app.cost.toLocaleString()}</div>
                                        <div className="flex gap-2 ml-auto sm:ml-0">
                                            <button onClick={() => handleApprove(app.id)} className="bg-navy text-white text-xs font-bold px-3 py-2 rounded hover:bg-navy-light transition-colors">{t.assetApproveBtn}</button>
                                            <button className="border border-slate-300 text-slate-500 text-xs font-bold px-3 py-2 rounded hover:bg-rose hover:text-white transition-colors">{t.assetRejectBtn}</button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Spend Analysis (Visual Placeholder) */}
                <div className={`${THEME.colors.surface} p-6 rounded-xl border ${THEME.colors.borderSubtle} shadow-sm flex flex-col`}>
                    <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-2">
                        <ChartBarIcon className="h-5 w-5 text-gold" />
                        <h3 className={`font-bold ${THEME.colors.textMain}`}>{t.assetSpendCategory}</h3>
                    </div>
                    
                    <div className="flex-1 flex items-center justify-center relative">
                        {/* CSS Donut Chart */}
                        <div className="w-48 h-48 rounded-full border-[16px] border-slate-100 relative flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full border-[16px] border-navy border-r-transparent border-b-transparent rotate-45"></div>
                            <div className="absolute inset-0 rounded-full border-[16px] border-gold border-t-transparent border-l-transparent rotate-[200deg]"></div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-navy">64%</div>
                                <div className="text-[10px] uppercase font-bold text-slate-400">Interiors</div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mt-6 text-center text-xs">
                         <div>
                             <span className="block w-3 h-3 bg-navy rounded-full mx-auto mb-1"></span>
                             <span className="font-bold text-navy">Interiors</span>
                         </div>
                         <div>
                             <span className="block w-3 h-3 bg-gold rounded-full mx-auto mb-1"></span>
                             <span className="font-bold text-navy">Exteriors</span>
                         </div>
                         <div>
                             <span className="block w-3 h-3 bg-slate-200 rounded-full mx-auto mb-1"></span>
                             <span className="font-bold text-slate-400">Emergency</span>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
