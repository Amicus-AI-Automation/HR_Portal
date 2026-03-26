import React from 'react';
import { Calendar, Building, MapPin, ExternalLink, FileText, Download, Printer } from 'lucide-react';
import html2pdf from 'html2pdf.js';

const HistoryList = ({ jds }) => {
    const [selectedJD, setSelectedJD] = React.useState(null);
    const modalContentRef = React.useRef(null);

    const handleDownloadPDF = () => {
        if (!selectedJD || !modalContentRef.current) return;

        const element = modalContentRef.current;
        const opt = {
            margin: 1,
            filename: `${selectedJD.title.replace(/\s+/g, '_')}_JD.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        // Standard PDF generation
        html2pdf().from(element).set(opt).save();
    };

    if (jds.length === 0) {
        return (
            <div className="card animate-fade-in" style={{ textAlign: 'center', padding: '5rem' }}>
                <div style={{ marginBottom: '1.5rem', opacity: 0.5 }}>
                    <FileText size={64} style={{ margin: '0 auto' }} />
                </div>
                <h3>No Job Descriptions Yet</h3>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    Generate your first AI-powered job description to see it here.
                </p>
            </div>
        );
    }

    return (
        <div className="history-container animate-fade-in">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                {jds.map((jd) => (
                    <div key={jd.id} className="card jd-card" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.125rem' }}>{jd.title}</h3>
                                <span style={{ fontSize: '0.875rem', color: 'var(--primary-color)', fontWeight: '600' }}>{jd.department}</span>
                            </div>
                            <div style={{ padding: '0.25rem 0.75rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-color)', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600' }}>
                                Ready
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Building size={14} />
                                <span>Experience: {jd.experience}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <MapPin size={14} />
                                <span>{jd.location || 'Remote'}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Calendar size={14} />
                                <span>Generated: {new Date(jd.createdAt || jd.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>

                        <div style={{
                            background: 'rgba(0,0,0,0.1)',
                            padding: '1rem',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            color: 'var(--text-main)',
                            maxHeight: '120px',
                            overflow: 'hidden',
                            position: 'relative',
                            marginBottom: '1.5rem'
                        }}>
                            {jd.content.substring(0, 200)}...
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40px', background: 'linear-gradient(transparent, var(--sidebar-bg))' }}></div>
                        </div>

                        <button
                            className="btn"
                            style={{ width: '100%', background: 'rgba(188, 211, 225, 0.87)', marginTop: 'auto' }}
                            onClick={() => setSelectedJD(jd)}
                        >
                            <ExternalLink size={16} />
                            View Full Description
                        </button>
                    </div>
                ))}
            </div>

            {/* Detail Modal */}
            {selectedJD && (
                <div
                    className="modal-overlay"
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.8)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '2rem'
                    }} onClick={() => setSelectedJD(null)}>
                    <div className="card modal-content animate-fade-in" style={{
                        maxWidth: '800px',
                        width: '100%',
                        maxHeight: '90vh',
                        overflow: 'hidden',
                        position: 'relative',
                        padding: '0',
                        display: 'flex',
                        flexDirection: 'column'
                    }} onClick={e => e.stopPropagation()}>

                        {/* Modal Header */}
                        <div style={{ padding: '2rem 3rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '1.5rem' }}>Preview Job Description</h3>
                            <button
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    fontSize: '1.5rem'
                                }}
                                onClick={() => setSelectedJD(null)}
                            >
                                &times;
                            </button>
                        </div>

                        {/* Exportable Content Area */}
                        <div
                            ref={modalContentRef}
                            style={{
                                padding: '3rem',
                                overflowY: 'auto',
                                flexGrow: 1,
                                background: '#fff',
                                color: '#1e293b'
                            }}
                        >
                            <div style={{ marginBottom: '2.5rem', borderBottom: '2px solid #3b82f6', paddingBottom: '1.5rem' }}>
                                <h1 style={{ fontSize: '2.5rem', marginBottom: '0.75rem', color: '#0f172a' }}>{selectedJD.title}</h1>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', color: '#64748b', fontSize: '1rem' }}>
                                    <span><strong>Department:</strong> {selectedJD.department}</span>
                                    <span><strong>Experience:</strong> {selectedJD.experience}</span>
                                    <span><strong>Location:</strong> {selectedJD.location || 'Remote'}</span>
                                </div>
                            </div>
                            <div style={{
                                whiteSpace: 'pre-wrap',
                                lineHeight: '1.7',
                                color: '#334155',
                                fontSize: '1.1rem'
                            }}>
                                {selectedJD.content}
                            </div>
                        </div>

                        {/* Modal Footer (Action Buttons) - Not part of ref */}
                        <div style={{ padding: '1.5rem 3rem', background: 'var(--sidebar-bg)', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button className="btn" style={{ background: 'rgba(175, 205, 236, 0.7)' }} onClick={() => setSelectedJD(null)}>
                                Close
                            </button>
                            <button className="btn btn-primary" onClick={() => window.print()}>
                                <Printer size={18} /> Print
                            </button>
                            <button className="btn btn-accent" onClick={handleDownloadPDF}>
                                <Download size={18} /> Download PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistoryList;
