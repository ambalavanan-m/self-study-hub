import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
    type CourseMarkEntry,
    getGradeBadgeStyle,
    formatMarks,
    isSoftSkillsCourse,
    getLabBreakdown
} from '../lib/marks';
import { type Semester, type Subject, type Grade, GRADE_POINTS } from '../lib/cgpa';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { SEO } from '../components/SEO';
import { AddCourseModal } from '../components/marks/AddCourseModal';
import { ImportCoursesModal } from '../components/marks/ImportCoursesModal';
import { CourseDetailsModal } from '../components/marks/CourseDetailsModal';
import { CustomMarksPDFModal } from '../components/marks/CustomMarksPDFModal';
import {
    Award,
    BookOpen,
    FlaskConical,
    Plus,
    Download,
    Search,
    Trash2,
    Edit2,
    LayoutGrid,
    Table as TableIcon,
    CheckCircle2,
    TrendingUp,
    FileSpreadsheet,
    Calendar,
    GraduationCap,
    ExternalLink,
    Sliders
} from 'lucide-react';
import { cn } from '../lib/utils';

const GRADE_OPTIONS: { value: Grade; label: string }[] = [
    { value: 'S', label: 'S (10 pts)' },
    { value: 'A', label: 'A (9 pts)' },
    { value: 'B', label: 'B (8 pts)' },
    { value: 'C', label: 'C (7 pts)' },
    { value: 'D', label: 'D (6 pts)' },
    { value: 'E', label: 'E (5 pts)' },
    { value: 'F', label: 'F (0 pts)' },
    { value: 'N', label: 'N (No Grade)' },
    { value: 'P', label: 'P (Pass)' },
    { value: 'A_ABSENT', label: 'Absent' },
];

