import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { type Semester, type Subject } from '../../lib/cgpa';
import { generateCustomAcademicPDF, type CustomPDFOptions } from '../../lib/export';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
    X, 
    Download, 
    FileText, 
    CheckSquare, 
    Square, 
    Sparkles, 
    Layers, 
    BarChart3, 
    GraduationCap, 
    Palette 
} from 'lucide-react';

interface CustomPDFModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CustomPDFModal({ isOpen, onClose }: CustomPDFModalProps) {
    const { user } = useAuth();
    const [generating, setGenerating] = useState(false);

    // Customization state
    const [reportTitle, setReportTitle] = useState('Academic Progress & Degree Report');
    const [studentName, setStudentName] = useState(user?.displayName || 'Student');
    const [studentId, setStudentId] = useState('');
    const [degreeName, setDegreeName] = useState('');
    const [includeDate, setIncludeDate] = useState(true);
    const [themeColor, setThemeColor] = useState<'emerald' | 'cyan' | 'indigo' | 'slate'>('emerald');

    // Section toggles
    const [includeSummaryKPIs, setIncludeSummaryKPIs] = useState(true);
    const [includeGradeDistribution, setIncludeGradeDistribution] = useState(true);
    const [includeCGPAHistory, setIncludeCGPAHistory] = useState(true);
    const [includeCurriculumBaskets, setIncludeCurriculumBaskets] = useState(true);
    const [includeCurriculumCourseList, setIncludeCurriculumCourseList] = useState(true);

    if (!isOpen) return null;

    // Presets
    const applyPreset = (preset: 'all' | 'cgpa' | 'curriculum' | 'grades') => {
        if (preset === 'all') {
            setReportTitle('Comprehensive Academic & Degree Portfolio');
            setIncludeSummaryKPIs(true);
            setIncludeGradeDistribution(true);
            setIncludeCGPAHistory(true);
            setIncludeCurriculumBaskets(true);
            setIncludeCurriculumCourseList(true);
        } else if (preset === 'cgpa') {
            setReportTitle('Academic Transcript & Semester Progression');
            setIncludeSummaryKPIs(true);
            setIncludeGradeDistribution(false);
            setIncludeCGPAHistory(true);
            setIncludeCurriculumBaskets(false);
            setIncludeCurriculumCourseList(false);
        } else if (preset === 'curriculum') {
            setReportTitle('Degree Curriculum Baskets & Course Audit');
            setIncludeSummaryKPIs(true);
            setIncludeGradeDistribution(false);
            setIncludeCGPAHistory(false);
            setIncludeCurriculumBaskets(true);
            setIncludeCurriculumCourseList(true);
        } else if (preset === 'grades') {
            setReportTitle('Grade Distribution & Performance Report');
            setIncludeSummaryKPIs(true);
            setIncludeGradeDistribution(true);
            setIncludeCGPAHistory(false);
            setIncludeCurriculumBaskets(false);
            setIncludeCurriculumCourseList(false);
        }
    };

