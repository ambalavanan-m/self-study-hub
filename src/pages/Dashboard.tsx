import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { LiveClock } from '../components/dashboard/LiveClock';
import { 
    GraduationCap, 
    Award, 
    BookOpen, 
    BarChart3, 
    User, 
    TrendingUp, 
    CheckCircle2, 
    ChevronRight, 
    PieChart, 
    Layers, 
    ArrowUpRight,
    ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { 
    calculateCGPA, 
    calculateGPA, 
    calculateGradeDistribution, 
    TOTAL_CURRICULUM_CREDITS,
    type Semester, 
    type Subject,
    type Grade
} from '../lib/cgpa';
import { type CourseMarkEntry } from '../lib/marks';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';

export function Dashboard() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [courseMarks, setCourseMarks] = useState<CourseMarkEntry[]>([]);

    useEffect(() => {
        async function fetchDashboardData() {
            if (!user) return;

            try {
                // 1. Fetch Semesters & Subjects (for CGPA, Curriculum & Grades)
                const semestersQuery = query(collection(db, 'semesters'), where('user_id', '==', user.uid));
                const subjectsQuery = query(collection(db, 'subjects'), where('user_id', '==', user.uid));
                const marksQuery = query(collection(db, 'course_marks'), where('user_id', '==', user.uid));

                const [semestersSnapshot, subjectsSnapshot, marksSnapshot] = await Promise.all([
                    getDocs(semestersQuery),
                    getDocs(subjectsQuery),
                    getDocs(marksQuery)
                ]);

                const semestersData = semestersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                const subjectsData = subjectsSnapshot.docs.map(doc => ({ 
                    id: doc.id, 
                    ...doc.data(),
                    credit: Number((doc.data() as any).credit) || 0
                })) as (Subject & { semester_id: string })[];

                const combinedSemesters = semestersData.map(sem => ({
                    ...sem,
                    subjects: subjectsData.filter((sub) => sub.semester_id === sem.id)
                })) as unknown as Semester[];

                // Sort semesters chronologically: Year ascending, then Term
                const termOrder = { 'Winter': 0, 'Spring': 1, 'Summer': 2, 'Fall': 3 };
                combinedSemesters.sort((a, b) => {
                    if (a.year !== b.year) return a.year - b.year;
                    return (termOrder[a.term as keyof typeof termOrder] || 0) - (termOrder[b.term as keyof typeof termOrder] || 0);
                });

                setSemesters(combinedSemesters);

                // 2. Fetch Course Marks
                const marksData = marksSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as CourseMarkEntry[];

                setCourseMarks(marksData);

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchDashboardData();
    }, [user]);

    // Derived Academic Computations
    const allSubjects = useMemo(() => semesters.flatMap(s => s.subjects), [semesters]);

    // 1. CGPA & Total Credits
    const cgpa = useMemo(() => calculateCGPA(semesters), [semesters]);
    
    const completedCredits = useMemo(() => {
        let total = 0;
        allSubjects.forEach(sub => {
            if (sub.grade !== 'A_ABSENT' && sub.grade !== 'F' && sub.grade !== 'N') {
                total += Number(sub.credit) || 0;
            }
        });
        return total;
    }, [allSubjects]);

    // 2. Grade Distribution
    const gradeDistribution = useMemo(() => calculateGradeDistribution(allSubjects), [allSubjects]);
    const totalGradesCount = useMemo(() => Object.values(gradeDistribution).reduce((a, b) => a + b, 0), [gradeDistribution]);
    const topGradesCount = (gradeDistribution.S || 0) + (gradeDistribution.A || 0);
    const topGradesPercentage = totalGradesCount > 0 ? ((topGradesCount / totalGradesCount) * 100).toFixed(0) : '0';

    // 3. Curriculum Basket Progress
    const basketStats = useMemo(() => {
        const baskets = {
            discipline_core: { label: 'Core (DC)', completed: 0, required: 60, color: 'bg-emerald-500' },
            discipline_elective: { label: 'Elective (DE)', completed: 0, required: 24, color: 'bg-sky-500' },
            project_internship: { label: 'Projects (PI)', completed: 0, required: 2, color: 'bg-indigo-500' },
            open_elective: { label: 'Open Elective (OE)', completed: 0, required: 12, color: 'bg-amber-500' },
            other: { label: 'Others / SEC', completed: 0, required: 22, color: 'bg-purple-500' }
        };

        allSubjects.forEach(sub => {
            if (sub.grade === 'A_ABSENT' || sub.grade === 'F' || sub.grade === 'N') return;
            const cred = Number(sub.credit) || 0;
            const b = sub.basket;
            if (b === 'discipline_core') baskets.discipline_core.completed += cred;
            else if (b === 'discipline_elective') baskets.discipline_elective.completed += cred;
            else if (b === 'project_internship') baskets.project_internship.completed += cred;
            else if (b === 'open_elective') baskets.open_elective.completed += cred;
            else baskets.other.completed += cred;
        });

        return baskets;
    }, [allSubjects]);

    // 4. Marks Average & Status
    const averageMarks = useMemo(() => {
        if (courseMarks.length === 0) return 0;
        const sum = courseMarks.reduce((acc, c) => acc + (Number(c.total_marks) || 0), 0);
        return (sum / courseMarks.length).toFixed(1);
    }, [courseMarks]);

    // 5. Semester GPA Progression list
    const semesterGPAs = useMemo(() => {
        return semesters.map((sem) => ({
            id: sem.id,
            name: `${sem.term} '${String(sem.year).slice(-2)}`,
            fullName: `${sem.term} ${sem.year}`,
            gpa: calculateGPA(sem.subjects),
            credits: sem.subjects.reduce((sum, s) => sum + (Number(s.credit) || 0), 0),
            courseCount: sem.subjects.length
        }));
    }, [semesters]);

    // Academic Standing label
    const academicStanding = useMemo(() => {
        if (cgpa >= 9.0) return { label: 'Distinction / Outstanding', badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' };
        if (cgpa >= 8.0) return { label: 'First Class with Distinction', badge: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30' };
        if (cgpa >= 7.0) return { label: 'First Class', badge: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30' };
        if (cgpa >= 6.0) return { label: 'Second Class', badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' };
        return { label: 'Active Academic Standing', badge: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30' };
    }, [cgpa]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
                <div className="h-8 w-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-muted-foreground font-medium">Loading your academic hub...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-28 pt-2">
            <SEO 
                title="Academic Dashboard | StudyTrack" 
                description="Comprehensive student command center. Track CGPA, internal marks, degree curriculum audit, and grade distribution."
            />

            {/* Header Greeting & Identity */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 glass rounded-3xl border border-white/20 shadow-sm relative overflow-hidden">
                <div className="flex items-center gap-4 z-10">
                    <Link to="/profile" className="group">
                        <div className="h-14 w-14 rounded-2xl overflow-hidden border-2 border-primary/20 bg-primary/10 flex items-center justify-center group-hover:scale-105 transition-all shadow-sm">
                            {user?.photoURL ? (
                                <img
                                    src={user.photoURL}
                                    alt="Profile"
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <span className="font-black text-xl text-primary">
                                    {user?.displayName?.charAt(0) || 'S'}
                                </span>
                            )}
                        </div>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                                Welcome, {user?.displayName?.split(' ')[0] || 'Student'}!
                            </h1>
                            <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold border", academicStanding.badge)}>
                                {academicStanding.label}
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Here is your overall academic progress across all semesters and courses.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 z-10 w-full sm:w-auto justify-between sm:justify-end">
                    <LiveClock />
                    <Link to="/profile">
                        <Button variant="ghost" size="sm" className="rounded-xl text-xs flex items-center gap-1.5 hover:bg-muted/60">
                            <User className="h-3.5 w-3.5" />
                            <span>Profile</span>
                        </Button>
                    </Link>
                </div>

                {/* Subtle decorative glow */}
                <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
            </div>

            {/* Top 4 Core Metrics Grid — Linking to Each Active Tab */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. CGPA Metric (links to /cgpa) */}
                <Link to="/cgpa" className="group">
                    <Card className="p-5 border border-white/10 hover:border-primary/50 transition-all h-full flex flex-col justify-between group-hover:shadow-md">
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Overall CGPA</span>
                                <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <GraduationCap className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black tracking-tight text-foreground">{cgpa.toFixed(2)}</span>
                                <span className="text-xs font-medium text-muted-foreground">/ 10.0</span>
                            </div>
                            <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden mt-3">
                                <div 
                                    className="h-full bg-primary rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, (cgpa / 10) * 100)}%` }}
                                />
                            </div>
                        </div>
                        <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-primary font-semibold mt-3">
                            <span>{semesters.length} Semesters Recorded</span>
                            <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </div>
                    </Card>
                </Link>

                {/* 2. Degree Audit & Credits (links to /curriculum) */}
                <Link to="/curriculum" className="group">
                    <Card className="p-5 border border-white/10 hover:border-sky-500/50 transition-all h-full flex flex-col justify-between group-hover:shadow-md">
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Degree Completion</span>
                                <div className="h-9 w-9 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <BookOpen className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black tracking-tight text-foreground">{completedCredits}</span>
                                <span className="text-xs font-medium text-muted-foreground">/ {TOTAL_CURRICULUM_CREDITS} Credits</span>
                            </div>
                            <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden mt-3">
                                <div 
                                    className="h-full bg-sky-500 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, (completedCredits / TOTAL_CURRICULUM_CREDITS) * 100)}%` }}
                                />
                            </div>
                        </div>
                        <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-sky-500 font-semibold mt-3">
                            <span>{((completedCredits / TOTAL_CURRICULUM_CREDITS) * 100).toFixed(1)}% Degree Completed</span>
                            <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </div>
                    </Card>
                </Link>

                {/* 3. Internal Marks Tracker (links to /marks) */}
                <Link to="/marks" className="group">
                    <Card className="p-5 border border-white/10 hover:border-emerald-500/50 transition-all h-full flex flex-col justify-between group-hover:shadow-md">
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Course Marks</span>
                                <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Award className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black tracking-tight text-foreground">{courseMarks.length}</span>
                                <span className="text-xs font-medium text-muted-foreground">Active Courses</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-3 truncate">
                                {courseMarks.length > 0 ? `Average Total: ${averageMarks}/100` : 'Track CAT & FAT assessment scores'}
                            </p>
                        </div>
                        <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-emerald-500 font-semibold mt-3">
                            <span>Assessments & FAT</span>
                            <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </div>
                    </Card>
                </Link>

                {/* 4. Grade Excellence (links to /grades-view) */}
                <Link to="/grades-view" className="group">
                    <Card className="p-5 border border-white/10 hover:border-amber-500/50 transition-all h-full flex flex-col justify-between group-hover:shadow-md">
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Grade Excellence</span>
                                <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <BarChart3 className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black tracking-tight text-foreground">{topGradesCount}</span>
                                <span className="text-xs font-medium text-muted-foreground">S & A Grades</span>
                            </div>
                            <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden mt-3">
                                <div 
                                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                                    style={{ width: `${topGradesPercentage}%` }}
                                />
                            </div>
                        </div>
                        <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-amber-500 font-semibold mt-3">
                            <span>{topGradesPercentage}% of all subjects</span>
                            <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </div>
                    </Card>
                </Link>
            </div>

            {/* Two Column Layout: Semester Progression & Grade Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Semester-by-Semester GPA Progression */}
                <Card className="lg:col-span-7 p-6 border border-white/10 flex flex-col justify-between space-y-6">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-primary" />
                                    <span>Semester GPA Progression</span>
                                </h2>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Chronological grade point average across your semesters
                                </p>
                            </div>
                            <Link to="/cgpa">
                                <Button variant="ghost" size="sm" className="text-xs text-primary flex items-center gap-1 hover:bg-primary/10">
                                    <span>Manage CGPA</span>
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                            </Link>
                        </div>

                        {semesterGPAs.length === 0 ? (
                            <div className="text-center py-12 glass rounded-2xl border border-white/10 p-6 space-y-3">
                                <p className="text-sm text-muted-foreground">No semesters added yet.</p>
                                <Link to="/cgpa">
                                    <Button size="sm">Add Your First Semester</Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {semesterGPAs.map((sem, idx) => {
                                    const gpaRatio = (sem.gpa / 10) * 100;
                                    return (
                                        <div key={idx} className="p-3 rounded-2xl bg-muted/30 hover:bg-muted/50 border border-white/5 transition-all">
                                            <div className="flex items-center justify-between text-xs mb-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-foreground text-sm">{sem.fullName}</span>
                                                    <span className="text-[11px] text-muted-foreground">({sem.credits} Credits • {sem.courseCount} Courses)</span>
                                                </div>
                                                <div className="font-black text-sm text-primary">
                                                    {sem.gpa.toFixed(2)} GPA
                                                </div>
                                            </div>
                                            <div className="w-full h-2 rounded-full bg-muted/60 overflow-hidden">
                                                <div 
                                                    className="h-full bg-primary rounded-full transition-all duration-500"
                                                    style={{ width: `${Math.max(5, gpaRatio)}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Cumulative CGPA: <strong className="text-foreground">{cgpa.toFixed(2)}</strong></span>
                        <span>Total Registered Credits: <strong className="text-foreground">{completedCredits}</strong></span>
                    </div>
                </Card>

                {/* Right: Grade Distribution Snapshot */}
                <Card className="lg:col-span-5 p-6 border border-white/10 flex flex-col justify-between space-y-6">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                                    <PieChart className="h-5 w-5 text-amber-500" />
                                    <span>Grades Distribution</span>
                                </h2>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Course-by-course grade points earned
                                </p>
                            </div>
                            <Link to="/grades-view">
                                <Button variant="ghost" size="sm" className="text-xs text-amber-500 flex items-center gap-1 hover:bg-amber-500/10">
                                    <span>View All</span>
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                            </Link>
                        </div>

                        {/* Grade Pill Badges Grid */}
                        <div className="grid grid-cols-3 gap-2.5">
                            {(['S', 'A', 'B', 'C', 'D', 'P'] as Grade[]).map(grade => {
                                const count = gradeDistribution[grade] || 0;
                                const isTop = grade === 'S' || grade === 'A';
                                return (
                                    <div 
                                        key={grade} 
                                        className={cn(
                                            "p-3 rounded-2xl border text-center transition-all",
                                            isTop 
                                                ? "bg-primary/5 border-primary/20" 
                                                : "bg-muted/30 border-white/5"
                                        )}
                                    >
                                        <div className="text-xs font-bold uppercase text-muted-foreground">
                                            {grade} Grade
                                        </div>
                                        <div className={cn(
                                            "text-2xl font-black mt-0.5",
                                            grade === 'S' ? "text-emerald-500" :
                                            grade === 'A' ? "text-blue-500" :
                                            grade === 'B' ? "text-cyan-500" :
                                            grade === 'C' ? "text-indigo-500" : "text-foreground"
                                        )}>
                                            {count}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Summary Honor Box */}
                        <div className="mt-4 p-3.5 rounded-2xl glass border border-white/10 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                            <div className="text-xs">
                                <div className="font-semibold text-foreground">Top-Tier Performance</div>
                                <div className="text-muted-foreground mt-0.5">
                                    You have earned <strong>{topGradesCount}</strong> S & A grades out of {totalGradesCount} total graded courses.
                                </div>
                            </div>
                        </div>
                    </div>

                    <Link to="/grades-view" className="w-full">
                        <Button variant="outline" size="sm" className="w-full text-xs flex items-center justify-center gap-1.5">
                            <span>Open Detailed Grades View</span>
                            <ArrowUpRight className="h-3.5 w-3.5" />
                        </Button>
                    </Link>
                </Card>
            </div>

            {/* Curriculum Baskets Audit & Breakdown */}
            <Card className="p-6 border border-white/10 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                        <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Layers className="h-5 w-5 text-sky-500" />
                            <span>Curriculum Credit Requirements</span>
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Audit of completed credits by category against university degree requirements
                        </p>
                    </div>
                    <Link to="/curriculum">
                        <Button variant="outline" size="sm" className="text-xs flex items-center gap-1.5">
                            <BookOpen className="h-3.5 w-3.5 text-sky-500" />
                            <span>Full Curriculum Audit</span>
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                    {Object.entries(basketStats).map(([key, item]) => {
                        const pct = Math.min(100, (item.completed / item.required) * 100);
                        const isDone = item.completed >= item.required;
                        return (
                            <div key={key} className="p-4 rounded-2xl bg-muted/30 border border-white/5 flex flex-col justify-between space-y-3">
                                <div>
                                    <div className="flex items-center justify-between text-xs font-semibold mb-1">
                                        <span className="truncate text-foreground">{item.label}</span>
                                        {isDone && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />}
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-xl font-black text-foreground">{item.completed}</span>
                                        <span className="text-xs text-muted-foreground font-medium">/ {item.required} cr</span>
                                    </div>
                                </div>
                                <div>
                                    <div className="w-full h-1.5 rounded-full bg-muted/60 overflow-hidden">
                                        <div 
                                            className={cn("h-full rounded-full transition-all duration-500", item.color)}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <div className="text-[10px] text-muted-foreground text-right mt-1 font-semibold">
                                        {pct.toFixed(0)}%
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>

            {/* Active Courses & Marks Preview */}
            {courseMarks.length > 0 && (
                <Card className="p-6 border border-white/10 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                                <Award className="h-5 w-5 text-emerald-500" />
                                <span>Recent Course Marks</span>
                            </h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Current internal and final assessment scores
                            </p>
                        </div>
                        <Link to="/marks">
                            <Button variant="ghost" size="sm" className="text-xs text-emerald-500 flex items-center gap-1 hover:bg-emerald-500/10">
                                <span>Open Marks Tab</span>
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {courseMarks.slice(0, 6).map(course => (
                            <Link key={course.id} to="/marks" className="group">
                                <div className="p-3.5 rounded-2xl bg-muted/30 hover:bg-muted/60 border border-white/5 hover:border-emerald-500/30 transition-all flex items-center justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[11px] font-bold text-muted-foreground uppercase">{course.course_code}</span>
                                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground uppercase font-medium">{course.type}</span>
                                        </div>
                                        <div className="text-xs font-semibold text-foreground truncate mt-0.5" title={course.course_name}>
                                            {course.course_name}
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <div className="text-lg font-black text-emerald-500">
                                            {course.total_marks || 0}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground">/ 100 pts</div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </Card>
            )}

            {/* Quick Academic Action Launchpad */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Link to="/cgpa" className="group">
                    <div className="p-4 rounded-2xl glass border border-white/10 hover:border-primary/40 transition-all text-center flex flex-col items-center justify-center space-y-2 group-hover:scale-[1.02]">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <GraduationCap className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="text-xs font-bold text-foreground">CGPA Calculator</div>
                            <div className="text-[10px] text-muted-foreground">Add & simulate GPA</div>
                        </div>
                    </div>
                </Link>

                <Link to="/marks" className="group">
                    <div className="p-4 rounded-2xl glass border border-white/10 hover:border-emerald-500/40 transition-all text-center flex flex-col items-center justify-center space-y-2 group-hover:scale-[1.02]">
                        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                            <Award className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="text-xs font-bold text-foreground">Marks & Assessments</div>
                            <div className="text-[10px] text-muted-foreground">Update CAT / FAT marks</div>
                        </div>
                    </div>
                </Link>

                <Link to="/curriculum" className="group">
                    <div className="p-4 rounded-2xl glass border border-white/10 hover:border-sky-500/40 transition-all text-center flex flex-col items-center justify-center space-y-2 group-hover:scale-[1.02]">
                        <div className="h-10 w-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
                            <BookOpen className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="text-xs font-bold text-foreground">Curriculum Audit</div>
                            <div className="text-[10px] text-muted-foreground">Check degree credits</div>
                        </div>
                    </div>
                </Link>

                <Link to="/profile" className="group">
                    <div className="p-4 rounded-2xl glass border border-white/10 hover:border-purple-500/40 transition-all text-center flex flex-col items-center justify-center space-y-2 group-hover:scale-[1.02]">
                        <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                            <User className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="text-xs font-bold text-foreground">Profile & Settings</div>
                            <div className="text-[10px] text-muted-foreground">Account & export tools</div>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
}
