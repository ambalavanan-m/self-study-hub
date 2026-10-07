import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { type CourseMarkEntry, getGradeBadgeStyle, isSoftSkillsCourse } from '../../lib/marks';
import {
    BookOpen,
    FlaskConical,
    Edit2,
    Calendar,
    GraduationCap,
    Clock,
    Award
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface CourseDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    course: CourseMarkEntry | null;
    onEdit?: (course: CourseMarkEntry) => void;
}

export function CourseDetailsModal({
    isOpen,
    onClose,
    course,
    onEdit,
}: CourseDetailsModalProps) {
    if (!course) return null;

    const isTheory = course.type === 'theory';
    const tm = course.theory_marks;
    const lm = course.lab_marks;

    const isSoft = isTheory && (
        tm?.category === 'soft_skills' ||
        tm?.cat_max_raw === 30 ||
        tm?.fat_max_raw === 50 ||
        isSoftSkillsCourse(course.course_code, course.course_name)
    );
    const catMax = tm?.cat_max_raw ?? (isSoft ? 30 : 50);
    const fatMax = tm?.fat_max_raw ?? (isSoft ? 50 : 100);

    const courseGrade = course.grade;
    const gradeBadge = getGradeBadgeStyle(courseGrade);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Course Details: ${course.course_code}`}
            className="max-w-2xl max-h-[90vh] overflow-y-auto"
        >
            <div className="space-y-6 pt-1">
                {/* Header Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 via-background to-secondary/30 border border-border/80 space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xl font-black text-foreground">
                                    {course.course_code}
                                </span>
                                <span className={cn(
                                    "text-xs px-2.5 py-0.5 rounded-full font-bold border",
                                    isTheory
                                        ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"
                                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                )}>
                                    {isTheory ? 'Theory' : 'Lab'}
                                </span>
                                {isSoft && (
                                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-bold">
                                        Soft Skills (CAT: /30, FAT: /50)
                                    </span>
                                )}
                                {course.semester_name && (
                                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {course.semester_name}
                                    </span>
                                )}
                            </div>
                            <h3 className="text-sm font-semibold text-foreground/90 mt-1">
                                {course.course_name}
                            </h3>
                        </div>

                        {/* Rounded Total & CGPA Grade */}
                        <div className="text-right flex flex-col items-end">
                            {courseGrade ? (
                                <span className={cn("text-xs font-black px-3 py-1 rounded-full border", gradeBadge.bg, gradeBadge.text, gradeBadge.border)}>
                                    {gradeBadge.label}
                                </span>
                            ) : (
                                <span className="text-xs px-2.5 py-0.5 rounded-full border border-border/60 bg-muted/40 text-muted-foreground font-medium">
                                    Not Graded Yet
                                </span>
                            )}
                            <div className="text-2xl font-black text-foreground mt-1">
                                {course.total_marks} <span className="text-xs font-normal text-muted-foreground">/ 100</span>
                            </div>
                        </div>
                    </div>

                    {/* Metadata Strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            <span>Slot: <strong className="text-foreground">{course.slot || 'N/A'}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-primary" />
                            <span>Credits: <strong className="text-foreground">{course.credit}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5 col-span-2 sm:col-span-2">
                            <GraduationCap className="w-3.5 h-3.5 text-primary" />
                            <span>
                                CGPA Grade:{' '}
                                {courseGrade ? (
                                    <span className={cn("px-2 py-0.5 rounded font-bold border text-[11px]", gradeBadge.bg, gradeBadge.text, gradeBadge.border)}>
                                        {gradeBadge.label}
                                    </span>
                                ) : (
                                    <span className="text-muted-foreground italic">Pending in CGPA</span>
                                )}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Theory Detailed Assessment Breakdown */}
                {isTheory && tm && (
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <Award className="w-4 h-4 text-primary" /> Theory Assessment Breakdown
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* CAT 1 */}
                            <div className="p-3.5 rounded-xl border border-border/70 bg-card space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-foreground">CAT 1</span>
                                    <span className="font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded">
                                        {tm.cat1_weight ?? 0} / 15
                                    </span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Raw score: <strong className="text-foreground">{tm.cat1_raw !== null && tm.cat1_raw !== undefined ? tm.cat1_raw : '-'}</strong> / {catMax}
                                </div>
                            </div>

                            {/* CAT 2 */}
                            <div className="p-3.5 rounded-xl border border-border/70 bg-card space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-foreground">CAT 2</span>
                                    <span className="font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded">
                                        {tm.cat2_weight ?? 0} / 15
                                    </span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Raw score: <strong className="text-foreground">{tm.cat2_raw !== null && tm.cat2_raw !== undefined ? tm.cat2_raw : '-'}</strong> / {catMax}
                                </div>
                            </div>
                        </div>

                        {/* Internal Assessments (30) with Custom Names */}
                        <div className="p-4 rounded-xl border border-border/70 bg-card space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-xs font-bold text-foreground block">
                                        Internal Continuous Assessments (30)
                                    </span>
                                    <span className="text-[11px] text-muted-foreground">
                                        Format: {tm.internal_pattern === 'complete' ? 'Single Evaluation (30)' :
                                                 tm.internal_pattern === '15_15' ? '15 + 15 Split' :
                                                 tm.internal_pattern === '20_10' ? '20 + 10 Split' : '10 + 10 + 10 Split'}
                                    </span>
                                </div>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 text-xs">
                                    Total: {tm.internal_total ?? 0} / 30
                                </span>
                            </div>

                            {/* Custom Named Components */}
                            {tm.internal_components && tm.internal_components.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    {tm.internal_components.map((comp, idx) => (
                                        <div key={idx} className="p-2.5 rounded-lg bg-muted/40 border border-border/50 text-xs">
                                            <div className="text-muted-foreground text-[11px] font-medium truncate">
                                                {comp.name || `Component ${idx + 1}`}
                                            </div>
                                            <div className="font-extrabold text-foreground text-sm mt-0.5">
                                                {comp.marks !== null && comp.marks !== undefined ? comp.marks : '-'}{' '}
                                                <span className="text-xs font-normal text-muted-foreground">/ {comp.max_marks}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-xs text-muted-foreground">
                                    Internal Score: <strong className="text-foreground">{tm.internal_total ?? 0}</strong> / 30
                                </div>
                            )}
                        </div>

                        {/* FAT (40) */}
                        <div className="p-3.5 rounded-xl border border-border/70 bg-card space-y-1">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-foreground">FAT (Final Assessment Test)</span>
                                <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                                    {tm.fat_weight ?? 0} / 40
                                </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Raw FAT: <strong className="text-foreground">{tm.fat_raw !== null && tm.fat_raw !== undefined ? tm.fat_raw : '-'}</strong> / {fatMax}
                            </div>
                        </div>

                        {/* Total Calculation Equation Banner */}
                        <div className="p-3 rounded-xl bg-muted/50 border border-border/60 text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-2">
                            <span>
                                Calculation: {tm.cat1_weight ?? 0} (CAT1) + {tm.cat2_weight ?? 0} (CAT2) + {tm.internal_total ?? 0} (Internal) + {tm.fat_weight ?? 0} (FAT)
                                {isSoft && ' • Soft Skills Scheme: CATs /30, FAT /50'}
                            </span>
                            <span className="font-bold text-foreground">
                                = {course.total_marks} / 100 (Rounded)
                            </span>
                        </div>
                    </div>
                )}

                {/* Lab Detailed Breakdown */}
                {!isTheory && lm && (
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <FlaskConical className="w-4 h-4 text-emerald-500" /> Lab Assessment Scheme
                        </h4>

                        <div className="p-4 rounded-xl border border-border/70 bg-card space-y-3">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-foreground">
                                    Pattern: {lm.pattern === 'da10_nofat' ? '10 DAs (100 Marks, No FAT)' :
                                              lm.pattern === 'cat_fat' ? 'CAT 1 & 2 (30) + FAT (40) + DAs' : '6 DAs (60) + Lab FAT (40)'}
                                </span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                    Total: {course.total_marks} / 100
                                </span>
                            </div>

                            {/* DAs Grid */}
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                {(lm.pattern === 'da10_nofat' ? [0,1,2,3,4,5,6,7,8,9] : [0,1,2,3,4,5]).map((idx) => (
                                    <div key={idx} className="p-2 rounded-lg bg-muted/40 border border-border/50 text-center text-xs">
                                        <div className="text-[10px] text-muted-foreground font-medium">DA {idx + 1}</div>
                                        <div className="font-bold text-foreground mt-0.5">
                                            {lm.da_marks?.[idx] !== null && lm.da_marks?.[idx] !== undefined ? lm.da_marks[idx] : '-'}{' '}
                                            <span className="text-[10px] font-normal text-muted-foreground">/ 10</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Lab FAT (if applicable) */}
                            {lm.pattern !== 'da10_nofat' && (
                                <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50 flex items-center justify-between text-xs">
                                    <div>
                                        <span className="font-semibold text-foreground">Lab FAT Score</span>
                                        {lm.fat_raw !== null && lm.fat_raw !== undefined && (
                                            <span className="text-[11px] text-muted-foreground ml-2">
                                                (Raw: <strong className="text-foreground">{lm.fat_raw}</strong> / 50)
                                            </span>
                                        )}
                                    </div>
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                        {lm.fat_weight ?? 0} / 40
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/50">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            onClose();
                            onEdit?.(course);
                        }}
                        className="gap-1.5"
                    >
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit Marks
                    </Button>
                    <Button size="sm" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
