import React from 'react';
import { THEME } from '../theme';
import { ClockIcon, BuildingBlocksIcon, ClipboardListIcon } from './icons';

export const ProjectManagementModule: React.FC = () => {
    // Mock Data for SaaS demo
    const projects = [
        { id: '1', title: 'Unit 104 Full Remodel', stage: 'Production', progress: 65, status: 'On Schedule' },
        { id: '2', title: 'Lobby Flooring', stage: 'Procurement', progress: 20, status: 'Waiting on Material' },
        { id: '3', title: 'Pool Area Granite', stage: 'Planning', progress: 5, status: 'Permitting' },
    ];

    return (
        <div className="animate-in fade-in duration-300">
            <h2 className={`text-2xl font-bold ${THEME.colors.textMain} mb-2`}>Project Tracker</h2>
            <p className={`${THEME.colors.textSecondary} mb-6`}>Monitor active jobs and production status.</p>

            <div className="grid gap-4">
                {projects.map(project => (
                    <div key={project.id} className={`${THEME.colors.surface} p-6 rounded-lg border ${THEME.colors.borderSubtle} hover:${THEME.colors.borderHighlight} transition-colors group`}>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                            <div>
                                <h3 className={`text-lg font-bold ${THEME.colors.textMain}`}>{project.title}</h3>
                                <span className={`text-xs uppercase tracking-wider font-bold ${THEME.colors.textSecondary} bg-navy px-2 py-1 rounded mt-1 inline-block`}>
                                    {project.stage}
                                </span>
                            </div>
                            <div className={`text-sm font-bold px-3 py-1 rounded border ${
                                project.status === 'On Schedule' ? 'border-bright-cyan text-bright-cyan' : 
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
                            <button className={`text-xs ${THEME.colors.textHighlight} hover:underline`}>Contact Foreman</button>
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