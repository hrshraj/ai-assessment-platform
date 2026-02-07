import React from 'react';
import { motion } from 'framer-motion';
import { Clock, UserPlus, FileCheck, Award, AlertCircle, CheckCircle } from 'lucide-react';

const activityIcons = {
    assessment_created: <FileCheck size={16} className="text-blue-400" />,
    candidate_completed: <CheckCircle size={16} className="text-green-400" />,
    candidate_joined: <UserPlus size={16} className="text-purple-400" />,
    award_given: <Award size={16} className="text-yellow-400" />,
    alert: <AlertCircle size={16} className="text-red-400" />,
};

const activityColors = {
    assessment_created: 'bg-blue-500/10 border-blue-500/20',
    candidate_completed: 'bg-green-500/10 border-green-500/20',
    candidate_joined: 'bg-purple-500/10 border-purple-500/20',
    award_given: 'bg-yellow-500/10 border-yellow-500/20',
    alert: 'bg-red-500/10 border-red-500/20',
};

const ActivityFeed = ({ activities = [], title = "Recent Activity", limit = 5 }) => {
    const sampleActivities = [
        { id: 1, type: 'candidate_joined', message: 'Sarah Connor joined as a candidate', time: '5 minutes ago' },
        { id: 2, type: 'assessment_created', message: 'New ML Engineer assessment created', time: '1 hour ago' },
        { id: 3, type: 'candidate_completed', message: 'Arjun Reddy completed assessment with 98%', time: '2 hours ago' },
        { id: 4, type: 'award_given', message: 'Arjun Reddy received "Top 1%" badge', time: '2 hours ago' },
        { id: 5, type: 'alert', message: 'Suspicious activity detected on assessment #123', time: '3 hours ago' },
    ];

    const displayActivities = activities.length > 0 ? activities.slice(0, limit) : sampleActivities.slice(0, limit);

    return (
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <button className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
                    View All
                </button>
            </div>

            <div className="space-y-3">
                {displayActivities.map((activity, index) => (
                    <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`flex items-start gap-3 p-3 rounded-xl border ${activityColors[activity.type]}`}
                    >
                        <div className="p-2 rounded-lg bg-white/5">
                            {activityIcons[activity.type]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">{activity.message}</p>
                            <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                <Clock size={12} />
                                <span>{activity.time}</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default ActivityFeed;
