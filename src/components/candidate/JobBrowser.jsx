import React, { useState, useEffect } from 'react';
import { Briefcase, Clock, ChevronRight, Users, Loader2 } from 'lucide-react';
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
                        <p className="text-gray-500 text-sm">{job.company}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-2 mb-4">
                <div className="flex items-center text-gray-400 text-sm">
                    <Clock size={14} className="mr-2 text-gray-500" />
                    {job.durationMinutes} minutes | {job.questionCount} questions
                </div>
                <div className="flex items-center text-gray-400 text-sm">
                    <Users size={14} className="mr-2 text-gray-500" />
                    {job.applicants} applicant{job.applicants !== 1 ? 's' : ''}
                </div>
            </div>

            <button
                onClick={onApply}
                className="w-full py-2.5 rounded-lg bg-white text-black font-medium text-sm flex items-center justify-center"
            >
                Take Assessment <ChevronRight size={16} className="ml-1" />
            </button>
        </div>
    );
};

const JobBrowser = ({ onApply }) => {
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAssessments = async () => {
            try {
                const data = await CandidateService.getAssessments();
                setAssessments(data);
            } catch (err) {
                console.error('Failed to load assessments:', err);
                setError('Failed to load assessments');
            } finally {
                setLoading(false);
            }
        };
        fetchAssessments();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen pt-24 px-8 flex items-center justify-center">
                <Loader2 className="animate-spin text-white" size={32} />
                <span className="ml-3 text-gray-400">Loading assessments...</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 px-8">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">Available Assessments</h2>
                <p className="text-gray-400 text-sm">Browse available assessments and start your evaluation</p>
            </div>

            {error && (
                <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                </div>
            )}

            {assessments.length === 0 && !error ? (
                <div className="text-center py-16">
                    <Briefcase className="mx-auto text-gray-600 mb-4" size={48} />
                    <p className="text-gray-400">No assessments available yet.</p>
                </div>
            ) : (
                <div className="flex flex-wrap gap-4">
                    {assessments.map((job) => (
                        <JobCard key={job.id} job={job} onApply={() => onApply(job.id)} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default JobBrowser;
