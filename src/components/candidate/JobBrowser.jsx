import React from 'react';
import { Briefcase, MapPin, DollarSign, Clock, ChevronRight } from 'lucide-react';

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
                    <MapPin size={14} className="mr-2 text-gray-500" />
                    {job.location}
                </div>
                <div className="flex items-center text-gray-400 text-sm">
                    <DollarSign size={14} className="mr-2 text-gray-500" />
                    {job.salary}
                </div>
                <div className="flex items-center text-gray-400 text-sm">
                    <Clock size={14} className="mr-2 text-gray-500" />
                    {job.type}
                </div>
            </div>

            <button
                onClick={onApply}
                className="w-full py-2.5 rounded-lg bg-white text-black font-medium text-sm flex items-center justify-center"
            >
                Apply Now <ChevronRight size={16} className="ml-1" />
            </button>
        </div>
    );
};

const JobBrowser = ({ onApply }) => {
    const jobs = [
        { id: "react-sr-001", title: "Senior React Engineer", company: "TechCorp", location: "Remote", salary: "$120k - $180k", type: "Full-time" },
        { id: "ai-ml-002", title: "AI/ML Developer", company: "DataLabs", location: "San Francisco, CA", salary: "$150k - $220k", type: "Full-time" },
        { id: "fs-003", title: "Full Stack Developer", company: "WebSolutions", location: "New York, NY", salary: "$100k - $160k", type: "Full-time" },
        { id: "devops-004", title: "DevOps Engineer", company: "CloudSystems", location: "Austin, TX", salary: "$110k - $170k", type: "Full-time" },
        { id: "fe-005", title: "Frontend Developer", company: "DesignStudio", location: "Los Angeles, CA", salary: "$90k - $140k", type: "Full-time" },
        { id: "be-006", title: "Backend Engineer", company: "ServerPro", location: "Seattle, WA", salary: "$120k - $180k", type: "Full-time" },
    ];

    return (
        <div className="min-h-screen pt-24 px-8">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">Job Opportunities</h2>
                <p className="text-gray-400 text-sm">Browse available positions and apply</p>
            </div>

            <div className="flex flex-wrap gap-4">
                {jobs.map((job, idx) => (
                    <JobCard key={idx} job={job} onApply={() => onApply(job.id)} />
                ))}
            </div>
        </div>
    );
};

export default JobBrowser;
