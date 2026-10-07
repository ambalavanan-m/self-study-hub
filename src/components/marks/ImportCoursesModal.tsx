import { useState, useEffect } from 'react';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { type CourseMarkEntry, type CourseType, isSoftSkillsCourse } from '../../lib/marks';
import { Download, Check, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ImportCoursesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    existingCourseCodes: Set<string>;
}

interface SourceCourse {
    course_name: string;
    course_code: string;
    slot: string;
    credit: number;
    type: CourseType;
    source: string;
    semester_id?: string;
    semester_name?: string;
    cgpa_grade?: string;
}

export function ImportCoursesModal({
    isOpen,
    onClose,
    onSuccess,
    existingCourseCodes,
}: ImportCoursesModalProps) {
    const { user } = useAuth();
    const { showNotification } = useNotification();
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);
    const [availableCourses, setAvailableCourses] = useState<SourceCourse[]>([]);
    const [selectedIndexes, setSelectedIndexes] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (!isOpen || !user) return;

        const fetchSources = async () => {
            setLoading(true);
            try {
                // Fetch semesters map for semester name resolution
                const semQuery = query(collection(db, 'semesters'), where('user_id', '==', user.uid));
                const semSnap = await getDocs(semQuery);
                const semesterMap = new Map<string, string>();
                semSnap.docs.forEach(d => {
                    const data = d.data();
                    semesterMap.set(d.id, `${data.term || ''} ${data.year || ''}`.trim());
                });

                const uniqueMap = new Map<string, SourceCourse>();

                // 1. Fetch from Timetable basic
                const timetableQuery = query(collection(db, 'timetable_entries'), where('user_id', '==', user.uid));
                const timetableSnap = await getDocs(timetableQuery);
                timetableSnap.docs.forEach((docSnap) => {
                    const data = docSnap.data();
                    const code = (data.subject_code || '').trim().toUpperCase();
                    if (code && !uniqueMap.has(code)) {
                        uniqueMap.set(code, {
                            course_code: code,
                            course_name: data.subject_name || code,
                            slot: data.slot_code || data.slot_label || '',
                            credit: Number(data.credit) || 3,
                            type: (data.type === 'lab' ? 'lab' : 'theory') as CourseType,
                            source: 'Timetable',
                        });
                    }
                });

                // 2. Fetch from Smart Timetable
                const smartQuery = query(collection(db, 'smart_timetable_entries'), where('user_id', '==', user.uid));
                const smartSnap = await getDocs(smartQuery);
                smartSnap.docs.forEach((docSnap) => {
                    const data = docSnap.data();
                    const code = (data.subject_code || '').trim().toUpperCase();
                    if (code && !uniqueMap.has(code)) {
                        uniqueMap.set(code, {
                            course_code: code,
                            course_name: data.subject_name || code,
                            slot: data.slot_code || data.slot_label || '',
                            credit: Number(data.credit) || 3,
                            type: (data.type === 'lab' ? 'lab' : 'theory') as CourseType,
                            source: 'Smart Timetable',
                        });
                    }
                });

                // 3. Fetch from CGPA subjects
                const subjectsQuery = query(collection(db, 'subjects'), where('user_id', '==', user.uid));
                const subjectsSnap = await getDocs(subjectsQuery);
                subjectsSnap.docs.forEach((docSnap) => {
                    const data = docSnap.data();
                    const code = (data.subject_code || data.code || '').trim().toUpperCase();
                    const name = data.subject_name || data.name || code;
                    const semId = data.semester_id || '';
                    const semLabel = semesterMap.get(semId) || '';

                    if (code) {
                        const isLab = name.toLowerCase().includes('lab') || (code.endsWith('L') || code.endsWith('P'));
                        if (uniqueMap.has(code)) {
                            // Enhance with semester & grade
                            const existing = uniqueMap.get(code)!;
                            existing.semester_id = existing.semester_id || semId;
                            existing.semester_name = existing.semester_name || semLabel;
                            existing.cgpa_grade = existing.cgpa_grade || data.grade;
                        } else {
                            uniqueMap.set(code, {
                                course_code: code,
                                course_name: name,
                                slot: '',
                                credit: Number(data.credit) || 3,
                                type: isLab ? 'lab' : 'theory',
                                source: 'CGPA',
                                semester_id: semId,
                                semester_name: semLabel,
                                cgpa_grade: data.grade,
                            });
                        }
                    }
                });

                const list = Array.from(uniqueMap.values());
                setAvailableCourses(list);

                // Pre-select courses that are not yet added to Marks
                const newIndexes = new Set<number>();
                list.forEach((c, idx) => {
                    if (!existingCourseCodes.has(c.course_code)) {
                        newIndexes.add(idx);
                    }
                });
                setSelectedIndexes(newIndexes);
            } catch (err) {
                console.error('Error fetching source courses:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSources();
    }, [isOpen, user, existingCourseCodes]);

    const toggleSelect = (idx: number) => {
        const next = new Set(selectedIndexes);
        if (next.has(idx)) {
            next.delete(idx);
        } else {
            next.add(idx);
        }
        setSelectedIndexes(next);
    };

    const handleSelectAll = () => {
        if (selectedIndexes.size === availableCourses.length) {
            setSelectedIndexes(new Set());
        } else {
            setSelectedIndexes(new Set(availableCourses.map((_, i) => i)));
        }
    };

    const handleImport = async () => {
        if (!user || selectedIndexes.size === 0) return;
        setImporting(true);

        try {
            const promises = Array.from(selectedIndexes).map(async (idx) => {
                const c = availableCourses[idx];
                const newEntry: Partial<CourseMarkEntry> = {
                    user_id: user.uid,
                    course_name: c.course_name,
                    course_code: c.course_code,
                    slot: c.slot || 'N/A',
                    credit: c.credit,
                    type: c.type,
                    semester_id: c.semester_id || undefined,
                    semester_name: c.semester_name || undefined,
                    grade: c.cgpa_grade || undefined,
                    total_marks: 0,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };

                if (c.type === 'theory') {
                    const isSoft = isSoftSkillsCourse(c.course_code, c.course_name);
                    newEntry.theory_marks = {
                        category: isSoft ? 'soft_skills' : 'standard',
                        cat_max_raw: isSoft ? 30 : 50,
                        cat1_raw: null,
                        cat1_weight: null,
                        cat2_raw: null,
                        cat2_weight: null,
                        internal_pattern: 'complete',
                        internal_components: [
                            { name: 'Internal Assessment', max_marks: 30, marks: null }
                        ],
                        internal_total: 0,
                        fat_max_raw: isSoft ? 50 : 100,
                        fat_raw: null,
                        fat_weight: null,
                    };
                } else {
                    newEntry.lab_marks = {
                        pattern: 'da6_fat',
                        da_marks: Array(10).fill(null),
                        fat_raw: null,
                        fat_weight: null,
                    };
                }

                return addDoc(collection(db, 'course_marks'), newEntry);
            });

            await Promise.all(promises);
            showNotification(`Successfully imported ${selectedIndexes.size} course(s)!`, 'success');
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error importing courses:', err);
            showNotification(err.message || 'Import failed', 'error');
        } finally {
            setImporting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Import Courses from Timetable & CGPA"
            className="max-w-xl max-h-[85vh] overflow-y-auto"
        >
            <div className="space-y-4 pt-2">
                <p className="text-xs text-muted-foreground">
                    Instantly import your existing courses and semester links into the Marks tracker.
                </p>

                {loading ? (
                    <div className="py-12 flex flex-col items-center justify-center space-y-2">
                        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs text-muted-foreground">Scanning timetable & CGPA subjects...</span>
                    </div>
                ) : availableCourses.length === 0 ? (
                    <div className="py-8 text-center bg-muted/30 rounded-2xl border border-dashed border-border/80">
                        <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                        <p className="text-sm font-medium text-foreground">No timetable or CGPA courses found</p>
                        <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                            Add classes in your Timetable first or use the manual "Add Course" button.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between px-1">
                            <span className="text-xs font-semibold text-muted-foreground">
                                {availableCourses.length} course(s) discovered
                            </span>
                            <button
                                type="button"
                                onClick={handleSelectAll}
                                className="text-xs font-semibold text-primary hover:underline"
                            >
                                {selectedIndexes.size === availableCourses.length ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>

                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                            {availableCourses.map((c, idx) => {
                                const isAlreadyAdded = existingCourseCodes.has(c.course_code);
                                const isSelected = selectedIndexes.has(idx);

                                return (
                                    <div
                                        key={`${c.course_code}-${idx}`}
                                        onClick={() => toggleSelect(idx)}
                                        className={cn(
                                            "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none",
                                            isSelected
                                                ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/30"
                                                : "border-border/60 hover:bg-muted/40 bg-card"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={cn(
                                                    "w-5 h-5 rounded-md flex items-center justify-center border transition-colors",
                                                    isSelected
                                                        ? "bg-primary border-primary text-primary-foreground"
                                                        : "border-muted-foreground/30 bg-background"
                                                )}
                                            >
                                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-xs font-bold text-foreground">
                                                        {c.course_code}
                                                    </span>
                                                    <span className={cn(
                                                        "text-[10px] px-1.5 py-0.2 rounded font-medium border",
                                                        c.type === 'theory'
                                                            ? "bg-sky-500/10 text-sky-600 border-sky-500/20"
                                                            : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                                    )}>
                                                        {c.type === 'theory' ? 'Theory' : 'Lab'}
                                                    </span>
                                                    {c.semester_name && (
                                                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20 font-medium">
                                                            {c.semester_name}
                                                        </span>
                                                    )}
                                                    {c.cgpa_grade && (
                                                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-medium">
                                                            Grade {c.cgpa_grade}
                                                        </span>
                                                    )}
                                                    {isAlreadyAdded && (
                                                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20 font-medium">
                                                            Already tracked
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground line-clamp-1">
                                                    {c.course_name}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-right text-[11px] text-muted-foreground">
                                            {c.slot ? `Slot: ${c.slot}` : ''}
                                            <div className="text-[10px] opacity-75">{c.credit} Credits</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/50">
                    <Button variant="outline" onClick={onClose} disabled={importing}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleImport}
                        isLoading={importing}
                        disabled={selectedIndexes.size === 0 || availableCourses.length === 0}
                        className="gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Import {selectedIndexes.size > 0 ? `(${selectedIndexes.size})` : ''}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
