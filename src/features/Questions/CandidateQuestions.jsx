import React, { useState, useEffect } from 'react';
import { User, HelpCircle, Sparkles, RefreshCw, CheckCircle2, Copy, FileText, ChevronRight } from 'lucide-react';

const CandidateQuestions = ({ acceptedCandidates, savedJDs, onSaveQuestions }) => {
    const [selectedCandidatePath, setSelectedCandidatePath] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [questions, setQuestions] = useState([]);
    const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
    const [error, setError] = useState(null);
    const [saveStatus, setSaveStatus] = useState(null); // 'saving', 'copied', 'saved'

    // Load existing questions when candidate is selected
    useEffect(() => {
        if (!selectedCandidatePath) {
            setQuestions([]);
            setSelectedQuestionIds([]);
            return;
        }

        const candidate = acceptedCandidates.find(c => c.path === selectedCandidatePath);
        if (candidate?.interviewQuestions) {
            setQuestions(candidate.interviewQuestions);
            setSelectedQuestionIds(candidate.interviewQuestions.map((_, i) => i));
        } else {
            setQuestions([]);
            setSelectedQuestionIds([]);
        }
    }, [selectedCandidatePath, acceptedCandidates]);

    const handleGenerate = async () => {
        if (!selectedCandidatePath) return;

        const candidate = acceptedCandidates.find(c => c.path === selectedCandidatePath);
        // Find matching JD by title/department to get the full content
        const jd = savedJDs.find(j => j.title === candidate.jdTitle && j.department === candidate.department) || savedJDs[0];

        if (!jd) {
            setError("Could not find the matching Job Description for this candidate.");
            return;
        }

        setIsGenerating(true);
        setError(null);
        setQuestions([]);
        setSelectedQuestionIds([]);

        try {
            const response = await fetch('http://localhost:8000/generate-questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    resume_path: candidate.path,
                    jd_text: jd.content,
                    jd_id: jd.id.toString(),
                    candidate_name: candidate.name
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || "Server error generating questions.");
            }

            const data = await response.json();
            setQuestions(data.questions || []);
        } catch (err) {
            setError(err.message);
            console.error("Question Generation Error:", err);
        } finally {
            setIsGenerating(false);
        }
    };

    const toggleQuestion = (index) => {
        setSelectedQuestionIds(prev => 
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };

    const copySelected = () => {
        const selectedText = selectedQuestionIds
            .map(id => questions[id])
            .join('\n\n');
        navigator.clipboard.writeText(selectedText);
        setSaveStatus('copied');
        setTimeout(() => setSaveStatus(null), 2000);
    };

    const handleSave = () => {
        const selectedQuestions = selectedQuestionIds.map(id => questions[id]);
        onSaveQuestions(selectedCandidatePath, selectedQuestions);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(null), 3000);
    };

    return (
        <div className="questions-container animate-fade-in">
            <div className="card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <HelpCircle color="var(--primary-color)" size={24} />
                    <h3>Interview Question Generator</h3>
                </div>
                
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                    Generate personalized, Gemini-powered interview questions based on the candidate's actual resume and the job description they applied for.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Select a Shortlisted Candidate</label>
                        <select 
                            className="form-input" 
                            value={selectedCandidatePath} 
                            onChange={(e) => setSelectedCandidatePath(e.target.value)}
                            disabled={isGenerating}
                        >
                            <option value="">-- Choose a Candidate --</option>
                            {acceptedCandidates.map(c => (
                                <option key={c.path} value={c.path}>
                                    {c.name} ({c.jdTitle})
                                </option>
                            ))}
                        </select>
                    </div>
                    <button 
                        className="btn btn-primary" 
                        onClick={handleGenerate} 
                        disabled={!selectedCandidatePath || isGenerating}
                        style={{ height: '45px', minWidth: '220px' }}
                    >
                        {isGenerating ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />}
                        {isGenerating ? 'AI is Thinking...' : 'Generate Questions'}
                    </button>
                </div>

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
                        <HelpCircle size={18} />
                        {error}
                    </div>
                )}
            </div>

            {questions.length > 0 && (
                <div className="animate-fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h4 style={{ fontSize: '1.25rem' }}>Generated Questions ({questions.length})</h4>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            {saveStatus === 'copied' && <span style={{ color: 'var(--accent-color)', fontSize: '0.875rem', fontWeight: 'bold' }}>Copied to Clipboard!</span>}
                            {saveStatus === 'saved' && <span style={{ color: 'var(--accent-color)', fontSize: '0.875rem', fontWeight: 'bold' }}>Saved to Profile!</span>}
                            
                            {selectedQuestionIds.length > 0 && (
                                <>
                                    <button className="btn" style={{ background: 'rgba(255,255,255,0.05)' }} onClick={copySelected}>
                                        <Copy size={16} /> Copy
                                    </button>
                                    <button className="btn btn-accent" onClick={handleSave}>
                                        <CheckCircle2 size={16} /> Save to Candidate Profile
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {questions.map((q, index) => (
                            <div 
                                key={index} 
                                className="card" 
                                style={{ 
                                    padding: '1.25rem', 
                                    cursor: 'pointer', 
                                    border: selectedQuestionIds.includes(index) ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                                    background: selectedQuestionIds.includes(index) ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.02)',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '1rem'
                                }}
                                onClick={() => toggleQuestion(index)}
                            >
                                <div style={{ 
                                    width: '24px', 
                                    height: '24px', 
                                    borderRadius: '50%', 
                                    border: '2px solid', 
                                    borderColor: selectedQuestionIds.includes(index) ? 'var(--accent-color)' : 'var(--border-color)',
                                    background: selectedQuestionIds.includes(index) ? 'var(--accent-color)' : 'transparent',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    marginTop: '0.2rem'
                                }}>
                                    {selectedQuestionIds.includes(index) && <CheckCircle2 size={14} color="white" />}
                                </div>
                                <div style={{ fontSize: '1rem', lineHeight: '1.5', flexGrow: 1 }}>
                                    {q}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!isGenerating && questions.length === 0 && !error && (
                <div style={{ textAlign: 'center', padding: '5rem', opacity: 0.3 }}>
                    <FileText size={48} style={{ margin: '0 auto 1rem' }} />
                    <p>Selection a candidate and click generate to see AI interview questions.</p>
                </div>
            )}
        </div>
    );
};

export default CandidateQuestions;
