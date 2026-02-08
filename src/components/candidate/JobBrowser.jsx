import React, { useState, useEffect, useCallback } from 'react';
import { Briefcase, Clock, ChevronRight, FileText, Building2, Loader2, RefreshCw } from 'lucide-react';
import CandidateService from '../../services/CandidateService';

const JobCard = ({ job, onApply }) => {
    return (
        <div className="w-full max-w-sm p-5 rounded-lg bg-[#0A0A0A] border border-white/10">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                        <Briefcase className="text-gray-300" size={20} />
                    </div>
                    <div>
                        <h3 className="text-white font-medium text-base">{job.title}</h3>
                        <p className="text-gray-500 text-sm">{job.companyName || 'Company'}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-2 mb-4">
                <div className="flex items-center text-gray-400 text-sm">
                    <Clock size={14} className="mr-2 text-gray-500" />
                    {job.durationMinutes} minutes
                </div>
                <div className="flex items-center text-gray-400 text-sm">
                    <FileText size={14} className="mr-2 text-gray-500" />
                    {job.questionCount} questions
                </div>
                <div className="flex items-center text-gray-400 text-sm">
                    <Building2 size={14} className="mr-2 text-gray-500" />
                    Posted {new Date(job.createdAt).toLocaleDateString()}
                </div>
            </div>

            <button
                onClick={onApply}
                className="w-full py-2.5 rounded-lg bg-white text-black font-medium text-sm flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
                Start Assessment <ChevronRight size={16} className="ml-1" />
            </button>
        </div>
    );
};

const JobBrowser = ({ onApply }) => {
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAssessments = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await CandidateService.getAssessments();
            setAssessments(data);
        } catch (err) {
            console.error('Error fetching assessments:', err);
            setError('Failed to load assessments. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAssessments();
    }, [fetchAssessments]);

    return (
        <div className="min-h-screen pt-24 px-8">
            <div className="mb-8 flex justify-between items-start">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Available Assessments</h2>
                    <p className="text-gray-400 text-sm">Browse and start assessments created by recruiters</p>
                </div>
                <button
                    onClick={fetchAssessments}
                    disabled={loading}
                    className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                    title="Refresh assessments"
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {loading && (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="text-purple-400 animate-spin mr-3" size={24} />
                    <span className="text-gray-400">Loading assessments...</span>
                </div>
            )}

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg text-center">
                    {error}
                </div>
            )}

            {!loading && !error && assessments.length === 0 && (
                <div className="text-center py-20">
                    <FileText className="text-gray-600 mx-auto mb-4" size={48} />
                    <h3 className="text-xl font-medium text-gray-400 mb-2">No assessments available</h3>
                    <p className="text-gray-500 text-sm">Check back later for new assessments from recruiters.</p>
                </div>
            )}

            <div className="flex flex-wrap gap-4">
                {assessments.map((assessment) => (
                    <JobCard key={assessment.id} job={assessment} onApply={() => onApply(assessment.id)} />
                ))}
            </div>
        </div>
    );
};

export default JobBrowser;
