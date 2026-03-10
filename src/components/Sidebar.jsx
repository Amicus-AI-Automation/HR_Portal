import React from 'react';
import { LayoutDashboard, FileText, ClipboardList, Users, Settings, HelpCircle } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { id: 'generator', label: 'Job Description Generator', icon: <FileText size={20} /> },
        { id: 'history', label: 'Generated Job Descriptions', icon: <ClipboardList size={20} /> },
        { id: 'shortlister', label: 'Resume Shortlister', icon: <Users size={20} /> },
        { id: 'candidates', label: 'Candidates', icon: <Users size={20} /> },
        { id: 'questions', label: 'Interview Questions', icon: <HelpCircle size={20} /> },
        { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
    ];

    return (
        <aside className="sidebar">
            <div className="logo-container">
                <div className="logo-icon">
                    <FileText size={20} color="white" />
                </div>
                <span className="logo-text">HR Pro</span>
            </div>

            <nav className="nav-menu">
                {menuItems.map((item) => (
                    <div key={item.id} className="nav-item">
                        <a
                            href="#"
                            className={`nav-link ${activeTab === item.id ? 'active' : ''}`}
                            onClick={(e) => {
                                e.preventDefault();
                                setActiveTab(item.id);
                            }}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </a>
                    </div>
                ))}
            </nav>

            <div className="sidebar-footer" style={{ marginTop: 'auto', padding: '1rem', borderTop: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                &copy; 2026 HR Pro Analytics
            </div>
        </aside>
    );
};

export default Sidebar;
