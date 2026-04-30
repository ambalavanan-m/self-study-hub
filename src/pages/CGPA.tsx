import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { calculateCGPA, calculateGPA, type Semester } from '../lib/cgpa';
import { Button } from '../components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { AddSemesterModal } from '../components/cgpa/AddSemesterModal';
import { AddSubjectModal } from '../components/cgpa/AddSubjectModal';
import { Card } from '../components/ui/card';

export function CGPA() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [isAddSemesterOpen, setIsAddSemesterOpen] = useState(false);
    const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
    const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(null);

    const fetchSemesters = async () => {
        if (!user) return;
        try {
            const semestersQuery = query(collection(db, 'semesters'), where('user_id', '==', user.uid));
            const semestersSnapshot = await getDocs(semestersQuery);
            const semestersData = semestersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

            const subjectsQuery = query(collection(db, 'subjects'), where('user_id', '==', user.uid));
            const subjectsSnapshot = await getDocs(subjectsQuery);
            const subjectsData = subjectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

            let combined = semestersData.map(sem => ({
                ...sem,
                subjects: subjectsData.filter(sub => sub.semester_id === sem.id)
            }));

            // Sort by year descending, then term
            const termOrder = { 'Fall': 2, 'Spring': 1, 'Summer': 0 };
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

    const cgpa = calculateCGPA(semesters);

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">CGPA Manager</h1>
                    <p className="text-muted-foreground">
                        Current CGPA: <span className="font-bold text-primary text-xl">{cgpa.toFixed(2)}</span>
                    </p>
                </div>
                <Button onClick={() => setIsAddSemesterOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Semester
                </Button>
            </div>

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

                        // Calculate GPA for the academic year (average of semester GPAs weighted by credits? Or just total points / total credits for the year)
                        // Usually Year GPA is calculated from all subjects in that year.
                        const yearSubjects = yearSemesters.flatMap((s) => s.subjects);
                        const yearGpa = calculateGPA(yearSubjects);

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
                                </div>

                                <div className="space-y-6">
                                    {yearSemesters
                                        .sort((a, b) => {
                                            if (a.term === b.term) return 0;
                                            return a.term === 'Fall' ? -1 : 1;
                                        })
                                        .map((semester) => {
                                            const semesterGpa = calculateGPA(semester.subjects);
                                            return (
                                                <div key={semester.id} className="space-y-3">
                                                    <div className="flex items-center justify-between border-b pb-2">
                                                        <div className="flex items-center gap-4">
                                                            <h3 className="font-semibold text-lg">{semester.term} Semester</h3>
                                                            <span className="text-sm text-muted-foreground">
                                                                GPA: <span className="font-medium text-foreground">{semesterGpa.toFixed(2)}</span>
                                                            </span>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8"
                                                                onClick={() => {
                                                                    setSelectedSemesterId(semester.id);
                                                                    setIsAddSubjectOpen(true);
                                                                }}
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

                                                    <div className="rounded-md border overflow-x-auto">
                                                        <table className="w-full text-sm min-w-[600px]">
                                                            <thead>
                                                                <tr className="border-b bg-muted/50">
                                                                    <th className="p-3 text-left font-medium">Subject</th>
                                                                    <th className="p-3 text-left font-medium">Code</th>
                                                                    <th className="p-3 text-left font-medium">Credit</th>
                                                                    <th className="p-3 text-left font-medium">Grade</th>
                                                                    <th className="p-3 text-right font-medium">Actions</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {semester.subjects.length === 0 ? (
                                                                    <tr>
                                                                        <td colSpan={5} className="p-4 text-center text-muted-foreground">
                                                                            No subjects added yet.
                                                                        </td>
                                                                    </tr>
                                                                ) : (
                                                                    semester.subjects.map((subject) => (
                                                                        <tr key={subject.id} className="border-b last:border-0 hover:bg-muted/50">
                                                                            <td className="p-3 font-medium">{subject.subject_name}</td>
                                                                            <td className="p-3 text-muted-foreground">{subject.subject_code}</td>
                                                                            <td className="p-3">{subject.credit}</td>
                                                                            <td className="p-3">
                                                                                <span className={`inline-flex items-center justify-center rounded px-2 py-1 font-medium text-xs ${subject.grade === 'S' || subject.grade === 'A'
                                                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                                                    : 'bg-secondary text-secondary-foreground'
                                                                                    }`}>
                                                                                    {subject.grade}
                                                                                </span>
                                                                            </td>
                                                                            <td className="p-3 text-right">
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                                                                    onClick={() => handleDeleteSubject(subject.id)}
                                                                                >
                                                                                    <Trash2 className="h-4 w-4" />
                                                                                </Button>
                                                                            </td>
                                                                        </tr>
                                                                    ))
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
                <AddSubjectModal
                    isOpen={isAddSubjectOpen}
                    onClose={() => {
                        setIsAddSubjectOpen(false);
                        setSelectedSemesterId(null);
                    }}
                    onSuccess={fetchSemesters}
                    semesterId={selectedSemesterId}
                />
            )}
        </div>
    );
}
