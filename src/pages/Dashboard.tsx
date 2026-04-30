import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { TodaySchedule } from '../components/dashboard/TodaySchedule';
import { LiveClock } from '../components/dashboard/LiveClock';
import { Calendar, Video, PieChart, User } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Dashboard() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        cgpa: 0,
        credits: 0,
    });
    const [schedule, setSchedule] = useState<any[]>([]);
    const [ongoingClass, setOngoingClass] = useState<any>(null);

    // Grade point mapping
    const gradePoints: Record<string, number> = {
        'S': 10,
        'A': 9,
        'B': 8,
        'C': 7,
        'D': 6,
        'E': 5,
    };

    useEffect(() => {
        async function fetchDashboardData() {
            if (!user) return;

            try {
                const subjectsQuery = query(collection(db, 'subjects'), where('user_id', '==', user.uid));
                const subjectsSnapshot = await getDocs(subjectsQuery);
                const allSubjects = subjectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

                // Calculate total credits and CGPA
                let totalCredits = 0;
                let totalGradePoints = 0;

                if (allSubjects && allSubjects.length > 0) {
                    allSubjects.forEach((subject) => {
                        if (subject.grade && subject.credit) {
                            const credit = parseFloat(subject.credit);
                            const gradePoint = gradePoints[subject.grade] || 0;
                            totalCredits += credit;
                            totalGradePoints += gradePoint * credit;
                        }
                    });
                }

                const cgpa = totalCredits > 0 ? totalGradePoints / totalCredits : 0;

                setStats({
                    cgpa: parseFloat(cgpa.toFixed(2)),
                    credits: totalCredits,
                });

                // Fetch Schedule
                const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

                const basicQuery = query(collection(db, 'timetable_entries'), where('user_id', '==', user.uid), where('day', '==', today));
                const smartQuery = query(collection(db, 'smart_timetable_entries'), where('user_id', '==', user.uid), where('day', '==', today));
                
                const [basicSnapshot, smartSnapshot] = await Promise.all([
                    getDocs(basicQuery),
                    getDocs(smartQuery)
                ]);

                const basicData = basicSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
                const smartData = smartSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

                const allEntries = [...basicData, ...smartData];
                allEntries.sort((a, b) => a.start_time.localeCompare(b.start_time));

                setSchedule(allEntries);

                // Determine ongoing class
                const now = new Date();
                const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

                const current = allEntries.find(entry =>
                    entry.start_time <= currentTime && entry.end_time > currentTime
                );
                setOngoingClass(current || null);

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchDashboardData();
    }, [user]);

    if (loading) {
        return <div className="p-8 text-center">Loading dashboard...</div>;
    }

    return (
        <div className="space-y-8 pb-20 pt-10 lg:pt-0">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex flex-col gap-2">
                    <Link to="/profile" className="mb-2">
                        <div className="h-12 w-12 rounded-full overflow-hidden border bg-muted flex items-center justify-center hover:opacity-80 transition-opacity">
                            {user?.photoURL ? (
                                <img
                                    src={user.photoURL}
                                    alt="Profile"
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <span className="font-semibold text-lg">
                                    {user?.displayName?.charAt(0) || 'S'}
                                </span>
                            )}
                        </div>
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Hi, {user?.displayName?.split(' ')[0] || 'Student'}!
                    </h1>
                </div>
                <LiveClock />
            </div>

            {/* Top Row: Quick Actions + Ongoing Class */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Quick Actions Wrapper - Takes 2 cols on desktop (1 each) */}
                <div className="grid grid-cols-1 gap-4 lg:col-span-2">
                    <Link to="/timetable">
                        <div className="rounded-3xl bg-card p-6 shadow-sm border border-border/50 hover:shadow-md transition-all h-full flex flex-col justify-between group">
                            <div className="p-3 bg-secondary w-fit rounded-2xl text-primary mb-4 group-hover:scale-110 transition-transform">
                                <Calendar className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Check Schedule</h3>
                                <p className="text-sm text-muted-foreground mt-1">{schedule.length} classes today</p>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Ongoing Class - Takes 2 cols on desktop */}
                <div className="lg:col-span-2 h-full">
                    {ongoingClass ? (
                        <div className="rounded-3xl bg-gradient-to-br from-red-400 to-red-500 p-6 text-white shadow-lg relative overflow-hidden h-full flex flex-col justify-center">
                            <div className="relative z-10">
                                <div className="mb-6">
                                    <Video className="h-8 w-8 text-white/90" />
                                </div>
                                <h3 className="text-xl font-bold mb-1">Ongoing Class</h3>
                                <p className="text-white/90 font-medium mb-2">{ongoingClass.subject_name}</p>
                                <p className="text-white/80 text-sm">Ends at {ongoingClass.end_time.slice(0, 5)}</p>
                            </div>
                            {/* Decorative circles */}
                            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                            <div className="absolute -right-10 bottom-0 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                        </div>
                    ) : (
                        <div className="rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 p-6 text-foreground shadow-sm relative overflow-hidden h-full flex flex-col justify-center">
                            <div className="relative z-10">
                                <div className="mb-6">
                                    <Calendar className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-xl font-bold mb-1">No Ongoing Class</h3>
                                <p className="text-muted-foreground text-sm">Enjoy your free time!</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="rounded-3xl bg-card p-6 shadow-sm border border-border/50 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-sm text-muted-foreground">Current CGPA</h3>
                        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-primary">
                            <PieChart className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="text-4xl font-black tracking-tighter">{stats.cgpa.toFixed(2)}</div>
                </div>
                <div className="rounded-3xl bg-card p-6 shadow-sm border border-border/50 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-sm text-muted-foreground">Total Credits</h3>
                        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-primary">
                            <User className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="text-4xl font-black tracking-tighter">{stats.credits}</div>
                </div>
            </div>

            {/* Schedule List */}
            <TodaySchedule sessions={schedule} />
        </div>
    );
}
