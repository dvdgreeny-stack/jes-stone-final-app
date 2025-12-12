
import React, { useState, useEffect } from 'react';
import { THEME } from '../theme';
import { ClockIcon, BuildingBlocksIcon, ClipboardListIcon } from './icons';
import { translations } from '../translations';

interface Props {
    mode: 'client' | 'company';
    lang: 'en' | 'es';
}

export const ProjectManagementModule: React.FC<Props> = ({ mode, lang }) => {
    const t = translations[lang];

    // Mock Data for SaaS demo
    // In a real app, 'company' mode would fetch ALL projects, 'client' would filter by user's property
    const allProjects = [
        { id: '1', title: 'Unit 104 Full Remodel', property: 'The Arts at Park Place', stage: t.projFilterProduction, progress: 65, status: t.projStatusOnSchedule },
        { id: '2', title: 'Lobby Flooring', property: 'Canyon Creek', stage: t.projFilterProcurement, progress: 20, status: t.projStatusWaiting },
        { id: '3', title: 'Pool Area Granite', property: 'The Arts at Park Place', stage: t.projFilterPlanning, progress: 5, status: t.projStatusPermitting },
        { id: '4', title: 'Office Expansion', property: 'The Arts at Park Place', stage: t.projFilterProduction, progress: 40, status: t.projStatusOnSchedule },
        { id: '5', title: 'Unit 205 Turn', property: 'Canyon Creek', stage: t.projFilterCompleted, progress: 100, status: t.projStatusReady },
    ];

    // Simple filter simulation
    // If client mode, we just show a subset to simulate "My Projects"
    const projects = mode === 'client' 
        ? allProjects.slice(0, 3) 
        : allProjects;

    const [filter, setFilter] = useState(t.projFilterAll);

    // Update filter text when language changes to prevent stuck state
    useEffect(() => {
        setFilter(t.projFilterAll);
    }, [lang, t.projFilterAll]);

    const filters = [t.projFilterAll, t.projFilterProduction, t.projFilterProcurement, t.projFilterPlanning, t.projFilterCompleted];

    return (
        <div className="animate-in fade-in duration-300">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className={`text-2xl font-bold ${THEME.colors.textMain} mb-2`}>
                        {mode === 'company' ? t.projTitleCompany : t.projTitleClient}
                    </h2>
                    <p className={`${THEME.colors.textSecondary}`}>
                        {mode === 'company' ? t.projSubtitleCompany : t.projSubtitleClient}
                    </p>
                </div>
                {mode === 'company' && (
                    <div className={`${THEME.colors.background} px-3 py-1 rounded text-xs border ${THEME.colors.borderHighlight} ${THEME.colors.textHighlight}`}>
                        Admin View
                    </div>
                )}
            </div>

            {mode === 'company' && (
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {filters.map(f => (
                        <button 
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${filter === f ? `${THEME.colors.buttonPrimary}` : `${THEME.colors.surface} border ${THEME.colors.borderSubtle} ${THEME.colors.textSecondary}`}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            )}

            <div className="grid gap-4">
                {projects.filter(p => filter === t.projFilterAll || p.stage === filter).map(project => (
                    <div key={project.id} className={`${THEME.colors.surface} p-6 rounded-lg border ${THEME.colors.borderSubtle} hover:${THEME.colors.borderHighlight} transition-colors group`}>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                            <div>
                                <h3 className={`text-lg font-bold ${THEME.colors.textMain}`}>{project.title}</h3>
                                {mode === 'company' && (
                                    <p className={`text-xs ${THEME.colors.textHighlight} mb-1`}>{project.property}</p>
                                )}
                                <span className={`text-xs uppercase tracking-wider font-bold ${THEME.colors.textSecondary} bg-navy px-2 py-1 rounded mt-1 inline-block`}>
                                    {project.stage}
                                </span>
                            </div>
                            <div className={`text-sm font-bold px-3 py-1 rounded border ${
                                project.status === t.projStatusOnSchedule || project.status === t.projStatusReady ? 'border-bright-cyan text-bright-cyan' : 
                                project.status === t.projStatusWaiting ? 'border-bright-pink text-bright-pink' : 'border-slate text-slate'
                            }`}>
                                {project.status}
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-navy rounded-full h-2.5 mb-2 overflow-hidden">
                            <div 
                                className={`h-2.5 rounded-full ${project.status === t.projStatusWaiting ? 'bg-bright-pink' : 'bg-bright-cyan'}`} 
                                style={{ width: `${project.progress}%` }}
                            ></div>
                        </div>
                        <div className="flex justify-between text-xs text-slate">
                            <span>0% Started</span>
                            <span>{project.progress}% Complete</span>
                            <span>100% Handover</span>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-white/5 flex gap-4 opacity-50 group-hover:opacity-100 transition-opacity">
                            <button className={`text-xs ${THEME.colors.textHighlight} hover:underline`}>View Schedule</button>
                            <button className={`text-xs ${THEME.colors.textHighlight} hover:underline`}>View Material List</button>
                            {mode === 'company' && <button className={`text-xs ${THEME.colors.textHighlight} hover:underline`}>Contact Property</button>}
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="mt-8 text-center">
                <button className={`${THEME.colors.buttonSecondary} px-6 py-2 rounded font-bold`}>
                    View All Archived Projects
                </button>
            </div>
        </div>
    );
};