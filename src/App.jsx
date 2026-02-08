import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Hero from './components/Hero';
import About from './components/About';
import Contact from './components/Contact';
import DashboardLayout from './components/dashboard/DashboardLayout';
import RecruiterLogin from './components/RecruiterLogin';
import RecruiterJoin from './components/RecruiterJoin';
import CandidateLogin from './components/candidate/CandidateLogin';
import CandidateJoin from './components/candidate/CandidateJoin';
import CandidateDashboard from './components/candidate/CandidateDashboard';
import JobBrowser from './components/candidate/JobBrowser';
import FeedbackPage from './components/candidate/FeedbackPage';
import AssessmentLayout from './components/assessment/AssessmentLayout';
import ErrorBoundary from './components/ErrorBoundary';
import HowItWorks from './components/HowItWorks';
import PlatformFeatures from './components/PlatformFeatures';

const ParticleBackground = () => (
  <div className="fixed inset-0 pointer-events-none z-0">
    <div className="absolute inset-0 bg-[#000000]"></div>
    <div className="absolute inset-0 opacity-30 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
    {/* Simple starfield simulation */}
    {[...Array(50)].map((_, i) => (
      <div
        key={i}
        className="absolute rounded-full bg-white opacity-40 animate-pulse"
        style={{
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
          width: `${Math.random() * 3}px`,
          height: `${Math.random() * 3}px`,
          animationDelay: `${Math.random() * 5}s`
        }}
      />
    ))}
  </div>
);

