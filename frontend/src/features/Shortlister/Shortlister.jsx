import React, { useState, useEffect } from 'react';
import { Search, Users, FileCheck, Award, Mail, Phone, ExternalLink, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

const Shortlister = ({ jds, onAcceptCandidate }) => {
    const [candidates, setCandidates] = useState([]);
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [error, setError] = useState(null);
    const [selectedJdId, setSelectedJdId] = useState(jds[0]?.id || '');

    // State for candidate modal
    const [selectedCandidate, setSelectedCandidate] = useState(null);

    const handleScan = async () => {
        if (!selectedJdId && jds.length > 0) {
            setError("Please select a Job Description first.");
            return;
        }

        setIsScanning(true);
        setError(null);
        setCandidates([]);
        setScanProgress(10);

        try {
            const progressInterval = setInterval(() => {
                setScanProgress(prev => (prev < 90 ? prev + 5 : prev));
            }, 1000);

            const selectedJd = jds.find(j => j.id === parseInt(selectedJdId)) || jds[0];

            let response;
            try {
                response = await fetch('http://localhost:8000/shortlist', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        jd_text: selectedJd.content,
                        jd_id: selectedJd.id.toString() 
                    })
                });
            } catch (fetchErr) {
                clearInterval(progressInterval);
                throw new Error("Failed to connect. Make sure the Python backend is running:\n  cd resume_shortlister\n  python api_server.py");
            }

            if (!response.ok) {
                clearInterval(progressInterval);
                const body = await response.json().catch(() => ({}));
                const detail = body.detail;
                const msg = typeof detail === 'string'
                    ? detail
                    : Array.isArray(detail)
                        ? detail.map(d => d.msg || JSON.stringify(d)).join(', ')
                        : JSON.stringify(detail) || `Server returned HTTP ${response.status}`;
                throw new Error(msg);
            }

            const data = await response.json();
            clearInterval(progressInterval);
            setScanProgress(100);

            // Backend may return a warning if still initialising
            if (data.warning) {
                setError(`⚠️ ${data.warning}`);
                setIsScanning(false);
                return;
            }

            setCandidates(data.top_candidates || []);
        } catch (err) {
            setError(err.message);
            console.error("Shortlisting Error:", err);
        } finally {
            setIsScanning(false);
        }
    };


    return (
        <div className="shortlister-container animate-fade-in">
            <div className="card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <h3>Resume Intelligence Scanner</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Match resumes from your database against specific job descriptions using AI-powered ATS scoring.</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Select Job Description</label>
                        <select
                            className="form-input"
                            value={selectedJdId}
                            onChange={(e) => setSelectedJdId(e.target.value)}
                            disabled={isScanning}
                        >
                            {jds.length === 0 ? (
                                <option>No JDs generated yet</option>
                            ) : (
                                jds.map(jd => (
                                    <option key={jd.id} value={jd.id}>{jd.title} ({jd.department})</option>
                                ))
                            )}
                        </select>
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={handleScan}
                        disabled={isScanning || jds.length === 0}
                        style={{ height: '45px', minWidth: '180px' }}
                    >
                        {isScanning ? <RefreshCw className="animate-spin" size={18} /> : <Search size={18} />}
                        {isScanning ? 'Analyzing Resumes...' : 'Start AI Shortlisting'}
                    </button>
                </div>

                {isScanning && (
                    <div style={{ marginTop: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                            <span>Scanning 20+ resumes using OCR & Embeddings...</span>
                            <span>{scanProgress}%</span>
                        </div>
                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{
                                height: '100%',
                                width: `${scanProgress}%`,
                                background: 'linear-gradient(90deg, var(--primary-color), var(--accent-color))',
                                transition: 'width 0.4s ease'
                            }}></div>
                        </div>
                    </div>
                )}

                {error && (
                    <div style={{
                        marginTop: '1.5rem',
                        padding: '1rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid #ef4444',
                        borderRadius: '8px',
                        color: '#ef4444',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        fontSize: '0.875rem'
                    }}>
                        <AlertCircle size={18} />
                        <div>
                            <strong>Connection Error:</strong> {error}
                            <p style={{ fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.8 }}>Ensure you have started the Python Backend Service in the <code>resume_shortlister</code> directory.</p>
                        </div>
                    </div>
                )}
            </div>

            {candidates.length > 0 && (
                <div className="animate-fade-in">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <Award color="var(--accent-color)" size={24} />
                        <h2 style={{ fontSize: '1.5rem' }}>Top 10 Shortlisted Candidates</h2>
                    </div>

                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {candidates.map((candidate, index) => (
                            <div key={index} className="card" style={{
                                padding: '1.5rem',
                                display: 'grid',
                                gridTemplateColumns: '60px 1fr 180px',
                                gap: '1.5rem',
                                alignItems: 'center',
                                borderLeft: index < 3 ? '4px solid var(--accent-color)' : '1px solid var(--border-color)'
                            }}>
                                <div style={{
                                    width: '50px',
                                    height: '50px',
                                    borderRadius: '12px',
                                    background: index < 3 ? 'var(--accent-color)' : 'var(--primary-color)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.25rem',
                                    fontWeight: '700',
                                    color: 'white'
                                }}>
                                    #{index + 1}
                                </div>

                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                        <h4 style={{ fontSize: '1.125rem' }}>{candidate.name || 'Candidate ' + (index + 1)}</h4>
                                        {index < 3 && <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-color)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700' }}>BEST MATCH</span>}
                                    </div>
                                    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <Mail size={14} />
                                            <span>{candidate.email || 'n/a'}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <Phone size={14} />
                                            <span>{candidate.phone || 'n/a'}</span>
                                        </div>
                                    </div>
                                    <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: 'var(--text-main)', opacity: 0.8 }}>
                                        {candidate.summary}
                                    </p>
                                </div>

                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ marginBottom: '0.5rem' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>ATS MATCH SCORE</span>
                                        <span style={{ fontSize: '2rem', fontWeight: '800', color: candidate.score > 85 ? 'var(--accent-color)' : 'var(--primary-color)' }}>
                                            {candidate.score}%
                                        </span>
                                    </div>
                                    <button
                                        className="btn btn-primary"
                                        style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: 'auto' }}
                                        onClick={() => setSelectedCandidate(candidate)}
                                    >
                                        <FileCheck size={16} /> View Profile
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!isScanning && candidates.length === 0 && !error && (
                <div style={{ textAlign: 'center', padding: '5rem', opacity: 0.5 }}>
                    <Users size={64} style={{ margin: '0 auto 1.5rem' }} />
                    <h4>Ready to Scan</h4>
                    <p>Select a job description and click "Start AI Shortlisting" to process the resumes folder.</p>
                </div>
            )}

            {/* Candidate Details Modal */}
            {selectedCandidate && (
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
                        alignItems: 'flex-start',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '2rem',
                        paddingTop: '5vh',
                        overflowY: 'auto'
                    }} onClick={() => setSelectedCandidate(null)}>
                    <div className="card modal-content animate-fade-in" style={{
                        maxWidth: '1000px',
                        width: '100%',
                        position: 'relative',
                        padding: '0',
                        display: 'flex',
                        flexDirection: 'column'
                    }} onClick={e => e.stopPropagation()}>

                        {/* Modal Header */}
                        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                            <h3 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                                <Award color="var(--accent-color)" size={24} />
                                Candidate Profile & Resume
                            </h3>
                            <button
                                style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    border: 'none',
                                    color: 'var(--text-main)',
                                    cursor: 'pointer',
                                    fontSize: '1.5rem',
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                onClick={() => setSelectedCandidate(null)}
                                title="Close"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Content Area - 2 Columns */}
                        <div style={{ padding: '2rem', flexGrow: 1, color: 'var(--text-main)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 40%) 1fr', gap: '2rem', marginBottom: '2rem' }}>
                                {/* Left Column: Info */}
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#fff' }}>{selectedCandidate.name || 'Unknown Candidate'}</h1>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Mail size={16} />
                                                <span>{selectedCandidate.email || 'N/A'}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Phone size={16} />
                                                <span>{selectedCandidate.phone || 'N/A'}</span>
                                            </div>

                                        </div>
                                    </div>

                                    <div style={{
                                        background: 'rgba(255,255,255,0.03)',
                                        padding: '1.5rem',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)',
                                        marginBottom: '1.5rem'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>ATS Match Score</span>
                                            <span style={{ fontSize: '1.5rem', fontWeight: '800', color: selectedCandidate.score > 85 ? 'var(--accent-color)' : 'var(--primary-color)' }}>
                                                {selectedCandidate.score}%
                                            </span>
                                        </div>
                                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${selectedCandidate.score}%`,
                                                background: selectedCandidate.score > 85 ? 'var(--accent-color)' : 'var(--primary-color)',
                                                transition: 'width 0.4s ease'
                                            }}></div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Award size={18} color="var(--accent-color)" /> AI Generated Summary (Gemini 3.1)
                                        </h4>
                                        <div style={{
                                            lineHeight: '1.6',
                                            color: 'var(--text-muted)',
                                            fontSize: '0.95rem',
                                            background: 'rgba(0,0,0,0.2)',
                                            padding: '1rem',
                                            borderRadius: '8px',
                                            borderLeft: '4px solid var(--accent-color)'
                                        }}>
                                            {selectedCandidate.summary}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: PDF Viewer */}
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <h4 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Resume Document</h4>
                                    <div style={{ flexGrow: 1, border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', background: '#fff' }}>
                                        {selectedCandidate.file_url ? (
                                            <iframe
                                                src={selectedCandidate.file_url}
                                                width="100%"
                                                height="800px"
                                                style={{ border: 'none' }}
                                                title="Candidate Resume"
                                            />
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666' }}>
                                                Resume file path not available.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Section: Questions (Full Width) */}
                            {selectedCandidate.interviewQuestions && selectedCandidate.interviewQuestions.length > 0 && (
                                <div className="animate-fade-in" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2rem', marginTop: '1rem' }}>
                                    <h4 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <HelpCircle size={22} color="var(--primary-color)" /> Personalized Interview Questions
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        {selectedCandidate.interviewQuestions.map((q, i) => (
                                            <div key={i} style={{ 
                                                background: 'rgba(255,255,255,0.03)', 
                                                padding: '1.25rem', 
                                                borderRadius: '10px', 
                                                border: '1px solid var(--border-color)',
                                                fontSize: '0.95rem',
                                                lineHeight: '1.6',
                                                display: 'flex',
                                                gap: '1rem'
                                            }}>
                                                <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>Q{i+1}</span>
                                                <span>{q}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div style={{ padding: '1.5rem 2rem', background: 'var(--sidebar-bg)', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button
                                className="btn"
                                style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                                onClick={async () => {
                                    try {
                                        await fetch('http://localhost:8000/candidates/status', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                jd_id: selectedJdId.toString(),
                                                resume_path: selectedCandidate.path,
                                                status: 'rejected'
                                            })
                                        });
                                    } catch (err) {
                                        console.error("Status Update Failed:", err);
                                    }
                                    setCandidates(prev => prev.filter(c => c.path !== selectedCandidate.path));
                                    setSelectedCandidate(null);
                                }}
                            >
                                Reject Candidate
                            </button>
                            <button
                                className="btn btn-accent"
                                onClick={async () => {
                                    try {
                                        const jdInfo = jds.find(j => j.id.toString() === selectedJdId.toString());
                                        
                                        // Save status to DB
                                        await fetch('http://localhost:8000/candidates/status', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                jd_id: selectedJdId.toString(),
                                                resume_path: selectedCandidate.path,
                                                status: 'accepted'
                                            })
                                        });

                                        onAcceptCandidate({ 
                                            ...selectedCandidate, 
                                            jdTitle: jdInfo?.title || 'Unknown', 
                                            department: jdInfo?.department || 'Unknown' 
                                        });
                                    } catch (err) {
                                        console.error("Status Update Failed:", err);
                                    }
                                    setCandidates(prev => prev.filter(c => c.path !== selectedCandidate.path));
                                    setSelectedCandidate(null);
                                }}
                            >
                                <CheckCircle2 size={18} /> Accept Candidate
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Shortlister;
