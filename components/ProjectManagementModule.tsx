
import React, { useState } from 'react';
import { THEME } from '../theme';
import { ClockIcon, BuildingBlocksIcon, ClipboardListIcon } from './icons';

interface Props {
    mode: 'client' | 'company';
}

export const ProjectManagementModule: React.FC<Props> = ({ mode }) => {
    // Mock Data for SaaS demo
    // In a real app, 'company' mode would fetch ALL projects, 'client' would filter by user's property
    const allProjects = [
        { id: '1', title: 'Unit 104 Full Remodel', property: 'The Arts at Park Place', stage: 'Production', progress: 65, status: 'On Schedule' },
        { id: '2', title: 'Lobby Flooring', property: 'Canyon Creek', stage: 'Procurement', progress: 20, status: 'Waiting on Material' },
        { id: '3', title: 'Pool Area Granite', property: 'The Arts at Park Place', stage: 'Planning', progress: 5, status: 'Permitting' },
        { id: '4', title: 'Office Expansion', property: 'The Arts at Park Place', stage: 'Production', progress: 40, status: 'On Schedule' },
        { id: '5', title: 'Unit 205 Turn', property: 'Canyon Creek', stage: 'Completed', progress: 100, status: 'Ready' },
    ];

    // Simple filter simulation
    // If client mode, we just show a subset to simulate "My Projects"
    const projects = mode === 'client' 
        ? allProjects.slice(0, 3) 
        : allProjects;

    const [filter, setFilter] = useState('All');

    return (
        <div className="animate-in fade-in duration-300">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className={`text-2xl font-bold ${THEME.colors.textMain} mb-2`}>
                        {mode === 'company' ? 'Global Project Tracker' : 'My Projects'}
                    </h2>
                    <p className={`${THEME.colors.textSecondary}`}>
                        {mode === 'company' ? 'Monitor active jobs across all properties.' : 'Track status of your requested services.'}
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
                    {['All', 'Production', 'Procurement', 'Planning', 'Completed'].map(f => (
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
                {projects.filter(p => filter === 'All' || p.stage === filter).map(project => (
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
                                project.status === 'On Schedule' || project.status === 'Ready' ? 'border-bright-cyan text-bright-cyan' : 
                                project.status === 'Waiting on Material' ? 'border-bright-pink text-bright-pink' : 'border-slate text-slate'
                            }`}>
                                {project.status}
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-navy rounded-full h-2.5 mb-2 overflow-hidden">
                            <div 
                                className={`h-2.5 rounded-full ${project.status === 'Waiting on Material' ? 'bg-bright-pink' : 'bg-bright-cyan'}`} 
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