function App() {
  // Views: 'landing', 'dashboard' (recruiter), 'recruiter-login', 'recruiter-join', 'candidate-login', 'candidate-join', 'candidate-browse', 'candidate-dashboard', 'candidate-feedback', 'assessment'
  const [view, setView] = useState('landing');
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Recruiter
  const [isCandidateAuth, setIsCandidateAuth] = useState(false); // Candidate
  const [activeAssessmentId, setActiveAssessmentId] = useState(null);

  // Page Transition Variants (Anti-Gravity)
  const pageVariants = {
    initial: { scale: 0.8, opacity: 0, zIndex: -10 },
    animate: { scale: 1, opacity: 1, zIndex: 1, transition: { duration: 0.8, ease: "circOut" } },
    exit: { scale: 1.2, opacity: 0, zIndex: 10, transition: { duration: 0.8, ease: "circIn" } }
  };

  const handleRecruiterLogin = () => {
    setIsAuthenticated(true);
    setView('dashboard');
  };

  const handleRecruiterJoin = () => {
    setIsAuthenticated(true);
    setView('dashboard');
  };

  const handleCandidateLogin = () => {
    setIsCandidateAuth(true);
    setView('candidate-browse');
  };

  const handleCandidateJoin = () => {
    setIsCandidateAuth(true);
    setView('candidate-browse');
  };

  // Helper to wrap content in motion div
  const PageWrapper = ({ children }) => (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="w-full h-full absolute inset-0 overflow-y-auto overflow-x-hidden"
    >
      {children}
    </motion.div>
  );

  return (
    <div className="relative min-h-screen w-full bg-black text-white selection:bg-purple-500/30 overflow-hidden font-sans">
      <ParticleBackground />

      {/* Dynamic Navbar based on view */}
      <div className="fixed top-0 left-0 w-full z-50">
        <Navbar onLogin={(type) => {
          if (type === 'candidate') setView('candidate-login');
          else if (type === 'recruiter') setView('recruiter-login');
          else setView('landing');
        }} onJoin={(type) => {
          if (type === 'candidate') setView('candidate-join');
          else if (type === 'recruiter') setView('recruiter-join');
          else setView('landing');
        }} onNavigate={(page) => setView(page)} />

        {/* Candidate Sub-nav (only visible in candidate flow) */}
        {view.startsWith('candidate-') && view !== 'candidate-login' && view !== 'candidate-join' && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 flex space-x-2 bg-white/5 backdrop-blur-md rounded-full p-1 border border-white/10 z-50">
            {['browse', 'dashboard', 'feedback'].map(sub => (
              <button
                key={sub}
                onClick={() => setView(`candidate-${sub}`)}
                className={`text-xs px-4 py-2 rounded-full transition-all ${view === `candidate-${sub}` ? 'bg-white text-black font-bold' : 'text-gray-400 hover:text-white'}`}
              >
                {sub.charAt(0).toUpperCase() + sub.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* LANDING PAGE */}
        {view === 'landing' && (
          <PageWrapper key="landing">
            <div className="pt-20"><Hero /></div>
            <HowItWorks />
            <PlatformFeatures />
            <Footer onNavigate={(page) => setView(page)} />
          </PageWrapper>
        )}

        {/* ABOUT PAGE */}
        {view === 'about' && (
          <PageWrapper key="about">
            <About />
            <Footer onNavigate={(page) => setView(page)} />
          </PageWrapper>
        )}

        {/* CONTACT PAGE */}
        {view === 'contact' && (
          <PageWrapper key="contact">
            <Contact />
            <Footer onNavigate={(page) => setView(page)} />
          </PageWrapper>
        )}

        {/* RECRUITER ROUTES */}
        {view === 'recruiter-login' && (
          <PageWrapper key="recruiter-login">
            <RecruiterLogin onLogin={handleRecruiterLogin} onSwitchToJoin={() => setView('recruiter-join')} />
            <Footer onNavigate={(page) => setView(page)} />
          </PageWrapper>
        )}

        {view === 'recruiter-join' && (
          <PageWrapper key="recruiter-join">
            <RecruiterJoin onJoin={handleRecruiterJoin} onSwitchToLogin={() => setView('recruiter-login')} />
            <Footer onNavigate={(page) => setView(page)} />
          </PageWrapper>
        )}

        {view === 'dashboard' && (
          <PageWrapper key="recruiter-dashboard">
            <ErrorBoundary>
              <DashboardLayout onLogout={() => { setIsAuthenticated(false); setView('landing'); }} />
            </ErrorBoundary>
            <Footer onNavigate={(page) => setView(page)} />
          </PageWrapper>
        )}

        {/* CANDIDATE ROUTES */}
        {view === 'candidate-login' && (
          <PageWrapper key="candidate-login">
            <CandidateLogin onLogin={handleCandidateLogin} onSwitchToJoin={() => setView('candidate-join')} />
            <Footer onNavigate={(page) => setView(page)} />
          </PageWrapper>
        )}

        {view === 'candidate-join' && (
          <PageWrapper key="candidate-join">
            <CandidateJoin onJoin={handleCandidateJoin} onSwitchToLogin={() => setView('candidate-login')} />
            <Footer onNavigate={(page) => setView(page)} />
          </PageWrapper>
        )}

        {view === 'candidate-browse' && (
          <PageWrapper key="candidate-browse">
            <JobBrowser onApply={(id) => {
              setActiveAssessmentId(id);
              setView('assessment');
            }} />
            <Footer onNavigate={(page) => setView(page)} />
          </PageWrapper>
        )}

        {view === 'candidate-dashboard' && (
          <PageWrapper key="candidate-dashboard">
            <CandidateDashboard onLogout={() => { setIsCandidateAuth(false); setView('landing'); }} />
            <Footer onNavigate={(page) => setView(page)} />
          </PageWrapper>
        )}

        {view === 'candidate-feedback' && (
          <PageWrapper key="candidate-feedback">
            <FeedbackPage />
            <Footer onNavigate={(page) => setView(page)} />
          </PageWrapper>
        )}

        {/* ASSESSMENT ARENA ROUTE */}
        {view === 'assessment' && (
          <PageWrapper key="assessment">
            <AssessmentLayout assessmentId={activeAssessmentId} />
            <Footer onNavigate={(page) => setView(page)} />
          </PageWrapper>
        )}


      </AnimatePresence>
    </div>
  );
}

export default App;
