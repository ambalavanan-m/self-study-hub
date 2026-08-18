import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
    calculateCGPA, 
    calculateGPA, 
    calculateGradeDistribution, 
    type Semester, 
    type Grade, 
    type Subject, 
    BASKET_DEFINITIONS,
    sortSubjectsAlphabeticallyWithLab
} from '../lib/cgpa';
import { Button } from '../components/ui/button';
import { Plus, Trash2, BarChart3, Layers, Edit2, Download } from 'lucide-react';
import { AddSemesterModal } from '../components/cgpa/AddSemesterModal';
import { SubjectModal } from '../components/cgpa/SubjectModal';
import { Card } from '../components/ui/card';
import { SEO } from '../components/SEO';
import { Link } from 'react-router-dom';
import { generateCGPAPDF } from '../lib/export';

const GRADE_CONFIG: Record<Grade, { label: string; points: string; color: string; badge: string; border: string; bg: string }> = {
    S: { label: 'S Grade', points: '10 pts', color: 'text-emerald-500', badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30', border: 'border-emerald-500/30', bg: 'bg-emerald-500' },
    A: { label: 'A Grade', points: '9 pts', color: 'text-blue-500', badge: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30', border: 'border-blue-500/30', bg: 'bg-blue-500' },
    B: { label: 'B Grade', points: '8 pts', color: 'text-cyan-500', badge: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border-cyan-500/30', border: 'border-cyan-500/30', bg: 'bg-cyan-500' },
    C: { label: 'C Grade', points: '7 pts', color: 'text-indigo-500', badge: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30', border: 'border-indigo-500/30', bg: 'bg-indigo-500' },
    D: { label: 'D Grade', points: '6 pts', color: 'text-amber-500', badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30', border: 'border-amber-500/30', bg: 'bg-amber-500' },
    E: { label: 'E Grade', points: '5 pts', color: 'text-orange-500', badge: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30', border: 'border-orange-500/30', bg: 'bg-orange-500' },
    F: { label: 'F Grade (Fail)', points: '0 pts', color: 'text-red-500', badge: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30', border: 'border-red-500/30', bg: 'bg-red-500' },
    N: { label: 'N Grade (No Grade)', points: '0 pts', color: 'text-purple-500', badge: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30', border: 'border-purple-500/30', bg: 'bg-purple-500' },
    P: { label: 'Pass (Non-Credit)', points: 'Pass', color: 'text-teal-500', badge: 'bg-teal-500/15 text-teal-700 dark:text-teal-400 border-teal-500/30', border: 'border-teal-500/30', bg: 'bg-teal-500' },
    A_ABSENT: { label: 'Absent', points: 'Absent', color: 'text-zinc-500', badge: 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-400 border-zinc-500/30', border: 'border-zinc-500/30', bg: 'bg-zinc-500' },
};

const MAIN_GRADES: Grade[] = ['S', 'A', 'B', 'C', 'D', 'E', 'F', 'N'];

export function CGPA() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [isAddSemesterOpen, setIsAddSemesterOpen] = useState(false);
    const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
    const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(null);
    const [subjectToEdit, setSubjectToEdit] = useState<Subject | null>(null);

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
            console.error('Error fetching semesters:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSemesters();
    }, [user]);

    const handleDeleteSubject = async (id: string) => {
        if (!confirm('Are you sure you want to delete this subject?')) return;
        try {
            await deleteDoc(doc(db, 'subjects', id));
            fetchSemesters();
        } catch (error) {
            console.error('Error deleting subject:', error);
        }
    };

    const handleDeleteSemester = async (id: string) => {
        if (!confirm('Are you sure you want to delete this semester? All subjects will be deleted.')) return;
        try {
            await deleteDoc(doc(db, 'semesters', id));
            fetchSemesters();
        } catch (error) {
            console.error('Error deleting semester:', error);
        }
    };

    const openAddSubject = (semesterId: string) => {
        setSelectedSemesterId(semesterId);
        setSubjectToEdit(null);
        setIsSubjectModalOpen(true);
    };

    const openEditSubject = (subject: Subject, semesterId: string) => {
        setSelectedSemesterId(semesterId);
        setSubjectToEdit(subject);
        setIsSubjectModalOpen(true);
    };

    const handleDownloadPDF = () => {
        generateCGPAPDF(semesters, user?.displayName || 'Student');
    };

    const cgpa = calculateCGPA(semesters);

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="space-y-8">
            <SEO 
                title="CGPA Manager | StudyTrack" 
                description="Track your grades, calculate GPA per semester, and monitor your academic progress over time with StudyTrack's CGPA Manager."
            />
            
            {/* Header with Title and Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">CGPA Manager</h1>
                    <p className="text-muted-foreground mt-1">
                        Current CGPA: <span className="font-bold text-primary text-xl">{cgpa.toFixed(2)}</span>
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button 
                        variant="outline" 
                        onClick={handleDownloadPDF}
                        className="gap-2 border-border/80 hover:bg-muted"
                        title="Download Academic CGPA Transcript PDF"
                    >
                        <Download className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        Download PDF
                    </Button>
                    <Link to="/curriculum">
                        <Button variant="outline" className="gap-2 border-primary/30 text-primary hover:bg-primary/10">
                            <Layers className="h-4 w-4" />
                            Curriculum
                        </Button>
                    </Link>
                    <Link to="/grades-view">
                        <Button variant="outline" className="gap-2">
                            <BarChart3 className="h-4 w-4 text-primary" />
                            Grades View
                        </Button>
                    </Link>
                    <Button onClick={() => setIsAddSemesterOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Semester
                    </Button>
                </div>
            </div>

            {/* Academic History Semesters List */}
            <div className="space-y-6">
                {Object.entries(
                    semesters.reduce((acc, semester) => {
                        const year = semester.year;
                        if (!acc[year]) acc[year] = [];
                        acc[year].push(semester);
                        return acc;
                    }, {} as Record<number, Semester[]>)
                )
                    .sort(([yearA], [yearB]) => Number(yearB) - Number(yearA))
                    .map(([year, yearSemesters]) => {
                        const academicYear = Number(year);
                        const minYear = Math.min(...semesters.map((s) => s.year));
                        const yearDiff = academicYear - minYear;
                        const yearLabel =
                            ['First Year', 'Second Year', 'Third Year', 'Fourth Year'][yearDiff] ||
                            `${yearDiff + 1}th Year`;

                        const yearSubjects = yearSemesters.flatMap((s) => s.subjects);
                        const yearGpa = calculateGPA(yearSubjects);
                        const yearGradeCounts = calculateGradeDistribution(yearSubjects);

                        return (
                            <Card key={academicYear} className="p-6">
                                <div className="mb-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-xl font-bold">
                                                {yearLabel} <span className="text-muted-foreground font-normal">[{academicYear}-{String(academicYear + 1).slice(2)}]</span>
                                            </h2>
                                            <p className="text-sm text-muted-foreground">
                                                Year GPA: <span className="font-bold text-primary">{yearGpa.toFixed(2)}</span>
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => {
                                                if (confirm('Are you sure you want to delete this entire academic year?')) {
                                                    yearSemesters.forEach(s => handleDeleteSemester(s.id));
                                                }
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {/* Year-level Grade Badges */}
                                    {yearSubjects.length > 0 && (
                                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                                            <span className="text-xs text-muted-foreground font-medium mr-1">Year Grades:</span>
                                            {MAIN_GRADES.filter(g => yearGradeCounts[g] > 0).map(g => (
                                                <span
                                                    key={g}
                                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border ${GRADE_CONFIG[g].badge}`}
                                                >
                                                    <span>{g}:</span>
                                                    <span>{yearGradeCounts[g]}</span>
                                                </span>
                                            ))}
                                            {yearGradeCounts.P > 0 && (
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border ${GRADE_CONFIG.P.badge}`}>
                                                    <span>P:</span>
                                                    <span>{yearGradeCounts.P}</span>
                                                </span>
                                            )}
                                            {yearGradeCounts.A_ABSENT > 0 && (
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border ${GRADE_CONFIG.A_ABSENT.badge}`}>
                                                    <span>Abs:</span>
                                                    <span>{yearGradeCounts.A_ABSENT}</span>
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    {yearSemesters
                                        .sort((a, b) => {
                                            if (a.term === b.term) return 0;
                                            return a.term === 'Fall' ? -1 : 1;
                                        })
                                        .map((semester) => {
                                            const semesterGpa = calculateGPA(semester.subjects);
                                            const semGradeCounts = calculateGradeDistribution(semester.subjects);

                                            return (
                                                <div key={semester.id} className="space-y-3">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-2 gap-2">
                                                        <div className="flex flex-wrap items-center gap-3">
                                                            <h3 className="font-semibold text-lg">{semester.term} Semester</h3>
                                                            <span className="text-sm text-muted-foreground">
                                                                GPA: <span className="font-medium text-foreground">{semesterGpa.toFixed(2)}</span>
                                                            </span>

                                                            {/* Semester-level Grade Badges */}
                                                            {semester.subjects.length > 0 && (
                                                                <div className="flex flex-wrap items-center gap-1 ml-1">
                                                                    {MAIN_GRADES.filter(g => semGradeCounts[g] > 0).map(g => (
                                                                        <span
                                                                            key={g}
                                                                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold border ${GRADE_CONFIG[g].badge}`}
                                                                        >
                                                                            <span>{g}:</span>
                                                                            <span>{semGradeCounts[g]}</span>
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 self-end sm:self-auto">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8"
                                                                onClick={() => openAddSubject(semester.id)}
                                                            >
                                                                <Plus className="mr-2 h-3 w-3" />
                                                                Add Subject
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                                                onClick={() => handleDeleteSemester(semester.id)}
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    <div className="rounded-2xl border overflow-x-auto">
                                                        <table className="w-full text-sm min-w-[650px]">
                                                            <thead>
                                                                <tr className="border-b bg-muted/50">
                                                                    <th className="p-3 text-left font-medium">Subject</th>
                                                                    <th className="p-3 text-left font-medium">Code</th>
                                                                    <th className="p-3 text-left font-medium">Credit</th>
                                                                    <th className="p-3 text-left font-medium">Grade</th>
                                                                    <th className="p-3 text-left font-medium">Basket</th>
                                                                    <th className="p-3 text-right font-medium">Actions</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {semester.subjects.length === 0 ? (
                                                                    <tr>
                                                                        <td colSpan={6} className="p-4 text-center text-muted-foreground">
                                                                            No subjects added yet.
                                                                        </td>
                                                                    </tr>
                                                                ) : (
                                                                    sortSubjectsAlphabeticallyWithLab(semester.subjects).map((subject) => {
                                                                        const config = GRADE_CONFIG[subject.grade] || GRADE_CONFIG.A_ABSENT;
                                                                        const basketMeta = subject.basket ? BASKET_DEFINITIONS[subject.basket] : null;

                                                                        return (
                                                                            <tr key={subject.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                                                                                <td className="p-3 font-medium">{subject.subject_name}</td>
                                                                                <td className="p-3 text-muted-foreground">{subject.subject_code}</td>
                                                                                <td className="p-3">{subject.credit}</td>
                                                                                <td className="p-3">
                                                                                    <span className={`inline-flex items-center justify-center rounded-md px-2.5 py-1 font-semibold text-xs border ${config.badge}`}>
                                                                                        {subject.grade === 'A_ABSENT' ? 'Absent' : subject.grade}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="p-3">
                                                                                    {basketMeta ? (
                                                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-primary/10 text-primary border border-primary/20" title={basketMeta.title}>
                                                                                            {basketMeta.shortName}
                                                                                        </span>
                                                                                    ) : (
                                                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground">
                                                                                            Unassigned
                                                                                        </span>
                                                                                    )}
                                                                                </td>
                                                                                <td className="p-3 text-right">
                                                                                    <div className="flex items-center justify-end gap-1">
                                                                                        <Button
                                                                                            variant="ghost"
                                                                                            size="sm"
                                                                                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                                                                            onClick={() => openEditSubject(subject, semester.id)}
                                                                                            title="Edit subject / basket"
                                                                                        >
                                                                                            <Edit2 className="h-3.5 w-3.5" />
                                                                                        </Button>
                                                                                        <Button
                                                                                            variant="ghost"
                                                                                            size="sm"
                                                                                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                                                                            onClick={() => handleDeleteSubject(subject.id)}
                                                                                            title="Delete subject"
                                                                                        >
                                                                                            <Trash2 className="h-4 w-4" />
                                                                                        </Button>
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    })
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </Card>
                        );
                    })}
            </div>

            <AddSemesterModal
                isOpen={isAddSemesterOpen}
                onClose={() => setIsAddSemesterOpen(false)}
                onSuccess={fetchSemesters}
            />

            {selectedSemesterId && (
                <SubjectModal
                    isOpen={isSubjectModalOpen}
                    onClose={() => {
                        setIsSubjectModalOpen(false);
                        setSelectedSemesterId(null);
                        setSubjectToEdit(null);
                    }}
                    onSuccess={fetchSemesters}
                    semesterId={selectedSemesterId}
                    subjectToEdit={subjectToEdit}
                    restrictEditToGradeAndCredit={Boolean(subjectToEdit)}
                />
            )}
        </div>
    );
}


