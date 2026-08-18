import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { calculateCGPA, calculateGradeDistribution, type Semester, type Grade, type Subject } from '../lib/cgpa';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { SEO } from '../components/SEO';
import { Link } from 'react-router-dom';
import { ArrowLeft, Award, BarChart3, GraduationCap, BookOpen, Download } from 'lucide-react';
import { generateGradesViewPDF } from '../lib/export';

const GRADE_CONFIG: Record<Grade, { label: string; points: string; color: string; badge: string; border: string; bg: string }> = {
    S: { label: 'S Grade', points: '10 pts', color: 'text-emerald-500', badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30', border: 'border-emerald-500/30', bg: 'bg-emerald-500' },
    A: { label: 'A Grade', points: '9 pts', color: 'text-blue-500', badge: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30', border: 'border-blue-500/30', bg: 'bg-blue-500' },
    B: { label: 'B Grade', points: '8 pts', color: 'text-cyan-500', badge: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border-cyan-500/30', border: 'border-cyan-500/30', bg: 'bg-cyan-500' },
    C: { label: 'C Grade', points: '7 pts', color: 'text-indigo-500', badge: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30', border: 'border-indigo-500/30', bg: 'bg-indigo-500' },
    D: { label: 'D Grade', points: '6 pts', color: 'text-amber-500', badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30', border: 'border-amber-500/30', bg: 'bg-amber-500' },
    E: { label: 'E Grade', points: '5 pts', color: 'text-orange-500', badge: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30', border: 'border-orange-500/30', bg: 'bg-orange-500' },
    F: { label: 'F (Fail)', points: '0 pts', color: 'text-red-500', badge: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30', border: 'border-red-500/30', bg: 'bg-red-500' },
    N: { label: 'N (No Grade)', points: '0 pts', color: 'text-purple-500', badge: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30', border: 'border-purple-500/30', bg: 'bg-purple-500' },
    P: { label: 'Pass', points: 'Pass', color: 'text-teal-500', badge: 'bg-teal-500/15 text-teal-700 dark:text-teal-400 border-teal-500/30', border: 'border-teal-500/30', bg: 'bg-teal-500' },
    A_ABSENT: { label: 'Absent', points: 'Absent', color: 'text-zinc-500', badge: 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-400 border-zinc-500/30', border: 'border-zinc-500/30', bg: 'bg-zinc-500' },
};

const MAIN_GRADES: Grade[] = ['S', 'A', 'B', 'C', 'D', 'E', 'F', 'N'];

interface SubjectWithSemester extends Subject {
    semesterTerm?: string;
    semesterYear?: number;
}

export function GradesView() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [semesters, setSemesters] = useState<Semester[]>([]);

    useEffect(() => {
        const fetchSemesters = async () => {
            if (!user) return;
            try {
                const semestersQuery = query(collection(db, 'semesters'), where('user_id', '==', user.uid));
                const semestersSnapshot = await getDocs(semestersQuery);
                const semestersData = semestersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                const subjectsQuery = query(collection(db, 'subjects'), where('user_id', '==', user.uid));
                const subjectsSnapshot = await getDocs(subjectsQuery);
                const subjectsData = subjectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as (Subject & { semester_id: string })[];

                const combined = semestersData.map(sem => ({
                    ...sem,
                    subjects: subjectsData.filter((sub) => sub.semester_id === sem.id)
                })) as unknown as Semester[];

                // Sort by year descending, then term
                const termOrder = { 'Fall': 3, 'Winter': 2, 'Spring': 1, 'Summer': 0 };
                combined.sort((a, b) => {
                    if (a.year !== b.year) return b.year - a.year;
                    return (termOrder[b.term as keyof typeof termOrder] || 0) - (termOrder[a.term as keyof typeof termOrder] || 0);
                });

                setSemesters(combined || []);
            } catch (error) {
                console.error('Error fetching data for grades view:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSemesters();
    }, [user]);

    const cgpa = calculateCGPA(semesters);

    const allSubjectsWithSem = useMemo(() => {
        const list: SubjectWithSemester[] = [];
        semesters.forEach(sem => {
            sem.subjects?.forEach(sub => {
                list.push({
                    ...sub,
                    semesterTerm: sem.term,
                    semesterYear: sem.year
                });
            });
        });
        return list;
    }, [semesters]);

    const overallGradeDistribution = useMemo(() => {
        return calculateGradeDistribution(allSubjectsWithSem);
    }, [allSubjectsWithSem]);

    const totalCredits = useMemo(() => {
        return allSubjectsWithSem.reduce((sum, sub) => {
            if (sub.grade !== 'A_ABSENT') {
                return sum + (Number(sub.credit) || 0);
            }
            return sum;
        }, 0);
    }, [allSubjectsWithSem]);

    const handleDownloadPDF = () => {
        generateGradesViewPDF(
            cgpa,
            totalCredits,
            allSubjectsWithSem,
            overallGradeDistribution,
            user?.displayName || 'Student'
        );
    };

    if (loading) return <div className="p-8 text-center">Loading grades view...</div>;

    return (
        <div className="space-y-8">
            <SEO 
                title="Grades View | StudyTrack" 
                description="Comprehensive breakdown and distribution of all your earned grades across semesters."
            />

            {/* Top Navigation & Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <Link
                        to="/cgpa"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-1"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to CGPA Manager
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight">Grades View</h1>
                    <p className="text-muted-foreground">
                        Detailed distribution and history breakdown of all your grades.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button 
                        variant="outline" 
                        onClick={handleDownloadPDF}
                        className="gap-2 border-border/80 hover:bg-muted"
                        title="Download Grade Distribution PDF Report"
                    >
                        <Download className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                        Download PDF
                    </Button>
                    <Link to="/curriculum">
                        <Button variant="outline">
                            Curriculum Baskets
                        </Button>
                    </Link>
                    <Link to="/cgpa">
                        <Button variant="primary">
                            Manage Semesters
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Quick KPI Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="p-5 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <GraduationCap className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">Current CGPA</p>
                        <p className="text-2xl font-black tracking-tight text-foreground">{cgpa.toFixed(2)}</p>
                    </div>
                </Card>
                <Card className="p-5 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <BookOpen className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">Total Credits</p>
                        <p className="text-2xl font-black tracking-tight text-foreground">{totalCredits}</p>
                    </div>
                </Card>
                <Card className="p-5 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <Award className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">Total Subjects</p>
                        <p className="text-2xl font-black tracking-tight text-foreground">{allSubjectsWithSem.length}</p>
                    </div>
                </Card>
            </div>

            {/* Grade Distribution & Count Section */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-bold">Grade Distribution & History Counts</h2>
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">
                        {allSubjectsWithSem.length} subjects in record
                    </span>
                </div>

                {/* Progress bar visualizer */}
                {allSubjectsWithSem.length > 0 && (
                    <div className="mb-6">
                        <div className="h-3 w-full rounded-full overflow-hidden flex bg-muted/50 border border-border/50">
                            {MAIN_GRADES.map(grade => {
                                const count = overallGradeDistribution[grade] || 0;
                                if (count === 0) return null;
                                const pct = (count / allSubjectsWithSem.length) * 100;
                                return (
                                    <div
                                        key={grade}
                                        className={`${GRADE_CONFIG[grade].bg} transition-all duration-300`}
                                        style={{ width: `${pct}%` }}
                                        title={`${grade}: ${count} (${pct.toFixed(1)}%)`}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Vertical Grade List (S, A, B, C, D, E, F, N) */}
                <div className="space-y-3">
                    {MAIN_GRADES.map((grade) => {
                        const count = overallGradeDistribution[grade] || 0;
                        const config = GRADE_CONFIG[grade];
                        const percentage = allSubjectsWithSem.length > 0 ? ((count / allSubjectsWithSem.length) * 100).toFixed(1) : '0';
                        const numPct = allSubjectsWithSem.length > 0 ? (count / allSubjectsWithSem.length) * 100 : 0;

                        return (
                            <div
                                key={grade}
                                className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200 ${
                                    count > 0 
                                        ? 'bg-card border-border/80 hover:border-primary/40 shadow-xs' 
                                        : 'bg-muted/10 border-border/30 opacity-60'
                                }`}
                            >
                                {/* Left: Grade Badge & Title */}
                                <div className="flex items-center gap-3.5 min-w-[220px]">
                                    <div className={`h-11 w-11 rounded-xl flex items-center justify-center font-black text-xl border shrink-0 ${config.badge}`}>
                                        {grade}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-base text-foreground">{config.label}</span>
                                            <span className="text-xs px-2 py-0.5 rounded-md font-medium bg-muted text-muted-foreground">
                                                {config.points}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {count} {count === 1 ? 'subject' : 'subjects'} recorded
                                        </p>
                                    </div>
                                </div>

                                {/* Middle: Progress Bar */}
                                <div className="flex-1 max-w-md px-2 space-y-1 w-full">
                                    <div className="flex justify-between text-xs text-muted-foreground font-medium">
                                        <span>Proportion</span>
                                        <span className="font-semibold text-foreground">{percentage}%</span>
                                    </div>
                                    <div className="h-2.5 w-full rounded-full bg-muted/60 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${config.bg} transition-all duration-300`}
                                            style={{ width: `${numPct}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Right: Subject Count & Share Badge */}
                                <div className="flex items-center gap-4 justify-between sm:justify-end shrink-0">
                                    <div className="text-left sm:text-right">
                                        <p className="text-xl font-black text-foreground">
                                            {count}
                                        </p>
                                        <p className="text-xs text-muted-foreground font-medium">{count === 1 ? 'course' : 'courses'}</p>
                                    </div>
                                    <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${config.badge}`}>
                                        {percentage}%
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Additional Grades (P or Absent) if present in history */}
                {(overallGradeDistribution.P > 0 || overallGradeDistribution.A_ABSENT > 0) && (
                    <div className="mt-4 pt-4 border-t border-border/50 flex flex-wrap items-center gap-3">
                        <span className="text-xs font-medium text-muted-foreground">Other Grades:</span>
                        {overallGradeDistribution.P > 0 && (
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${GRADE_CONFIG.P.badge}`}>
                                <span>P (Pass):</span>
                                <span className="font-bold">{overallGradeDistribution.P}</span>
                            </span>
                        )}
                        {overallGradeDistribution.A_ABSENT > 0 && (
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${GRADE_CONFIG.A_ABSENT.badge}`}>
                                <span>Absent:</span>
                                <span className="font-bold">{overallGradeDistribution.A_ABSENT}</span>
                            </span>
                        )}
                    </div>
                )}
            </Card>
        </div>
    );
}
