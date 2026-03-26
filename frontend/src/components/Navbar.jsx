import React from 'react';
import { Search, Bell, User } from 'lucide-react';

const Navbar = ({ title }) => {
    return (
        <nav className="navbar">
            <div className="nav-left">
                <h2 className="page-title">{title}</h2>
            </div>

            <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div className="search-container" style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="form-input"
                        style={{ paddingLeft: '40px', width: '250px', height: '40px' }}
                    />
                </div>

                <div className="notification-bell" style={{ cursor: 'pointer', color: 'var(--text-muted)', position: 'relative' }}>
                    <Bell size={22} />
                    <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', background: 'var(--primary-color)', borderRadius: '50%' }}></span>
                </div>

                <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyCenter: 'center' }}>
                        <User size={20} style={{ margin: '0 auto' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>HR Manager</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Admin Mode</span>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
