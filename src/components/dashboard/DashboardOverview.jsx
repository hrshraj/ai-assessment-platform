import React from 'react';
import { motion } from 'framer-motion';
import { Users, FileCheck, Target, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import StatCard from './StatCard';
import ActivityFeed from './ActivityFeed';
import ProgressRing from './ProgressRing';

const data = [
    { name: 'Mon', active: 40, matches: 24 },
    { name: 'Tue', active: 30, matches: 139 },
    { name: 'Wed', active: 20, matches: 98 },
    { name: 'Thu', active: 27, matches: 39 },
    { name: 'Fri', active: 18, matches: 48 },
    { name: 'Sat', active: 23, matches: 38 },
    { name: 'Sun', active: 34, matches: 43 },
];

const DashboardOverview = () => {
    return (
        <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <StatCard 
                    title="Active Assessments" 
                    value="12" 
                    change={16.7} 
                    changeLabel="vs last week"
                    icon={FileCheck}
                    color="purple"
                    delay={0}
                />
                <StatCard 
                    title="Total Applicants" 
                    value="1,284" 
                    change={15}
                    changeLabel="vs last month"
                    icon={Users}
                    color="green"
                    delay={0.1}
                />
                <StatCard 
                    title="Avg. Match Rate" 
                    value="85%" 
                    change={5}
                    changeLabel="improvement"
                    icon={Target}
                    color="blue"
                    delay={0.2}
                />
                <StatCard 
                    title="Completed Today" 
                    value="23" 
                    change={8}
                    changeLabel="assessments"
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
                            Activity Trends
                        </h3>
                        <div className="flex space-x-2">
                            {['D', 'W', 'M'].map((t, index) => (
                                <button 
                                    key={t} 
                                    className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                                        t === 'W' 
                                            ? 'bg-purple-500/20 text-purple-300' 
                                            : 'text-gray-500 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 w-full h-full min-h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="colorMatches" x1="0" y1="0" x2="0" y2="1">
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
                                    dataKey="matches" 
                                    stroke="#8b5cf6" 
                                    strokeWidth={3} 
                                    fillOpacity={1} 
                                    fill="url(#colorMatches)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Progress Ring */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="p-6 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 flex flex-col items-center justify-center"
                >
                    <h3 className="text-lg font-semibold text-white mb-4">Completion Rate</h3>
                    <ProgressRing value={78} size={160} color="#8b5cf6" />
                    <p className="text-sm text-gray-400 mt-4 text-center">
                        Candidates completing all sections of the assessment
                    </p>
                </motion.div>
            </div>

            {/* Activity Feed */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
            >
                <ActivityFeed />
            </motion.div>
        </div>
    );
};

export default DashboardOverview;