export function Marks() {
    const { user } = useAuth();
    const { showNotification } = useNotification();

    const [courses, setCourses] = useState<CourseMarkEntry[]>([]);
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'theory' | 'lab'>('all');
    const [selectedSemesterFilter, setSelectedSemesterFilter] = useState<string>('all');
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedCourseForEdit, setSelectedCourseForEdit] = useState<CourseMarkEntry | null>(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [detailsModalCourse, setDetailsModalCourse] = useState<CourseMarkEntry | null>(null);
    const [isCustomPDFModalOpen, setIsCustomPDFModalOpen] = useState(false);

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // 1. Fetch Marks entries
            const qMarks = query(collection(db, 'course_marks'), where('user_id', '==', user.uid));
            const marksSnap = await getDocs(qMarks);
            const marksData = marksSnap.docs.map(d => ({
                id: d.id,
                ...d.data()
            })) as CourseMarkEntry[];

            // 2. Fetch Semesters from CGPA
            const qSemesters = query(collection(db, 'semesters'), where('user_id', '==', user.uid));
            const semSnap = await getDocs(qSemesters);
            const semData = semSnap.docs.map(d => ({
                id: d.id,
                ...d.data()
            })) as Semester[];

            // Sort semesters
            const termOrder = { 'Fall': 3, 'Winter': 2, 'Spring': 1, 'Summer': 0 };
            semData.sort((a, b) => {
                if (a.year !== b.year) return b.year - a.year;
                return (termOrder[b.term as keyof typeof termOrder] || 0) - (termOrder[a.term as keyof typeof termOrder] || 0);
            });
            setSemesters(semData);

            // 3. Fetch Subjects from CGPA to map entered grades
            const qSubjects = query(collection(db, 'subjects'), where('user_id', '==', user.uid));
            const subSnap = await getDocs(qSubjects);
            const subData = subSnap.docs.map(d => ({
                id: d.id,
                ...d.data()
            })) as Subject[];

            const norm = (s?: string) => (s || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

            // Map CGPA grades to marks entries
            const mappedMarks = marksData.map(c => {
                const courseCodeNorm = norm(c.course_code);
                const courseNameNorm = norm(c.course_name);

                const matchedSub = subData.find(s => {
                    const subCodeNorm = norm(s.subject_code || (s as any).code);
                    const subNameNorm = norm(s.subject_name || (s as any).name);
                    return (courseCodeNorm && subCodeNorm && courseCodeNorm === subCodeNorm) ||
                           (courseNameNorm && subNameNorm && courseNameNorm === subNameNorm);
                });

                // Find matching semester label if not already stored
                let semName = c.semester_name;
                const effectiveSemId = c.semester_id || matchedSub?.semester_id;
                if (!semName && effectiveSemId) {
                    const matchSem = semData.find(s => s.id === effectiveSemId);
                    if (matchSem) {
                        semName = `${matchSem.term} ${matchSem.year}`;
                    }
                }

                return {
                    ...c,
                    semester_id: effectiveSemId,
                    semester_name: semName,
                    grade: matchedSub?.grade || c.grade || undefined,
                    total_marks: Math.round(((Number(c.total_marks) || 0) * 100)) / 100,
                };
            });

            // Sort by course code
            mappedMarks.sort((a, b) => (a.course_code || '').localeCompare(b.course_code || ''));
            setCourses(mappedMarks);
        } catch (error) {
            console.error('Error fetching marks data:', error);
            showNotification('Failed to load course marks', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const handleQuickGradeChange = async (course: CourseMarkEntry, newGrade: string) => {
        if (!user) return;
        const gradeVal = newGrade ? (newGrade as Grade) : undefined;

        // Optimistic UI update
        setCourses(prev => prev.map(c => c.id === course.id ? { ...c, grade: gradeVal } : c));

        try {
            // 1. Update course_marks
            await updateDoc(doc(db, 'course_marks', course.id), {
                grade: gradeVal || null,
                updated_at: new Date().toISOString()
            });

            // 2. Sync to CGPA subjects
            const norm = (s?: string) => (s || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
            const codeNorm = norm(course.course_code);
            const nameNorm = norm(course.course_name);

            const subQ = query(collection(db, 'subjects'), where('user_id', '==', user.uid));
            const subSnap = await getDocs(subQ);
            const matchedSubDoc = subSnap.docs.find(d => {
                const data = d.data();
                const subCodeNorm = norm(data.subject_code || data.code);
                const subNameNorm = norm(data.subject_name || data.name);
                return (codeNorm && subCodeNorm && codeNorm === subCodeNorm) ||
                       (nameNorm && subNameNorm && nameNorm === subNameNorm);
            });

            if (matchedSubDoc) {
                await updateDoc(doc(db, 'subjects', matchedSubDoc.id), {
                    grade: gradeVal || '',
                    updated_at: new Date().toISOString()
                });
            } else if (gradeVal && course.semester_id) {
                // Auto-create subject in CGPA so it instantly impacts CGPA calculation
                await addDoc(collection(db, 'subjects'), {
                    user_id: user.uid,
                    semester_id: course.semester_id,
                    subject_code: course.course_code.trim().toUpperCase(),
                    subject_name: course.course_name.trim(),
                    credit: Number(course.credit) || 1,
                    grade: gradeVal,
                    created_at: new Date().toISOString()
                });
            }

            showNotification(
                gradeVal ? `Assigned Grade ${gradeVal} to ${course.course_code}` : `Cleared grade for ${course.course_code}`,
                'success'
            );
        } catch (err: any) {
            console.error('Error updating grade:', err);
            showNotification(err.message || 'Failed to update grade', 'error');
            fetchData();
        }
    };

    const handleDeleteCourse = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}" from Marks?`)) return;

        try {
            await deleteDoc(doc(db, 'course_marks', id));
            setCourses(prev => prev.filter(c => c.id !== id));
            showNotification(`Deleted ${name}`, 'success');
        } catch (err: any) {
            console.error('Error deleting course:', err);
            showNotification(err.message || 'Failed to delete course', 'error');
        }
    };

    const handleEditCourse = (course: CourseMarkEntry) => {
        setSelectedCourseForEdit(course);
        setIsAddModalOpen(true);
    };

    const handleOpenAdd = () => {
        setSelectedCourseForEdit(null);
        setIsAddModalOpen(true);
    };

    // Filtered courses
    const filteredCourses = useMemo(() => {
        return courses.filter(c => {
            const matchesType = filterType === 'all' || c.type === filterType;
            const matchesSemester =
                selectedSemesterFilter === 'all' ||
                c.semester_id === selectedSemesterFilter ||
                (selectedSemesterFilter === 'none' && !c.semester_id);
            const matchesSearch =
                (c.course_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (c.course_code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (c.slot || '').toLowerCase().includes(searchQuery.toLowerCase());
            return matchesType && matchesSemester && matchesSearch;
        });
    }, [courses, filterType, selectedSemesterFilter, searchQuery]);

    // Statistics (using CGPA page grades)
    const stats = useMemo(() => {
        const totalCourses = courses.length;
        const theoryCount = courses.filter(c => c.type === 'theory').length;
        const labCount = courses.filter(c => c.type === 'lab').length;
        const totalCredits = courses.reduce((sum, c) => sum + (Number(c.credit) || 0), 0);

        const totalMarksSum = courses.reduce((sum, c) => sum + (Number(c.total_marks) || 0), 0);
        const avgMarks = totalCourses > 0 ? Math.round((totalMarksSum / totalCourses) * 100) / 100 : 0;

        // Calculate GPA from CGPA page grades
        let totalPoints = 0;
        let gradedCredits = 0;
        courses.forEach(c => {
            if (c.grade && c.grade !== 'P' && c.grade !== 'A_ABSENT') {
                const pts = GRADE_POINTS[c.grade as keyof typeof GRADE_POINTS];
                if (pts !== undefined) {
                    totalPoints += pts * (Number(c.credit) || 1);
                    gradedCredits += Number(c.credit) || 1;
                }
            }
        });

        const calculatedGpa = gradedCredits > 0 ? (totalPoints / gradedCredits).toFixed(2) : null;

        return {
            totalCourses,
            theoryCount,
            labCount,
            totalCredits,
            avgMarks,
            gpa: calculatedGpa,
            gradedCount: courses.filter(c => Boolean(c.grade)).length,
        };
    }, [courses]);

    const existingCourseCodes = useMemo(() => {
        return new Set(courses.map(c => (c.course_code || '').toUpperCase()));
    }, [courses]);

    // Export as CSV
    const handleExportCSV = () => {
        if (courses.length === 0) {
            showNotification('No courses to export', 'warning');
            return;
        }

        const headers = [
            'Course Code',
            'Course Name',
            'Semester',
            'Type',
            'Slot',
            'Credits',
            'CAT 1 (15)',
            'CAT 2 (15)',
            'Internal (30)',
            'FAT (40)',
            'Total',
            'CGPA Grade'
        ];

        const rows = courses.map(c => {
            if (c.type === 'theory' && c.theory_marks) {
                const tm = c.theory_marks;
                return [
                    `"${c.course_code}"`,
                    `"${c.course_name}"`,
                    `"${c.semester_name || ''}"`,
                    'Theory',
                    `"${c.slot}"`,
                    c.credit,
                    tm.cat1_weight ?? '',
                    tm.cat2_weight ?? '',
                    tm.internal_total ?? '',
                    tm.fat_weight ?? '',
                    formatMarks(c.total_marks),
                    c.grade || '',
                ];
            } else {
                const lm = c.lab_marks;
                const daSum = lm?.da_marks?.reduce<number>((s, v) => s + (Number(v) || 0), 0) || 0;
                return [
                    `"${c.course_code}"`,
                    `"${c.course_name}"`,
                    `"${c.semester_name || ''}"`,
                    'Lab',
                    `"${c.slot}"`,
                    c.credit,
                    '',
                    '',
                    daSum,
                    lm?.fat_weight ?? '',
                    formatMarks(c.total_marks),
                    c.grade || '',
                ];
            }
        });

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Marks_Sheet_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showNotification('Marks exported to CSV successfully!', 'success');
    };

    return (
        <div className="space-y-6">
            <SEO
                title="Course Marks & Assessments Tracker | Self Study Hub"
                description="Track Theory CAT1, CAT2, Internals, and FAT weightages, as well as Lab Continuous Assessments and FAT."
            />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2.5">
                        <Award className="h-7 w-7 text-primary" />
                        Marks Tracker
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Track CAT 1 (15), CAT 2 (15), Internal (30), FAT (40), and Lab DAs with CGPA grades
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsImportModalOpen(true)}
                        className="gap-2"
                    >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Import from</span> Timetable & CGPA
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportCSV}
                        className="gap-2"
                        disabled={courses.length === 0}
                    >
                        <FileSpreadsheet className="w-4 h-4" />
                        Export CSV
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsCustomPDFModalOpen(true)}
                        className="gap-2 border-primary/30 hover:border-primary/60 hover:bg-primary/5 text-foreground font-medium"
                        disabled={courses.length === 0}
                    >
                        <Sliders className="w-4 h-4 text-primary" />
                        Customize & Export PDF
                    </Button>
                    <Button
                        onClick={handleOpenAdd}
                        size="sm"
                        className="gap-2 shadow-md bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                    >
                        <Plus className="w-4 h-4" />
                        Add Course
                    </Button>
                </div>
            </div>

            {/* Overview Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <Card className="p-4 sm:p-5 flex items-center gap-3.5 border-border/80">
                    <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                        <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground font-medium">Total Courses</div>
                        <div className="text-xl sm:text-2xl font-black text-foreground">
                            {stats.totalCourses}{' '}
                            <span className="text-xs font-normal text-muted-foreground">
                                ({stats.theoryCount} Th / {stats.labCount} Lab)
                            </span>
                        </div>
                    </div>
                </Card>

                <Card className="p-4 sm:p-5 flex items-center gap-3.5 border-border/80">
                    <div className="h-11 w-11 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                        <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground font-medium">Credits Tracked</div>
                        <div className="text-xl sm:text-2xl font-black text-foreground">
                            {stats.totalCredits}
                        </div>
                    </div>
                </Card>

                <Card className="p-4 sm:p-5 flex items-center gap-3.5 border-border/80">
                    <div className="h-11 w-11 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                        <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground font-medium">Average Mark (Rounded)</div>
                        <div className="text-xl sm:text-2xl font-black text-foreground">
                            {stats.avgMarks} <span className="text-xs font-normal text-muted-foreground">/ 100</span>
                        </div>
                    </div>
                </Card>

                <Card className="p-4 sm:p-5 flex items-center gap-3.5 border-border/80">
                    <div className="h-11 w-11 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                        <GraduationCap className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground font-medium">CGPA / GPA</div>
                        <div className="text-xl sm:text-2xl font-black text-foreground">
                            {stats.gpa !== null ? stats.gpa : (
                                <span className="text-sm font-semibold text-muted-foreground">
                                    {stats.gradedCount} / {stats.totalCourses} Graded
                                </span>
                            )}
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filter and Search Bar with Semester Dropdown Selector */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Semester Choose Option (as in CGPA page) */}
                    <div className="flex items-center gap-1.5 bg-muted/60 px-3 py-1.5 rounded-xl border border-border/60 text-xs">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        <span className="font-semibold text-muted-foreground">Semester:</span>
                        <select
                            value={selectedSemesterFilter}
                            onChange={(e) => setSelectedSemesterFilter(e.target.value)}
                            className="bg-transparent border-0 text-foreground font-bold focus:outline-none text-xs cursor-pointer"
                        >
                            <option value="all">All Semesters</option>
                            {semesters.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.term} {s.year}
                                </option>
                            ))}
                            <option value="none">Unassigned Semester</option>
                        </select>
                    </div>

                    {/* Type Filter Tabs */}
                    <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/60">
                        <button
                            onClick={() => setFilterType('all')}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                                filterType === 'all'
                                    ? "bg-background text-foreground shadow-xs"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            All ({courses.length})
                        </button>
                        <button
                            onClick={() => setFilterType('theory')}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all",
                                filterType === 'theory'
                                    ? "bg-background text-sky-600 dark:text-sky-400 shadow-xs"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <BookOpen className="w-3.5 h-3.5" />
                            Theory ({stats.theoryCount})
                        </button>
                        <button
                            onClick={() => setFilterType('lab')}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all",
                                filterType === 'lab'
                                    ? "bg-background text-emerald-600 dark:text-emerald-400 shadow-xs"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <FlaskConical className="w-3.5 h-3.5" />
                            Lab ({stats.labCount})
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Search */}
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search course code or name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-9 text-xs"
                        />
                    </div>

                    {/* View Switch */}
                    <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/60">
                        <button
                            onClick={() => setViewMode('table')}
                            title="Table View"
                            className={cn(
                                "p-1.5 rounded-lg transition-all",
                                viewMode === 'table'
                                    ? "bg-background text-primary shadow-xs"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <TableIcon className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('cards')}
                            title="Card View"
                            className={cn(
                                "p-1.5 rounded-lg transition-all",
                                viewMode === 'cards'
                                    ? "bg-background text-primary shadow-xs"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Courses Content */}
            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-3">
                    <div className="h-8 w-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-muted-foreground font-medium">Loading your course marks & CGPA mappings...</span>
                </div>
            ) : filteredCourses.length === 0 ? (
                <Card className="p-8 sm:p-12 text-center border-dashed border-2">
                    <Award className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                    <h3 className="text-base font-bold text-foreground">No course marks found</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                        {courses.length === 0
                            ? "Get started by adding your courses or import them directly from your existing timetable and CGPA records."
                            : "No courses match your current search, semester, or filter criteria."}
                    </p>
                    <div className="flex items-center justify-center gap-3 mt-5">
                        <Button size="sm" onClick={handleOpenAdd} className="gap-2">
                            <Plus className="w-4 h-4" /> Add Course
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setIsImportModalOpen(true)} className="gap-2">
                            <Download className="w-4 h-4" /> Import from Timetable & CGPA
                        </Button>
                    </div>
                </Card>
            ) : viewMode === 'table' ? (
                /* CLEAN SPREADSHEET TABLE: ONLY CAT 1 (15), CAT 2 (15), Internal (30), FAT (40), and Total with CGPA Grade */
                <div className="space-y-6">
                    {/* Theory Courses Section */}
                    {(filterType === 'all' || filterType === 'theory') && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-sky-500" />
                                    Theory Courses
                                </h3>
                                <span className="text-xs text-muted-foreground">
                                    Click any course code to view full breakdown popup
                                </span>
                            </div>

                            <div className="overflow-x-auto rounded-2xl border border-border/80 bg-card shadow-xs">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-border/70 bg-muted/40 text-muted-foreground font-semibold">
                                            <th className="py-3 px-4 min-w-[200px]">Course (Click for Details)</th>
                                            <th className="py-3 px-3 text-center min-w-[90px]">Slot / Cr</th>
                                            <th className="py-3 px-3 text-center min-w-[90px] bg-sky-500/5 text-sky-700 dark:text-sky-300 font-bold">
                                                CAT 1 (15)
                                            </th>
                                            <th className="py-3 px-3 text-center min-w-[90px] bg-sky-500/5 text-sky-700 dark:text-sky-300 font-bold">
                                                CAT 2 (15)
                                            </th>
                                            <th className="py-3 px-3 text-center min-w-[120px] bg-emerald-500/5 text-emerald-700 dark:text-emerald-300 font-bold">
                                                Internal (30)
                                            </th>
                                            <th className="py-3 px-3 text-center min-w-[90px] bg-indigo-500/5 text-indigo-700 dark:text-indigo-300 font-bold">
                                                FAT (40)
                                            </th>
                                            <th className="py-3 px-3 text-center min-w-[100px] font-black text-foreground">
                                                Total
                                            </th>
                                            <th className="py-3 px-3 text-center min-w-[90px]">Grade</th>
                                            <th className="py-3 px-3 text-right min-w-[100px]">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/60">
                                        {filteredCourses
                                            .filter(c => c.type === 'theory')
                                            .map((course) => {
                                                const tm = course.theory_marks;
                                                const courseGrade = course.grade;
                                                const gradeStyle = getGradeBadgeStyle(courseGrade);

                                                // List component names for internal tooltip / subtitle
                                                const compNames = tm?.internal_components?.map(comp => comp.name).filter(Boolean).join(', ');
                                                const isTheorySoft = tm?.category === 'soft_skills' ||
                                                                      tm?.cat_max_raw === 30 ||
                                                                      tm?.fat_max_raw === 50 ||
                                                                      isSoftSkillsCourse(course.course_code, course.course_name);

                                                return (
                                                    <tr
                                                        key={course.id}
                                                        className="hover:bg-muted/30 transition-colors group"
                                                    >
                                                        {/* Course Name & Code as a Link to Details Popup */}
                                                        <td className="py-3 px-4">
                                                            <button
                                                                type="button"
                                                                onClick={() => setDetailsModalCourse(course)}
                                                                className="text-left group/btn focus:outline-none"
                                                                title="Click to view all details"
                                                            >
                                                                <div className="font-extrabold text-foreground text-sm flex items-center gap-1.5 group-hover/btn:text-primary transition-colors">
                                                                    <span>{course.course_code}</span>
                                                                    {isTheorySoft && (
                                                                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold border border-amber-500/20">
                                                                            Soft Skills
                                                                        </span>
                                                                    )}
                                                                    <ExternalLink className="w-3 h-3 opacity-0 group-hover/btn:opacity-100 transition-opacity text-primary" />
                                                                </div>
                                                                <div className="text-[11px] text-muted-foreground line-clamp-1 group-hover/btn:underline">
                                                                    {course.course_name}
                                                                </div>
                                                                {course.semester_name && (
                                                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-medium mt-0.5 inline-block">
                                                                        {course.semester_name}
                                                                    </span>
                                                                )}
                                                            </button>
                                                        </td>

                                                        {/* Slot & Credits */}
                                                        <td className="py-3 px-3 text-center">
                                                            <div className="font-medium text-foreground text-[11px]">
                                                                {course.slot || '-'}
                                                            </div>
                                                            <div className="text-[10px] text-muted-foreground">
                                                                {course.credit} Cr
                                                            </div>
                                                        </td>

                                                        {/* CAT 1 (15) */}
                                                        <td className="py-3 px-3 text-center font-extrabold text-sky-600 dark:text-sky-400 bg-sky-500/5">
                                                            {tm?.cat1_weight !== null && tm?.cat1_weight !== undefined ? tm.cat1_weight : '-'}
                                                        </td>

                                                        {/* CAT 2 (15) */}
                                                        <td className="py-3 px-3 text-center font-extrabold text-sky-600 dark:text-sky-400 bg-sky-500/5">
                                                            {tm?.cat2_weight !== null && tm?.cat2_weight !== undefined ? tm.cat2_weight : '-'}
                                                        </td>

                                                        {/* Internal (30) with custom assessment names */}
                                                        <td className="py-3 px-3 text-center bg-emerald-500/5">
                                                            <div className="font-extrabold text-emerald-600 dark:text-emerald-400">
                                                                {tm?.internal_total !== null && tm?.internal_total !== undefined ? tm.internal_total : '-'}
                                                            </div>
                                                            <div className="text-[9px] text-muted-foreground line-clamp-1 max-w-[120px] mx-auto" title={compNames}>
                                                                {compNames || (tm?.internal_pattern === 'complete' ? 'Complete 30' : tm?.internal_pattern === '15_15' ? '15 + 15' : tm?.internal_pattern === '20_10' ? '20 + 10' : '10 + 10 + 10')}
                                                            </div>
                                                        </td>

                                                        {/* FAT (40) */}
                                                        <td className="py-3 px-3 text-center font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-500/5">
                                                            {tm?.fat_weight !== null && tm?.fat_weight !== undefined ? tm.fat_weight : '-'}
                                                        </td>

                                                        {/* Total */}
                                                        <td className="py-3 px-3 text-center font-black text-foreground text-sm">
                                                            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                                                                {formatMarks(course.total_marks)}
                                                            </span>
                                                        </td>

                                                        {/* Grade from CGPA (Interactive Selector) */}
                                                        <td className="py-2.5 px-3 text-center">
                                                            <select
                                                                value={courseGrade || ''}
                                                                onChange={(e) => handleQuickGradeChange(course, e.target.value)}
                                                                aria-label={`Select grade for ${course.course_code}`}
                                                                className={cn(
                                                                    "text-[10px] font-bold py-1 px-2 rounded-full border cursor-pointer transition-all focus:outline-none focus:ring-1 focus:ring-primary inline-block text-center",
                                                                    courseGrade
                                                                        ? cn(gradeStyle.bg, gradeStyle.text, gradeStyle.border)
                                                                        : "bg-muted/40 border-dashed border-border/80 text-muted-foreground hover:bg-muted"
                                                                )}
                                                            >
                                                                <option value="" className="bg-background text-foreground font-normal">
                                                                    — Not Graded —
                                                                </option>
                                                                {GRADE_OPTIONS.map((g) => (
                                                                    <option key={g.value} value={g.value} className="bg-background text-foreground font-semibold">
                                                                        {g.label}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>

                                                        {/* Actions */}
                                                        <td className="py-3 px-3 text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <button
                                                                    onClick={() => handleEditCourse(course)}
                                                                    title="Edit Course"
                                                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                                                >
                                                                    <Edit2 className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteCourse(course.id, course.course_code)}
                                                                    title="Delete"
                                                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Lab Courses Section */}
                    {(filterType === 'all' || filterType === 'lab') && (
                        <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                    <FlaskConical className="w-4 h-4 text-emerald-500" />
                                    Lab Courses
                                </h3>
                                <span className="text-xs text-muted-foreground">
                                    Click any course code to view full breakdown popup
                                </span>
                            </div>

                            <div className="overflow-x-auto rounded-2xl border border-border/80 bg-card shadow-xs">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-border/70 bg-muted/40 text-muted-foreground font-semibold">
                                            <th className="py-3 px-4 min-w-[200px]">Course (Click for Details)</th>
                                            <th className="py-3 px-3 text-center min-w-[90px]">Slot / Cr</th>
                                            <th className="py-3 px-3 text-center min-w-[110px]">Pattern</th>
                                            <th className="py-3 px-3 text-center min-w-[130px] bg-emerald-500/5 text-emerald-700 dark:text-emerald-300 font-bold">
                                                Internal
                                            </th>
                                            <th className="py-3 px-3 text-center min-w-[90px] bg-indigo-500/5 text-indigo-700 dark:text-indigo-300 font-bold">
                                                FAT (40)
                                            </th>
                                            <th className="py-3 px-3 text-center min-w-[100px] font-black text-foreground">Total</th>
                                            <th className="py-3 px-3 text-center min-w-[90px]">Grade</th>
                                            <th className="py-3 px-3 text-right min-w-[100px]">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/60">
                                        {filteredCourses
                                            .filter(c => c.type === 'lab')
                                            .map((course) => {
                                                const lm = course.lab_marks;
                                                const breakdown = getLabBreakdown(lm);
                                                const courseGrade = course.grade;
                                                const gradeStyle = getGradeBadgeStyle(courseGrade);

                                                return (
                                                    <tr
                                                        key={course.id}
                                                        className="hover:bg-muted/30 transition-colors group"
                                                    >
                                                        {/* Course Name & Code as a Link to Details Popup */}
                                                        <td className="py-3 px-4">
                                                            <button
                                                                type="button"
                                                                onClick={() => setDetailsModalCourse(course)}
                                                                className="text-left group/btn focus:outline-none"
                                                                title="Click to view all details"
                                                            >
                                                                <div className="font-extrabold text-foreground text-sm flex items-center gap-1.5 group-hover/btn:text-primary transition-colors">
                                                                    <span>{course.course_code}</span>
                                                                    <ExternalLink className="w-3 h-3 opacity-0 group-hover/btn:opacity-100 transition-opacity text-primary" />
                                                                </div>
                                                                <div className="text-[11px] text-muted-foreground line-clamp-1 group-hover/btn:underline">
                                                                    {course.course_name}
                                                                </div>
                                                                {course.semester_name && (
                                                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-medium mt-0.5 inline-block">
                                                                        {course.semester_name}
                                                                    </span>
                                                                )}
                                                            </button>
                                                        </td>

                                                        {/* Slot & Credits */}
                                                        <td className="py-3 px-3 text-center">
                                                            <div className="font-medium text-foreground text-[11px]">
                                                                {course.slot || '-'}
                                                            </div>
                                                            <div className="text-[10px] text-muted-foreground">
                                                                {course.credit} Cr
                                                            </div>
                                                        </td>

                                                        {/* Pattern Badge */}
                                                        <td className="py-3 px-3 text-center">
                                                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                                                                {breakdown.pattern_label}
                                                            </span>
                                                        </td>

                                                        {/* Internal Assessment */}
                                                        <td className="py-3 px-3 text-center bg-emerald-500/5">
                                                            <div className="font-extrabold text-emerald-600 dark:text-emerald-400">
                                                                {breakdown.has_entered_internals ? breakdown.internal_total : '-'}
                                                            </div>
                                                            <div className="text-[9px] text-muted-foreground">
                                                                out of {breakdown.max_internal}
                                                            </div>
                                                        </td>

                                                        {/* Lab FAT (40) */}
                                                        <td className="py-3 px-3 text-center bg-indigo-500/5 font-extrabold text-indigo-600 dark:text-indigo-400">
                                                            {breakdown.pattern === 'da10_nofat' ? (
                                                                <span className="text-muted-foreground font-normal text-[10px]">N/A</span>
                                                            ) : breakdown.has_entered_fat ? (
                                                                breakdown.fat_weight
                                                            ) : (
                                                                '-'
                                                            )}
                                                        </td>

                                                        {/* Total */}
                                                        <td className="py-3 px-3 text-center font-black text-foreground text-sm">
                                                            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                                                                {formatMarks(course.total_marks)}
                                                            </span>
                                                        </td>

                                                        {/* Grade from CGPA (Interactive Selector) */}
                                                        <td className="py-2.5 px-3 text-center">
                                                            <select
                                                                value={courseGrade || ''}
                                                                onChange={(e) => handleQuickGradeChange(course, e.target.value)}
                                                                aria-label={`Select grade for ${course.course_code}`}
                                                                className={cn(
                                                                    "text-[10px] font-bold py-1 px-2 rounded-full border cursor-pointer transition-all focus:outline-none focus:ring-1 focus:ring-primary inline-block text-center",
                                                                    courseGrade
                                                                        ? cn(gradeStyle.bg, gradeStyle.text, gradeStyle.border)
                                                                        : "bg-muted/40 border-dashed border-border/80 text-muted-foreground hover:bg-muted"
                                                                )}
                                                            >
                                                                <option value="" className="bg-background text-foreground font-normal">
                                                                    — Not Graded —
                                                                </option>
                                                                {GRADE_OPTIONS.map((g) => (
                                                                    <option key={g.value} value={g.value} className="bg-background text-foreground font-semibold">
                                                                        {g.label}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>

                                                        {/* Actions */}
                                                        <td className="py-3 px-3 text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <button
                                                                    onClick={() => handleEditCourse(course)}
                                                                    title="Edit Course"
                                                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                                                >
                                                                    <Edit2 className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteCourse(course.id, course.course_code)}
                                                                    title="Delete"
                                                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* CARD VIEW: Clicking on course header opens details modal */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredCourses.map((course) => {
                        const courseGrade = course.grade;
                        const gradeStyle = getGradeBadgeStyle(courseGrade);
                        const isTheory = course.type === 'theory';
                        const tm = course.theory_marks;
                        const lm = course.lab_marks;

                        return (
                            <Card
                                key={course.id}
                                className="p-5 border-border/80 hover:border-primary/40 transition-all flex flex-col justify-between"
                            >
                                <div>
                                    {/* Card Header as clickable button */}
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <button
                                            type="button"
                                            onClick={() => setDetailsModalCourse(course)}
                                            className="text-left group/btn focus:outline-none"
                                            title="Click to view all details"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="font-black text-base text-foreground group-hover/btn:text-primary transition-colors flex items-center gap-1">
                                                    {course.course_code}
                                                    <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover/btn:opacity-100 transition-opacity text-primary" />
                                                </span>
                                                <span className={cn(
                                                    "text-[10px] px-2 py-0.5 rounded-full font-semibold border",
                                                    isTheory
                                                        ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"
                                                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                                )}>
                                                    {isTheory ? 'Theory' : 'Lab'}
                                                </span>
                                                {isTheory && (tm?.category === 'soft_skills' || tm?.cat_max_raw === 30 || tm?.fat_max_raw === 50 || isSoftSkillsCourse(course.course_code, course.course_name)) && (
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold border bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
                                                        Soft Skills
                                                    </span>
                                                )}
                                            </div>
                                            <h4 className="text-xs text-muted-foreground font-medium mt-0.5 line-clamp-1 group-hover/btn:underline">
                                                {course.course_name}
                                            </h4>
                                            {course.semester_name && (
                                                <span className="text-[10px] text-muted-foreground block mt-0.5">
                                                    {course.semester_name}
                                                </span>
                                            )}
                                        </button>

                                        <div className="text-right">
                                            <select
                                                value={courseGrade || ''}
                                                onChange={(e) => handleQuickGradeChange(course, e.target.value)}
                                                aria-label={`Select grade for ${course.course_code}`}
                                                className={cn(
                                                    "text-xs font-bold py-1 px-2.5 rounded-full border cursor-pointer transition-all focus:outline-none focus:ring-1 focus:ring-primary inline-block text-center",
                                                    courseGrade
                                                        ? cn(gradeStyle.bg, gradeStyle.text, gradeStyle.border)
                                                        : "bg-muted/40 border-dashed border-border/80 text-muted-foreground hover:bg-muted"
                                                )}
                                            >
                                                <option value="" className="bg-background text-foreground font-normal">
                                                    — Not Graded —
                                                </option>
                                                {GRADE_OPTIONS.map((g) => (
                                                    <option key={g.value} value={g.value} className="bg-background text-foreground font-semibold">
                                                        {g.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="text-xs font-bold text-foreground mt-1">
                                                {formatMarks(course.total_marks)} <span className="text-[10px] font-normal text-muted-foreground">/ 100</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Slot and Credit row */}
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4 pb-3 border-b border-border/50">
                                        <span>Slot: <strong className="text-foreground">{course.slot || 'N/A'}</strong></span>
                                        <span>•</span>
                                        <span>Credits: <strong className="text-foreground">{course.credit}</strong></span>
                                    </div>

                                    {/* Breakdown Chips */}
                                    {isTheory && tm && (
                                        <div className="grid grid-cols-4 gap-1.5 text-center text-xs mb-4">
                                            <div className="p-2 rounded-xl bg-muted/40 border border-border/50">
                                                <div className="text-[10px] text-muted-foreground">CAT 1</div>
                                                <div className="font-bold text-foreground mt-0.5">
                                                    {tm.cat1_weight !== null && tm.cat1_weight !== undefined ? tm.cat1_weight : '-'} <span className="text-[9px] text-muted-foreground">/15</span>
                                                </div>
                                            </div>
                                            <div className="p-2 rounded-xl bg-muted/40 border border-border/50">
                                                <div className="text-[10px] text-muted-foreground">CAT 2</div>
                                                <div className="font-bold text-foreground mt-0.5">
                                                    {tm.cat2_weight !== null && tm.cat2_weight !== undefined ? tm.cat2_weight : '-'} <span className="text-[9px] text-muted-foreground">/15</span>
                                                </div>
                                            </div>
                                            <div className="p-2 rounded-xl bg-muted/40 border border-border/50">
                                                <div className="text-[10px] text-muted-foreground">Internal</div>
                                                <div className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                                    {tm.internal_total !== null && tm.internal_total !== undefined ? tm.internal_total : '-'} <span className="text-[9px] text-muted-foreground">/30</span>
                                                </div>
                                            </div>
                                            <div className="p-2 rounded-xl bg-muted/40 border border-border/50">
                                                <div className="text-[10px] text-muted-foreground">FAT</div>
                                                <div className="font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                                                    {tm.fat_weight !== null && tm.fat_weight !== undefined ? tm.fat_weight : '-'} <span className="text-[9px] text-muted-foreground">/40</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {!isTheory && lm && (() => {
                                        const breakdown = getLabBreakdown(lm);
                                        return (
                                            <div className="space-y-2 mb-4">
                                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                    <span>Pattern: <strong className="text-foreground">{breakdown.pattern_label}</strong></span>
                                                    <span>Max: <strong className="text-foreground">100</strong></span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                                                    <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                                                        <div className="text-[10px] text-muted-foreground font-medium">Internal Assessment</div>
                                                        <div className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5">
                                                            {breakdown.has_entered_internals ? breakdown.internal_total : '-'}{' '}
                                                            <span className="text-[10px] font-normal text-muted-foreground">/{breakdown.max_internal}</span>
                                                        </div>
                                                    </div>
                                                    <div className="p-2.5 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
                                                        <div className="text-[10px] text-muted-foreground font-medium">Lab FAT</div>
                                                        <div className="font-extrabold text-indigo-600 dark:text-indigo-400 text-sm mt-0.5">
                                                            {breakdown.pattern === 'da10_nofat' ? (
                                                                <span className="text-xs text-muted-foreground font-medium">N/A</span>
                                                            ) : (
                                                                <>
                                                                    {breakdown.has_entered_fat ? breakdown.fat_weight : '-'}{' '}
                                                                    <span className="text-[10px] font-normal text-muted-foreground">/40</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Progress Bar */}
                                    <div className="space-y-1 mb-2">
                                        <div className="flex justify-between text-[11px] text-muted-foreground font-medium">
                                            <span>Progress to 100</span>
                                            <span>{formatMarks(course.total_marks)}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                            <div
                                                className={cn(
                                                    "h-full rounded-full transition-all duration-500",
                                                    course.total_marks >= 90 ? "bg-emerald-500" :
                                                    course.total_marks >= 80 ? "bg-sky-500" :
                                                    course.total_marks >= 70 ? "bg-indigo-500" :
                                                    course.total_marks >= 50 ? "bg-amber-500" : "bg-rose-500"
                                                )}
                                                style={{ width: `${Math.min(100, course.total_marks)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Card Footer Actions */}
                                <div className="flex items-center justify-between pt-3 border-t border-border/50 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => setDetailsModalCourse(course)}
                                        className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                                    >
                                        View Details &rarr;
                                    </button>

                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEditCourse(course)}
                                            className="h-8 w-8 p-0"
                                            title="Edit Course"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteCourse(course.id, course.course_code)}
                                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Modals */}
            <AddCourseModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={fetchData}
                initialData={selectedCourseForEdit}
            />

            <ImportCoursesModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onSuccess={fetchData}
                existingCourseCodes={existingCourseCodes}
            />

            <CourseDetailsModal
                isOpen={!!detailsModalCourse}
                onClose={() => setDetailsModalCourse(null)}
                course={detailsModalCourse}
                onEdit={(c) => {
                    setSelectedCourseForEdit(c);
                    setIsAddModalOpen(true);
                }}
            />

            <CustomMarksPDFModal
                isOpen={isCustomPDFModalOpen}
                onClose={() => setIsCustomPDFModalOpen(false)}
                courses={courses}
                semesters={semesters}
            />
        </div>
    );
}
