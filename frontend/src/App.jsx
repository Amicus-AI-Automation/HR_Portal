import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import GeneratorForm from './features/Generator/GeneratorForm';
import HistoryList from './features/History/HistoryList';
import Shortlister from './features/Shortlister/Shortlister';
import Candidates from './features/Candidates/Candidates';
import CandidateQuestions from './features/Questions/CandidateQuestions';
import './App.css';

function App() {
    const [activeTab, setActiveTab] = useState('generator');
    const [savedJDs, setSavedJDs] = useState([]);
    const [acceptedCandidates, setAcceptedCandidates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            try {
                // Fetch JDs
                const jdRes = await fetch('http://localhost:8000/jds');
                if (jdRes.ok) {
                    const jdData = await jdRes.json();
                    setSavedJDs(jdData.jds || []);
                }

                // Fetch Accepted Candidates
                const candRes = await fetch('http://localhost:8000/candidates');
                if (candRes.ok) {
                    const candData = await candRes.json();
                    setAcceptedCandidates(candData.candidates || []);
                }
            } catch (err) {
                console.error("Initial Fetch Error:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    const handleJDGenerated = async (newJD) => {
        // Save to Backend first, showing an alert if it fails
        try {
            const response = await fetch('http://localhost:8000/jds', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newJD.title || 'Untitled JD',
                    department: newJD.department || 'General',
                    experience: newJD.experience || 'Not Specified',
                    location: newJD.location || 'Remote',
                    content: newJD.content || 'Content empty'
                })
            });
            if (response.ok) {
                const result = await response.json();
                newJD.id = result.id; // Corrected ID from Mongo
                newJD.createdAt = newJD.createdAt || new Date().toISOString(); 
                // Only add to UI if successful
                setSavedJDs(prev => [newJD, ...prev]);
                setActiveTab('history');
            } else {
                const errBody = await response.text();
                alert(`Failed to save to MongoDB: ${response.status} ${errBody}`);
            }
        } catch (err) {
            console.error("Failed to save JD to DB:", err);
            alert(`Error connecting to MongoDB Backend: ${err.message}`);
        }
    };

    const handleAcceptCandidate = (candidate) => {
        // Prevent duplicates
        if (!acceptedCandidates.some(c => c.path === candidate.path)) {
            setAcceptedCandidates(prev => [candidate, ...prev]);
        }
    };

    const handleSaveQuestions = (candidatePath, questions) => {
        setAcceptedCandidates(prev => prev.map(c => 
            c.path === candidatePath ? { ...c, interviewQuestions: questions } : c
        ));
    };

    const getPageTitle = () => {
        switch (activeTab) {
            case 'dashboard': return 'Dashboard Overview';
            case 'generator': return 'Job Description Generator';
            case 'history': return 'Generated Job Descriptions';
            case 'shortlister': return 'AI Resume Shortlister';
            case 'candidates': return 'Candidate Management';
            case 'questions': return 'Interview Questions';
            case 'settings': return 'System Settings';
            default: return 'HR Portal';
        }
    };

    const renderContent = () => {
        if (activeTab === 'generator') {
            return <GeneratorForm onJDGenerated={handleJDGenerated} />; // Passed handleJDGenerated to GeneratorForm
        }

        if (activeTab === 'history') { // Added condition for history tab
            return <HistoryList jds={savedJDs} />; // Render HistoryList with savedJDs
        }

        if (activeTab === 'shortlister') {
            return <Shortlister jds={savedJDs} onAcceptCandidate={handleAcceptCandidate} />;
        }

        if (activeTab === 'candidates') {
            return <Candidates acceptedCandidates={acceptedCandidates} />;
        }

        if (activeTab === 'questions') {
            return <CandidateQuestions 
                acceptedCandidates={acceptedCandidates} 
                savedJDs={savedJDs} 
                onSaveQuestions={handleSaveQuestions}
            />;
        }

        return (
            <div className="card animate-fade-in" style={{ textAlign: 'center', padding: '4rem' }}>
                <h2 style={{ marginBottom: '1rem' }}>{getPageTitle()}</h2>
                <p style={{ color: 'var(--text-muted)' }}>This section is currently under development.</p>
                <button
                    className="btn btn-primary"
                    style={{ marginTop: '2rem' }}
                    onClick={() => setActiveTab('generator')}
                >
                    Go to Job Generator
                </button>
            </div>
        );
    };

    return (
        <div className="app-container">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            <main className="main-wrapper">
                <Navbar title={getPageTitle()} />

                <div className="content-area">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
}

export default App;
