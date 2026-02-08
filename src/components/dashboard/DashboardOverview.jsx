import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, FileCheck, Target, TrendingUp, Trash2 } from 'lucide-react';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import StatCard from './StatCard';
import ProgressRing from './ProgressRing';
import RecruiterService from '../../services/RecruiterService';

const DashboardOverview = ({ assessments = [], onRefresh }) => {
    const [deletingId, setDeletingId] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    const handleDelete = async (id) => {
        setDeletingId(id);
        try {
            await RecruiterService.deleteAssessment(id);
            setConfirmDeleteId(null);
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error('Failed to delete assessment:', err);
        } finally {
            setDeletingId(null);
        }
    };

    const totalAssessments = assessments.length;
    const totalQuestions = assessments.reduce((sum, a) => sum + (a.questionCount || 0), 0);

    // Build activity data from assessments (last 7 created)
    const activityData = assessments.slice(0, 7).map((a, idx) => {
        const date = a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-US', { weekday: 'short' }) : `Day ${idx + 1}`;
        return {
            name: date,
            questions: a.questionCount || 0,
        };
    }).reverse();

    // Fallback if no data
    const chartData = activityData.length > 0 ? activityData : [
        { name: 'No data', questions: 0 }
    ];

    return (
        <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <StatCard
                    title="Active Assessments"
                    value={String(totalAssessments)}
                    change={0}
                    changeLabel="total created"
                    icon={FileCheck}
                    color="purple"
                    delay={0}
                />
                <StatCard
                    title="Total Questions"
                    value={String(totalQuestions)}
                    change={0}
                    changeLabel="across assessments"
                    icon={Users}
                    color="green"
                    delay={0.1}
                />
                <StatCard
                    title="Avg Questions/Test"
                    value={totalAssessments > 0 ? String(Math.round(totalQuestions / totalAssessments)) : '0'}
                    change={0}
                    changeLabel="per assessment"
                    icon={Target}
                    color="blue"
                    delay={0.2}
                />
                <StatCard
                    title="Latest Assessment"
                    value={assessments.length > 0 ? (assessments[0].title?.substring(0, 15) || 'N/A') : 'None'}
                    change={0}
                    changeLabel={assessments.length > 0 && assessments[0].createdAt ? new Date(assessments[0].createdAt).toLocaleDateString() : ''}
                    icon={TrendingUp}
                    color="yellow"
                    delay={0.3}
                />
            </div>

            {/* Charts and Activity Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Activity Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-2 p-6 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10"
                >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <h3 className="text-lg font-semibold flex items-center text-white">
                            <TrendingUp className="mr-2 text-purple-400" size={20} />
                            Assessment Overview
                        </h3>
                    </div>

                    <div className="flex-1 w-full h-full min-h-[250px]">
                        {assessments.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                <p>Create your first assessment to see activity data here.</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorQuestions" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="name"
                                        stroke="#525252"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#525252"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#000',
                                            border: '1px solid #333',
                                            borderRadius: '8px'
                                        }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="questions"
                                        stroke="#8b5cf6"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorQuestions)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </motion.div>

                {/* Progress Ring */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="p-6 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 flex flex-col items-center justify-center"
                >
                    <h3 className="text-lg font-semibold text-white mb-4">Assessments Created</h3>
                    <ProgressRing value={Math.min(totalAssessments * 10, 100)} size={160} color="#8b5cf6" />
                    <p className="text-sm text-gray-400 mt-4 text-center">
                        {totalAssessments} assessment{totalAssessments !== 1 ? 's' : ''} with {totalQuestions} total questions
                    </p>
                </motion.div>
            </div>

            {/* Recent Assessments List */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
            >
                <div className="p-6 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-4">Your Assessments</h3>
                    {assessments.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No assessments created yet. Click the + button to create one.</p>
                    ) : (
                        <div className="space-y-3">
                            {assessments.map((a, idx) => (
                                <motion.div
                                    key={a.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 * idx }}
                                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-sm font-bold">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <h4 className="text-white font-medium">{a.title}</h4>
                                            <p className="text-gray-500 text-xs">
                                                {a.questionCount} questions · {a.durationMinutes}min · {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <span className="text-[10px] font-mono text-gray-600 bg-white/5 px-2 py-1 rounded">
                                            {a.id?.substring(0, 8)}...
                                        </span>
                                        {confirmDeleteId === a.id ? (
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => handleDelete(a.id)}
                                                    disabled={deletingId === a.id}
                                                    className="text-[10px] px-3 py-1.5 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
                                                >
                                                    {deletingId === a.id ? 'Deleting...' : 'Confirm'}
                                                </button>
                                                <button
                                                    onClick={() => setConfirmDeleteId(null)}
                                                    className="text-[10px] px-3 py-1.5 bg-white/5 border border-white/10 text-gray-400 rounded-lg hover:bg-white/10 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setConfirmDeleteId(a.id)}
                                                className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                title="Delete assessment"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default DashboardOverview;
