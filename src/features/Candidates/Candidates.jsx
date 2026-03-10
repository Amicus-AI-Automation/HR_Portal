import React, { useState } from 'react';
import { Mail, Phone, ExternalLink, FileCheck, CheckCircle2, User, Award, ArrowLeft, HelpCircle } from 'lucide-react';

const Candidates = ({ acceptedCandidates }) => {
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    if (acceptedCandidates.length === 0) {
        return (
            <div className="card animate-fade-in" style={{ textAlign: 'center', padding: '5rem' }}>
                <div style={{ marginBottom: '1.5rem', opacity: 0.5 }}>
                    <User size={64} style={{ margin: '0 auto' }} />
                </div>
                <h3>No Accepted Candidates Yet</h3>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    Shortlist candidates and accept them to see them here.
                </p>
            </div>
        );
    }

    if (selectedCandidate) {
        return (
            <div className="candidate-profile-view animate-fade-in">
                <button 
                    className="btn" 
                    style={{ marginBottom: '1.5rem', background: 'rgba(188, 214, 246, 0.81)' }} 
                    onClick={() => setSelectedCandidate(null)}
                >
                    <ArrowLeft size={18} /> Back to Candidates
                </button>

                <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                    <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                        <h3 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                            <Award color="var(--accent-color)" size={24} />
                            Candidate Profile & Resume
                        </h3>
                    </div>

                    <div style={{ padding: '2.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 40%) 1fr', gap: '3rem', marginBottom: '3rem' }}>
                            {/* Left Side: Info */}
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ marginBottom: '2rem' }}>
                                    <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: '#fff' }}>{selectedCandidate.name}</h1>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--text-muted)', fontSize: '1rem', marginTop: '1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <Mail size={18} />
                                            <span>{selectedCandidate.email || 'N/A'}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <Phone size={18} />
                                            <span>{selectedCandidate.phone || 'N/A'}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <FileCheck size={18} />
                                            <span>Role Match: {selectedCandidate.jdTitle}</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    padding: '1.5rem',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border-color)',
                                    marginBottom: '2rem'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>ATS Match Score</span>
                                        <span style={{ fontSize: '1.8rem', fontWeight: '800', color: selectedCandidate.score > 85 ? 'var(--accent-color)' : 'var(--primary-color)' }}>
                                            {selectedCandidate.score}%
                                        </span>
                                    </div>
                                    <div style={{ height: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '5px', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${selectedCandidate.score}%`,
                                            background: selectedCandidate.score > 85 ? 'var(--accent-color)' : 'var(--primary-color)',
                                            transition: 'width 0.4s ease'
                                        }}></div>
                                    </div>
                                </div>

                                <div>
                                    <h4 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Award size={20} color="var(--accent-color)" /> AI Generated Match Summary
                                    </h4>
                                    <div style={{
                                        lineHeight: '1.7',
                                        color: 'var(--text-muted)',
                                        fontSize: '1rem',
                                        background: 'rgba(0,0,0,0.2)',
                                        padding: '1.5rem',
                                        borderRadius: '10px',
                                        borderLeft: '5px solid var(--accent-color)',
                                        marginBottom: '2rem'
                                    }}>
                                        {selectedCandidate.summary}
                                    </div>

                                    <h4 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <FileCheck size={20} color="var(--primary-color)" /> Job Description
                                    </h4>
                                    <div style={{
                                        lineHeight: '1.7',
                                        color: 'var(--text-muted)',
                                        fontSize: '0.9rem',
                                        background: 'rgba(0,0,0,0.2)',
                                        padding: '1.5rem',
                                        borderRadius: '10px',
                                        borderLeft: '5px solid var(--primary-color)',
                                        marginBottom: '2rem',
                                        whiteSpace: 'pre-wrap'
                                    }}>
                                        {selectedCandidate.job_description || "Job Description not available."}
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Resume Viewer */}
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <h4 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Uploaded Resume</h4>
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
                                            No PDF preview available.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Bottom Section: Questions (Full Width) */}
                        {selectedCandidate.interviewQuestions && selectedCandidate.interviewQuestions.length > 0 && (
                            <div className="animate-fade-in" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '3rem', marginTop: '1rem' }}>
                                <h4 style={{ fontSize: '1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <HelpCircle size={24} color="var(--primary-color)" /> Personalized Interview Questions
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    {selectedCandidate.interviewQuestions.map((q, i) => (
                                        <div key={i} style={{ 
                                            background: 'rgba(255,255,255,0.03)', 
                                            padding: '1.5rem', 
                                            borderRadius: '12px', 
                                            border: '1px solid var(--border-color)',
                                            fontSize: '1rem',
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
                </div>
            </div>
        );
    }

    return (
        <div className="candidates-container animate-fade-in">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.5rem' }}>
                {acceptedCandidates.map((candidate, index) => (
                    <div key={index} className="card candidate-card" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{candidate.name}</h3>
                                <span style={{ fontSize: '0.875rem', color: 'var(--primary-color)', fontWeight: '600' }}>Matched: {candidate.jdTitle}</span>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{candidate.department}</div>
                            </div>
                            <div style={{ padding: '0.25rem 0.75rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-color)', borderRadius: '12px', fontSize: '0.875rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <CheckCircle2 size={16} />
                                {candidate.score}%
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Mail size={14} />
                                <span>{candidate.email || 'N/A'}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Phone size={14} />
                                <span>{candidate.phone || 'N/A'}</span>
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
                            marginBottom: '1.5rem',
                            flexGrow: 1
                        }}>
                            {candidate.summary}
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40px', background: 'linear-gradient(transparent, var(--sidebar-bg))' }}></div>
                        </div>

                        <button
                            className="btn btn-primary"
                            style={{ width: '100%', marginTop: 'auto' }}
                            onClick={() => setSelectedCandidate(candidate)}
                        >
                            <FileCheck size={16} />
                            View Full Profile
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Candidates;