    const handleGeneratePDF = async () => {
        if (!user) return;
        setGenerating(true);

        try {
            const semestersQuery = query(collection(db, 'semesters'), where('user_id', '==', user.uid));
            const semestersSnapshot = await getDocs(semestersQuery);
            const semestersData = semestersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const subjectsQuery = query(collection(db, 'subjects'), where('user_id', '==', user.uid));
            const subjectsSnapshot = await getDocs(subjectsQuery);
            const subjectsData = subjectsSnapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data(),
                credit: Number((doc.data() as any).credit) || 0
            })) as (Subject & { semester_id: string })[];

            const combined = semestersData.map(sem => ({
                ...sem,
                subjects: subjectsData.filter((sub) => sub.semester_id === sem.id)
            })) as unknown as Semester[];

            // Sort semesters by year descending, then term
            const termOrder = { 'Fall': 3, 'Winter': 2, 'Spring': 1, 'Summer': 0 };
            combined.sort((a, b) => {
                if (a.year !== b.year) return b.year - a.year;
                return (termOrder[b.term as keyof typeof termOrder] || 0) - (termOrder[a.term as keyof typeof termOrder] || 0);
            });

            const options: CustomPDFOptions = {
                reportTitle: reportTitle.trim() || 'Academic Progress & Degree Report',
                studentName: studentName.trim() || user.displayName || 'Student',
                studentId: studentId.trim() || undefined,
                degreeName: degreeName.trim() || undefined,
                includeDate,
                themeColor,
                includeSummaryKPIs,
                includeGradeDistribution,
                includeCGPAHistory,
                includeCurriculumBaskets,
                includeCurriculumCourseList,
            };

            generateCustomAcademicPDF(combined, options);
            onClose();
        } catch (error) {
            console.error('Error generating custom PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden flex flex-col">
                {/* Modal Header */}
                <div className="p-6 border-b border-border/50 flex items-center justify-between sticky top-0 bg-card/95 backdrop-blur-md z-10">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Custom Academic PDF Builder</h2>
                            <p className="text-xs text-muted-foreground">
                                Customize and export CGPA, Grades, and Curriculum into a single report.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-6 flex-1">
                    {/* Quick Presets */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-primary" /> Quick Presets
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <button
                                type="button"
                                onClick={() => applyPreset('all')}
                                className="px-3 py-2 rounded-xl border border-border/60 bg-muted/30 hover:bg-primary/10 hover:border-primary/40 text-xs font-semibold text-foreground transition-all cursor-pointer text-center"
                            >
                                All-in-One Report
                            </button>
                            <button
                                type="button"
                                onClick={() => applyPreset('cgpa')}
                                className="px-3 py-2 rounded-xl border border-border/60 bg-muted/30 hover:bg-primary/10 hover:border-primary/40 text-xs font-semibold text-foreground transition-all cursor-pointer text-center"
                            >
                                CGPA Only
                            </button>
                            <button
                                type="button"
                                onClick={() => applyPreset('grades')}
                                className="px-3 py-2 rounded-xl border border-border/60 bg-muted/30 hover:bg-primary/10 hover:border-primary/40 text-xs font-semibold text-foreground transition-all cursor-pointer text-center"
                            >
                                Grade Stats Only
                            </button>
                            <button
                                type="button"
                                onClick={() => applyPreset('curriculum')}
                                className="px-3 py-2 rounded-xl border border-border/60 bg-muted/30 hover:bg-primary/10 hover:border-primary/40 text-xs font-semibold text-foreground transition-all cursor-pointer text-center"
                            >
                                Curriculum Only
                            </button>
                        </div>
                    </div>

                    {/* Report Information Form */}
                    <div className="space-y-4 pt-2 border-t border-border/50">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            1. Header & Student Information
                        </label>

                        <div className="space-y-3">
                            <Input
                                label="Document Title"
                                value={reportTitle}
                                onChange={(e) => setReportTitle(e.target.value)}
                                placeholder="e.g. Comprehensive Academic Transcript"
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Input
                                    label="Student Full Name"
                                    value={studentName}
                                    onChange={(e) => setStudentName(e.target.value)}
                                    placeholder="Enter full name"
                                />
                                <Input
                                    label="Student / Registration ID"
                                    value={studentId}
                                    onChange={(e) => setStudentId(e.target.value)}
                                    placeholder="e.g. 22BCE1001"
                                />
                            </div>

                            <Input
                                label="Degree / Branch Name"
                                value={degreeName}
                                onChange={(e) => setDegreeName(e.target.value)}
                                placeholder="e.g. B.Tech Computer Science & Engineering"
                            />

                            <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer select-none pt-1">
                                <input
                                    type="checkbox"
                                    checked={includeDate}
                                    onChange={(e) => setIncludeDate(e.target.checked)}
                                    className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                                />
                                <span>Include report generation date</span>
                            </label>
                        </div>
                    </div>

                    {/* Color Theme Selector */}
                    <div className="space-y-2 pt-2 border-t border-border/50">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Palette className="h-3.5 w-3.5" /> 2. PDF Accent Color
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                                { key: 'emerald', label: 'Emerald Green', color: 'bg-[#1b8057]' },
                                { key: 'cyan', label: 'Cyan Ocean', color: 'bg-[#00a8cc]' },
                                { key: 'indigo', label: 'Royal Indigo', color: 'bg-[#4f46e5]' },
                                { key: 'slate', label: 'Charcoal Slate', color: 'bg-[#334155]' },
                            ].map(item => (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => setThemeColor(item.key as any)}
                                    className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold transition-all cursor-pointer ${
                                        themeColor === item.key
                                            ? 'border-primary ring-2 ring-primary/40 bg-primary/5 shadow-xs'
                                            : 'border-border/60 hover:border-border'
                                    }`}
                                >
                                    <span className={`h-4 w-4 rounded-full ${item.color} shrink-0`} />
                                    <span>{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sections To Include */}
                    <div className="space-y-3 pt-2 border-t border-border/50">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            3. Select Report Sections
                        </label>

                        <div className="space-y-2.5">
                            {/* Summary KPIs */}
                            <div 
                                onClick={() => setIncludeSummaryKPIs(!includeSummaryKPIs)}
                                className="p-3.5 rounded-2xl border border-border/60 hover:border-border bg-card flex items-start gap-3 cursor-pointer transition-colors"
                            >
                                {includeSummaryKPIs ? (
                                    <CheckSquare className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                ) : (
                                    <Square className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                                )}
                                <div>
                                    <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                                        <GraduationCap className="h-4 w-4 text-primary" /> Executive Academic Summary (KPIs)
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Includes overall CGPA, Total Earned Credits, Total Courses, and 120-credit degree target completion percentage.
                                    </p>
                                </div>
                            </div>

                            {/* Grade Distribution */}
                            <div 
                                onClick={() => setIncludeGradeDistribution(!includeGradeDistribution)}
                                className="p-3.5 rounded-2xl border border-border/60 hover:border-border bg-card flex items-start gap-3 cursor-pointer transition-colors"
                            >
                                {includeGradeDistribution ? (
                                    <CheckSquare className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                ) : (
                                    <Square className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                                )}
                                <div>
                                    <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                                        <BarChart3 className="h-4 w-4 text-primary" /> Grade Distribution & Breakdown
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Statistical breakdown of grades (S, A, B, C, D, E, F, N, Pass, Absent) with subject counts, points, and total credits per grade.
                                    </p>
                                </div>
                            </div>

                            {/* CGPA History */}
                            <div 
                                onClick={() => setIncludeCGPAHistory(!includeCGPAHistory)}
                                className="p-3.5 rounded-2xl border border-border/60 hover:border-border bg-card flex items-start gap-3 cursor-pointer transition-colors"
                            >
                                {includeCGPAHistory ? (
                                    <CheckSquare className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                ) : (
                                    <Square className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                                )}
                                <div>
                                    <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                                        <FileText className="h-4 w-4 text-primary" /> Semester-Wise Academic Progression (CGPA & GPA)
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Academic year groupings, semester GPA tables, subject details, credits, and consecutive paired theory & lab courses.
                                    </p>
                                </div>
                            </div>

                            {/* Curriculum Baskets */}
                            <div 
                                onClick={() => setIncludeCurriculumBaskets(!includeCurriculumBaskets)}
                                className="p-3.5 rounded-2xl border border-border/60 hover:border-border bg-card flex items-start gap-3 cursor-pointer transition-colors"
                            >
                                {includeCurriculumBaskets ? (
                                    <CheckSquare className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                ) : (
                                    <Square className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                                )}
                                <div>
                                    <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                                        <Layers className="h-4 w-4 text-primary" /> Degree Curriculum Baskets (120-Credit Audit)
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Category-by-category status for Discipline Core (60), Elective (24), Project (2), Open Elective (9), AE (8), SE (9), VAC (8).
                                    </p>
                                </div>
                            </div>

                            {/* Curriculum Course List Sub-option */}
                            {includeCurriculumBaskets && (
                                <div className="ml-8 p-2.5 rounded-xl bg-muted/30 border border-border/40 flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground font-medium">Include detailed course tables inside each curriculum basket</span>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={includeCurriculumCourseList}
                                            onChange={(e) => setIncludeCurriculumCourseList(e.target.checked)}
                                            className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                                        />
                                        <span className="font-semibold text-foreground">{includeCurriculumCourseList ? 'Yes' : 'No'}</span>
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-5 border-t border-border/50 bg-card/95 backdrop-blur-md flex items-center justify-between gap-3 sticky bottom-0 z-10">
                    <Button variant="ghost" onClick={onClose} disabled={generating}>
                        Cancel
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={handleGeneratePDF}
                        isLoading={generating}
                        className="gap-2 px-5"
                    >
                        <Download className="h-4 w-4" />
                        Generate & Download PDF
                    </Button>
                </div>
            </div>
        </div>
    );
}
