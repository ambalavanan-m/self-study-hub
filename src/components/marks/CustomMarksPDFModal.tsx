import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { type CourseMarkEntry } from '../../lib/marks';
import { type Semester } from '../../lib/cgpa';
import {
    generateCustomMarksPDF,
    type CustomMarksPDFOptions
} from '../../lib/marksExport';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
    X,
    Download,
    Sparkles,
    Layers,
    FileText
} from 'lucide-react';

interface CustomMarksPDFModalProps {
    isOpen: boolean;
    onClose: () => void;
    courses?: CourseMarkEntry[];
    semesters?: Semester[];
}

export function CustomMarksPDFModal({
    isOpen,
    onClose,
    courses: initialCourses,
    semesters: initialSemesters,
}: CustomMarksPDFModalProps) {
    const { user } = useAuth();
    const [generating, setGenerating] = useState(false);
    const [courses, setCourses] = useState<CourseMarkEntry[]>(initialCourses || []);
    const [semesters, setSemesters] = useState<Semester[]>(initialSemesters || []);

    useEffect(() => {
        if (initialCourses) setCourses(initialCourses);
        if (initialSemesters) setSemesters(initialSemesters);
    }, [initialCourses, initialSemesters]);

    useEffect(() => {
        if (!isOpen || !user) return;
        const loadFallbackData = async () => {
            if (!initialCourses || initialCourses.length === 0) {
                try {
                    const qMarks = query(collection(db, 'course_marks'), where('user_id', '==', user.uid));
                    const snap = await getDocs(qMarks);
                    const list = snap.docs.map(d => ({ id: d.id, ...d.data() })) as CourseMarkEntry[];
                    setCourses(list);
                } catch (e) {
                    console.error('Error fetching marks for PDF:', e);
                }
            }
            if (!initialSemesters || initialSemesters.length === 0) {
                try {
                    const qSem = query(collection(db, 'semesters'), where('user_id', '==', user.uid));
                    const snap = await getDocs(qSem);
                    const list = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Semester[];
                    setSemesters(list);
                } catch (e) {
                    console.error('Error fetching semesters for PDF:', e);
                }
            }
        };
        loadFallbackData();
    }, [isOpen, user, initialCourses, initialSemesters]);

    // Customization state
    const [reportTitle, setReportTitle] = useState('Grade History');
    const [studentName, setStudentName] = useState(user?.displayName || '');
    const [studentId, setStudentId] = useState('');
    const [degreeName, setDegreeName] = useState('');
    const [selectedSemester, setSelectedSemester] = useState<string>('all');
    const [courseTypeFilter, setCourseTypeFilter] = useState<'all' | 'theory' | 'lab'>('all');
    const [includeDate, setIncludeDate] = useState(true);

    // Section toggles
    const [includeGradeHistoryTable, setIncludeGradeHistoryTable] = useState(true);
    const [includeSummaryKPIs, setIncludeSummaryKPIs] = useState(false);
    const [includeScoreDistribution, setIncludeScoreDistribution] = useState(false);
    const [includeTheoryTable, setIncludeTheoryTable] = useState(false);
    const [includeLabTable, setIncludeLabTable] = useState(false);
    const [includeDetailedBreakdown, setIncludeDetailedBreakdown] = useState(false);
    const [customRemarks, setCustomRemarks] = useState('');

    if (!isOpen) return null;

    // Presets
    const applyPreset = (preset: 'gradeHistory' | 'all' | 'theory' | 'lab') => {
        if (preset === 'gradeHistory') {
            setReportTitle('Grade History');
            setCourseTypeFilter('all');
            setIncludeGradeHistoryTable(true);
            setIncludeSummaryKPIs(false);
            setIncludeScoreDistribution(false);
            setIncludeTheoryTable(false);
            setIncludeLabTable(false);
            setIncludeDetailedBreakdown(false);
        } else if (preset === 'all') {
            setReportTitle('Course Marks & Assessment Report');
            setCourseTypeFilter('all');
            setIncludeGradeHistoryTable(true);
            setIncludeSummaryKPIs(true);
            setIncludeScoreDistribution(false);
            setIncludeTheoryTable(true);
            setIncludeLabTable(true);
            setIncludeDetailedBreakdown(false);
        } else if (preset === 'theory') {
            setReportTitle('Theory Courses Assessment Sheet');
            setCourseTypeFilter('theory');
            setIncludeGradeHistoryTable(false);
            setIncludeSummaryKPIs(true);
            setIncludeScoreDistribution(false);
            setIncludeTheoryTable(true);
            setIncludeLabTable(false);
            setIncludeDetailedBreakdown(true);
        } else if (preset === 'lab') {
            setReportTitle('Laboratory Assessment Log');
            setCourseTypeFilter('lab');
            setIncludeGradeHistoryTable(false);
            setIncludeSummaryKPIs(true);
            setIncludeScoreDistribution(false);
            setIncludeTheoryTable(false);
            setIncludeLabTable(true);
            setIncludeDetailedBreakdown(true);
        }
    };

    const handleGenerate = (customOptions?: Partial<CustomMarksPDFOptions>) => {
        setGenerating(true);
        try {
            const options: CustomMarksPDFOptions = {
                reportTitle: (customOptions?.reportTitle ?? reportTitle).trim() || 'Grade History',
                studentName: (customOptions?.studentName ?? studentName).trim() || user?.displayName || 'Student',
                studentId: (customOptions?.studentId ?? studentId).trim() || undefined,
                degreeName: (customOptions?.degreeName ?? degreeName).trim() || undefined,
                semesterFilter: customOptions?.semesterFilter ?? selectedSemester,
                courseTypeFilter: customOptions?.courseTypeFilter ?? courseTypeFilter,
                includeDate: customOptions?.includeDate ?? includeDate,
                includeGradeHistoryTable: customOptions?.includeGradeHistoryTable ?? includeGradeHistoryTable,
                includeSummaryKPIs: customOptions?.includeSummaryKPIs ?? includeSummaryKPIs,
                includeScoreDistribution: customOptions?.includeScoreDistribution ?? includeScoreDistribution,
                includeTheoryTable: customOptions?.includeTheoryTable ?? includeTheoryTable,
                includeLabTable: customOptions?.includeLabTable ?? includeLabTable,
                includeDetailedBreakdown: customOptions?.includeDetailedBreakdown ?? includeDetailedBreakdown,
                customRemarks: (customOptions?.customRemarks ?? customRemarks).trim() || undefined,
            };

            generateCustomMarksPDF(courses, options, semesters);
            onClose();
        } catch (err) {
            console.error('Error generating custom Marks PDF:', err);
            alert('Failed to generate PDF. Please check your data and try again.');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in">
            {/* Wider modal with no vertical scrolling */}
            <div className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between bg-card">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <FileText className="h-4.5 w-4.5" />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-foreground leading-tight">
                                Custom Marks PDF Export
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Clean black-and-white academic transcript with bordered tables.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                        aria-label="Close modal"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body - 2 Column Balanced Layout (No Scrollbar) */}
                <div className="p-6">
                    {/* Presets Bar */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <Sparkles className="h-3.5 w-3.5 text-primary" /> Quick Presets
                            </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <button
                                type="button"
                                onClick={() => applyPreset('gradeHistory')}
                                className="px-3 py-1.5 rounded-lg border border-primary/50 bg-primary/10 hover:bg-primary/20 text-xs font-bold text-primary transition-all cursor-pointer text-center"
                            >
                                Grade History (Official)
                            </button>
                            <button
                                type="button"
                                onClick={() => applyPreset('all')}
                                className="px-3 py-1.5 rounded-lg border border-border/70 bg-muted/20 hover:bg-primary/10 hover:border-primary/40 text-xs font-semibold text-foreground transition-all cursor-pointer text-center"
                            >
                                All-in-One Full
                            </button>
                            <button
                                type="button"
                                onClick={() => applyPreset('theory')}
                                className="px-3 py-1.5 rounded-lg border border-border/70 bg-muted/20 hover:bg-primary/10 hover:border-primary/40 text-xs font-semibold text-foreground transition-all cursor-pointer text-center"
                            >
                                Theory Assessment
                            </button>
                            <button
                                type="button"
                                onClick={() => applyPreset('lab')}
                                className="px-3 py-1.5 rounded-lg border border-border/70 bg-muted/20 hover:bg-primary/10 hover:border-primary/40 text-xs font-semibold text-foreground transition-all cursor-pointer text-center"
                            >
                                Lab Assessment
                            </button>
                        </div>
                    </div>

                    {/* 2-Column Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-border/50">
                        {/* LEFT COLUMN: Metadata & Scope */}
                        <div className="space-y-3">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                                1. Document & Student Information
                            </span>

                            <Input
                                label="Document Title"
                                value={reportTitle}
                                onChange={(e) => setReportTitle(e.target.value)}
                                placeholder="Course Marks & Assessment Report"
                            />

                            <div className="grid grid-cols-2 gap-2.5">
                                <Input
                                    label="Student Name"
                                    value={studentName}
                                    onChange={(e) => setStudentName(e.target.value)}
                                    placeholder="Full Name"
                                />
                                <Input
                                    label="Student / Reg ID"
                                    value={studentId}
                                    onChange={(e) => setStudentId(e.target.value)}
                                    placeholder="e.g. 22BCE1001"
                                />
                            </div>

                            <Input
                                label="Program / Branch Name"
                                value={degreeName}
                                onChange={(e) => setDegreeName(e.target.value)}
                                placeholder="e.g. B.Tech Computer Science"
                            />

                            {/* Scope Filters */}
                            <div className="pt-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-2">
                                    <Layers className="h-3 w-3 text-primary" /> 2. Data Scope & Course Filters
                                </span>
                                <div className="grid grid-cols-2 gap-2.5">
                                    <div>
                                        <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                                            Semester
                                        </label>
                                        <select
                                            value={selectedSemester}
                                            onChange={(e) => setSelectedSemester(e.target.value)}
                                            className="w-full bg-background border border-input rounded-xl px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-hidden"
                                        >
                                            <option value="all">All Semesters</option>
                                            {semesters.map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.term} {s.year}
                                                </option>
                                            ))}
                                            <option value="none">Unassigned</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                                            Course Type
                                        </label>
                                        <select
                                            value={courseTypeFilter}
                                            onChange={(e) => setCourseTypeFilter(e.target.value as any)}
                                            className="w-full bg-background border border-input rounded-xl px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-hidden"
                                        >
                                            <option value="all">All Courses (Theory & Lab)</option>
                                            <option value="theory">Theory Only</option>
                                            <option value="lab">Lab Only</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Sections & Remarks */}
                        <div className="space-y-3 flex flex-col justify-between">
                            <div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                                    3. Sections to Include
                                </span>

                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 p-2 rounded-xl border border-primary/50 bg-primary/5 hover:bg-primary/10 cursor-pointer select-none transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={includeGradeHistoryTable}
                                            onChange={(e) => setIncludeGradeHistoryTable(e.target.checked)}
                                            className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5"
                                        />
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-foreground">Grade History Table (As per Image)</span>
                                            <span className="text-[10px] text-muted-foreground">TH/LO/SS, Credits, Grades, Exam Month, Declared On, Distribution</span>
                                        </div>
                                    </label>

                                    <div className="grid grid-cols-2 gap-2">
                                        <label className="flex items-center gap-2 p-2 rounded-xl border border-border/60 hover:bg-muted/20 cursor-pointer select-none transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={includeSummaryKPIs}
                                                onChange={(e) => setIncludeSummaryKPIs(e.target.checked)}
                                                className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5"
                                            />
                                            <span className="text-xs font-semibold text-foreground">Executive KPIs</span>
                                        </label>

                                        <label className="flex items-center gap-2 p-2 rounded-xl border border-border/60 hover:bg-muted/20 cursor-pointer select-none transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={includeScoreDistribution}
                                                onChange={(e) => setIncludeScoreDistribution(e.target.checked)}
                                                className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5"
                                            />
                                            <span className="text-xs font-semibold text-foreground">Score Brackets</span>
                                        </label>

                                        <label className="flex items-center gap-2 p-2 rounded-xl border border-border/60 hover:bg-muted/20 cursor-pointer select-none transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={includeTheoryTable}
                                                onChange={(e) => setIncludeTheoryTable(e.target.checked)}
                                                className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5"
                                            />
                                            <span className="text-xs font-semibold text-foreground">Theory CAT/FAT</span>
                                        </label>

                                        <label className="flex items-center gap-2 p-2 rounded-xl border border-border/60 hover:bg-muted/20 cursor-pointer select-none transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={includeLabTable}
                                                onChange={(e) => setIncludeLabTable(e.target.checked)}
                                                className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5"
                                            />
                                            <span className="text-xs font-semibold text-foreground">Lab Assessments</span>
                                        </label>
                                    </div>

                                    <label className="flex items-center gap-2 p-2 rounded-xl border border-border/60 hover:bg-muted/20 cursor-pointer select-none transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={includeDetailedBreakdown}
                                            onChange={(e) => setIncludeDetailedBreakdown(e.target.checked)}
                                            className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5"
                                        />
                                        <span className="text-xs font-semibold text-foreground">Detailed Components (Quizzes & DAs)</span>
                                    </label>
                                </div>

                                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none mt-2.5">
                                    <input
                                        type="checkbox"
                                        checked={includeDate}
                                        onChange={(e) => setIncludeDate(e.target.checked)}
                                        className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5"
                                    />
                                    <span>Include generation date on document</span>
                                </label>
                            </div>

                            {/* Remarks */}
                            <div>
                                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                                    4. Academic Remarks / Notes (Optional)
                                </label>
                                <textarea
                                    value={customRemarks}
                                    onChange={(e) => setCustomRemarks(e.target.value)}
                                    rows={2}
                                    placeholder="Add any personal remarks or notes..."
                                    className="w-full bg-background border border-input rounded-xl px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-hidden resize-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-3.5 border-t border-border/50 flex items-center justify-between bg-muted/10">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>

                    <Button
                        variant="primary"
                        size="sm"
                        disabled={generating}
                        onClick={() => handleGenerate()}
                        className="gap-2 font-bold px-5"
                    >
                        {generating ? (
                            <>
                                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                Generating PDF...
                            </>
                        ) : (
                            <>
                                <Download className="h-4 w-4" />
                                Download PDF
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
