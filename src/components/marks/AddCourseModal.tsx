import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { collection, addDoc, doc, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
    type CourseMarkEntry,
    type CourseType,
    type TheoryCourseCategory,
    type TheoryInternalPattern,
    type LabPattern,
    type InternalComponent,
    calculateTheoryMarks,
    calculateLabMarks,
    getGradeBadgeStyle,
    isSoftSkillsCourse
} from '../../lib/marks';
import { type Grade } from '../../lib/cgpa';
import { BookOpen, FlaskConical, Sparkles, Calendar, Tag, GraduationCap } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AddCourseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: CourseMarkEntry | null;
}

const COMMON_SLOTS = [
    'A1+TA1', 'B1+TB1', 'C1+TC1', 'D1+TD1', 'E1+TE1', 'F1+TF1', 'G1+TG1',
    'A2+TA2', 'B2+TB2', 'C2+TC2', 'D2+TD2', 'E2+TE2', 'F2+TF2', 'G2+TG2',
    'L1+L2', 'L3+L4', 'L5+L6', 'L7+L8', 'L9+L10', 'L11+L12',
    'L31+L32', 'L33+L34', 'L35+L36', 'L37+L38', 'L39+L40'
];

const PRESET_NAMES = [
    'Quiz 1',
    'Quiz 2',
    'Seminar',
    'Case Study',
    'Assignment',
    'Digital Assignment',
    'Project',
    'Mid-Term'
];

const GRADE_OPTIONS: { value: Grade; label: string }[] = [
    { value: 'S', label: 'S (10 pts)' },
    { value: 'A', label: 'A (9 pts)' },
    { value: 'B', label: 'B (8 pts)' },
    { value: 'C', label: 'C (7 pts)' },
    { value: 'D', label: 'D (6 pts)' },
    { value: 'E', label: 'E (5 pts)' },
    { value: 'F', label: 'F (Fail)' },
    { value: 'N', label: 'N (No Grade)' },
    { value: 'P', label: 'Pass (Non-Credit)' },
    { value: 'A_ABSENT', label: 'Absent' },
];

interface SemesterOption {
    id: string;
    label: string;
}

export function AddCourseModal({ isOpen, onClose, onSuccess, initialData }: AddCourseModalProps) {
    const { user } = useAuth();
    const { showNotification } = useNotification();
    const [loading, setLoading] = useState(false);

    // Semesters list
    const [semestersList, setSemestersList] = useState<SemesterOption[]>([]);
    const [selectedSemesterId, setSelectedSemesterId] = useState<string>('');

    // Grade from CGPA
    const [selectedGrade, setSelectedGrade] = useState<string>('');

    // Basic course fields
    const [courseName, setCourseName] = useState('');
    const [courseCode, setCourseCode] = useState('');
    const [slot, setSlot] = useState('A1+TA1');
    const [credit, setCredit] = useState<number>(3);
    const [courseType, setCourseType] = useState<CourseType>('theory');

    // Theory state
    const [theoryCategory, setTheoryCategory] = useState<TheoryCourseCategory>('standard');
    const [cat1Raw, setCat1Raw] = useState<string>('');
    const [cat1Weight, setCat1Weight] = useState<string>('');
    const [cat2Raw, setCat2Raw] = useState<string>('');
    const [cat2Weight, setCat2Weight] = useState<string>('');
    const [internalPattern, setInternalPattern] = useState<TheoryInternalPattern>('complete');

    // Soft skills uses /30 for CATs and /50 for FAT, standard uses /50 for CATs and /100 for FAT
    const catMaxRaw = theoryCategory === 'soft_skills' ? 30 : 50;
    const fatMaxRaw = theoryCategory === 'soft_skills' ? 50 : 100;

    // Internal components with custom names
    const [internalComponents, setInternalComponents] = useState<InternalComponent[]>([
        { name: 'Internal Assessment', max_marks: 30, marks: null }
    ]);

    const [fatRaw, setFatRaw] = useState<string>('');
    const [fatWeight, setFatWeight] = useState<string>('');

    // Lab state
    const [labPattern, setLabPattern] = useState<LabPattern>('da6_fat');
    const [daMarks, setDaMarks] = useState<string[]>(Array(10).fill(''));
    const [labCat1Weight, setLabCat1Weight] = useState<string>('');
    const [labCat2Weight, setLabCat2Weight] = useState<string>('');
    const [labFatRaw, setLabFatRaw] = useState<string>('');
    const [labFatWeight, setLabFatWeight] = useState<string>('');
    const [labInternalWeight, setLabInternalWeight] = useState<string>('');

    // Fetch user semesters
    useEffect(() => {
        if (!isOpen || !user) return;
        const fetchSemesters = async () => {
            try {
                const q = query(collection(db, 'semesters'), where('user_id', '==', user.uid));
                const snap = await getDocs(q);
                const sems = snap.docs.map(d => {
                    const data = d.data();
                    return {
                        id: d.id,
                        label: `${data.term || ''} ${data.year || ''}`.trim() || 'Untitled Semester'
                    };
                });
                setSemestersList(sems);
            } catch (err) {
                console.error('Error fetching semesters:', err);
            }
        };
        fetchSemesters();
    }, [isOpen, user]);

    // Update internal components structure when pattern changes
    const changeInternalPattern = (pattern: TheoryInternalPattern) => {
        setInternalPattern(pattern);
        if (pattern === 'complete') {
            setInternalComponents([
                { name: 'Internal Assessment', max_marks: 30, marks: internalComponents[0]?.marks ?? null }
            ]);
        } else if (pattern === '15_15') {
            setInternalComponents([
                { name: 'Quiz / Seminar 1', max_marks: 15, marks: internalComponents[0]?.marks ?? null },
                { name: 'Quiz / Seminar 2', max_marks: 15, marks: internalComponents[1]?.marks ?? null }
            ]);
        } else if (pattern === '20_10') {
            setInternalComponents([
                { name: 'Assignment / Seminar', max_marks: 20, marks: internalComponents[0]?.marks ?? null },
                { name: 'Quiz / Case Study', max_marks: 10, marks: internalComponents[1]?.marks ?? null }
            ]);
        } else if (pattern === '10_10_10') {
            setInternalComponents([
                { name: 'Quiz 1', max_marks: 10, marks: internalComponents[0]?.marks ?? null },
                { name: 'Quiz 2', max_marks: 10, marks: internalComponents[1]?.marks ?? null },
                { name: 'Case Study / Seminar', max_marks: 10, marks: internalComponents[2]?.marks ?? null }
            ]);
        }
    };

    // Reset or populate fields when modal opens
    useEffect(() => {
        if (!isOpen) return;

        if (initialData) {
            setCourseName(initialData.course_name || '');
            setCourseCode(initialData.course_code || '');
            setSlot(initialData.slot || 'A1+TA1');
            setCredit(Number(initialData.credit) || 3);
            setCourseType(initialData.type || 'theory');
            setSelectedSemesterId(initialData.semester_id || '');
            setSelectedGrade(initialData.grade || '');

            if (initialData.type === 'theory' && initialData.theory_marks) {
                const tm = initialData.theory_marks;
                const isSoft = tm.category === 'soft_skills' ||
                               tm.cat_max_raw === 30 ||
                               tm.fat_max_raw === 50 ||
                               isSoftSkillsCourse(initialData.course_code, initialData.course_name);
                setTheoryCategory(isSoft ? 'soft_skills' : (tm.category || 'standard'));
                setCat1Raw(tm.cat1_raw !== null && tm.cat1_raw !== undefined ? String(tm.cat1_raw) : '');
                setCat1Weight(tm.cat1_weight !== null && tm.cat1_weight !== undefined ? String(tm.cat1_weight) : '');
                setCat2Raw(tm.cat2_raw !== null && tm.cat2_raw !== undefined ? String(tm.cat2_raw) : '');
                setCat2Weight(tm.cat2_weight !== null && tm.cat2_weight !== undefined ? String(tm.cat2_weight) : '');
                setInternalPattern(tm.internal_pattern || 'complete');

                if (tm.internal_components && tm.internal_components.length > 0) {
                    setInternalComponents(tm.internal_components);
                } else {
                    const pat = tm.internal_pattern || 'complete';
                    if (pat === 'complete') {
                        setInternalComponents([
                            { name: 'Internal Assessment', max_marks: 30, marks: tm.internal_parts?.part1 ?? null }
                        ]);
                    } else if (pat === '15_15') {
                        setInternalComponents([
                            { name: 'Quiz / Seminar 1', max_marks: 15, marks: tm.internal_parts?.part1 ?? null },
                            { name: 'Quiz / Seminar 2', max_marks: 15, marks: tm.internal_parts?.part2 ?? null }
                        ]);
                    } else if (pat === '20_10') {
                        setInternalComponents([
                            { name: 'Assignment / Seminar', max_marks: 20, marks: tm.internal_parts?.part1 ?? null },
                            { name: 'Quiz / Case Study', max_marks: 10, marks: tm.internal_parts?.part2 ?? null }
                        ]);
                    } else {
                        setInternalComponents([
                            { name: 'Quiz 1', max_marks: 10, marks: tm.internal_parts?.part1 ?? null },
                            { name: 'Quiz 2', max_marks: 10, marks: tm.internal_parts?.part2 ?? null },
                            { name: 'Case Study / Seminar', max_marks: 10, marks: tm.internal_parts?.part3 ?? null }
                        ]);
                    }
                }

                setFatRaw(tm.fat_raw !== null && tm.fat_raw !== undefined ? String(tm.fat_raw) : '');
                setFatWeight(tm.fat_weight !== null && tm.fat_weight !== undefined ? String(tm.fat_weight) : '');
            } else if (initialData.type === 'lab' && initialData.lab_marks) {
                const lm = initialData.lab_marks;
                setLabPattern(lm.pattern || 'da6_fat');
                setDaMarks(
                    Array.from({ length: 10 }, (_, i) =>
                        lm.da_marks?.[i] !== null && lm.da_marks?.[i] !== undefined ? String(lm.da_marks[i]) : ''
                    )
                );
                setLabCat1Weight(lm.cat1_weight !== null && lm.cat1_weight !== undefined ? String(lm.cat1_weight) : '');
                setLabCat2Weight(lm.cat2_weight !== null && lm.cat2_weight !== undefined ? String(lm.cat2_weight) : '');
                setLabFatRaw(lm.fat_raw !== null && lm.fat_raw !== undefined ? String(lm.fat_raw) : '');
                setLabFatWeight(lm.fat_weight !== null && lm.fat_weight !== undefined ? String(lm.fat_weight) : '');
                setLabInternalWeight(lm.internal_weight !== null && lm.internal_weight !== undefined ? String(lm.internal_weight) : '');
            }
        } else {
            // Fresh modal
            setCourseName('');
            setCourseCode('');
            setSlot('A1+TA1');
            setCredit(3);
            setCourseType('theory');
            setTheoryCategory('standard');
            setSelectedSemesterId('');
            setSelectedGrade('');
            setCat1Raw('');
            setCat1Weight('');
            setCat2Raw('');
            setCat2Weight('');
            setInternalPattern('complete');
            setInternalComponents([
                { name: 'Internal Assessment', max_marks: 30, marks: null }
            ]);
            setFatRaw('');
            setFatWeight('');
            setLabPattern('da6_fat');
            setDaMarks(Array(10).fill(''));
            setLabCat1Weight('');
            setLabCat2Weight('');
            setLabFatRaw('');
            setLabFatWeight('');
            setLabInternalWeight('');
        }
    }, [isOpen, initialData]);

    // Calculate Theory preview
    const theoryCalc = calculateTheoryMarks({
        category: theoryCategory,
        cat_max_raw: catMaxRaw,
        cat1_raw: cat1Raw !== '' ? Number(cat1Raw) : null,
        cat1_weight: cat1Weight !== '' ? Number(cat1Weight) : null,
        cat2_raw: cat2Raw !== '' ? Number(cat2Raw) : null,
        cat2_weight: cat2Weight !== '' ? Number(cat2Weight) : null,
        internal_pattern: internalPattern,
        internal_components: internalComponents,
        fat_max_raw: fatMaxRaw,
        fat_raw: fatRaw !== '' ? Number(fatRaw) : null,
        fat_weight: fatWeight !== '' ? Number(fatWeight) : null,
    });

    // Calculate Lab preview
    const labCalc = calculateLabMarks({
        pattern: labPattern,
        da_marks: daMarks.map(m => m !== '' ? Number(m) : null),
        cat1_weight: labCat1Weight !== '' ? Number(labCat1Weight) : null,
        cat2_weight: labCat2Weight !== '' ? Number(labCat2Weight) : null,
        internal_weight: labInternalWeight !== '' ? Number(labInternalWeight) : null,
        fat_raw: labFatRaw !== '' ? Number(labFatRaw) : null,
        fat_weight: labFatWeight !== '' ? Number(labFatWeight) : null,
    });

    // Rounded Total
    const activeTotal = courseType === 'theory' ? theoryCalc.total : labCalc.total;
    const gradeBadge = selectedGrade ? getGradeBadgeStyle(selectedGrade) : null;

    const handleTheoryCategoryChange = (cat: TheoryCourseCategory) => {
        setTheoryCategory(cat);
        const newCatMax = cat === 'soft_skills' ? 30 : 50;
        const newFatMax = cat === 'soft_skills' ? 50 : 100;
        if (cat1Raw !== '') {
            const scaled = Math.round((Math.min(newCatMax, Math.max(0, Number(cat1Raw))) / newCatMax) * 15 * 100) / 100;
            setCat1Weight(String(scaled));
        }
        if (cat2Raw !== '') {
            const scaled = Math.round((Math.min(newCatMax, Math.max(0, Number(cat2Raw))) / newCatMax) * 15 * 100) / 100;
            setCat2Weight(String(scaled));
        }
        if (fatRaw !== '') {
            const scaled = Math.round((Math.min(newFatMax, Math.max(0, Number(fatRaw))) / newFatMax) * 40 * 100) / 100;
            setFatWeight(String(scaled));
        }
    };

    const handleCat1RawChange = (val: string) => {
        setCat1Raw(val);
        if (val !== '') {
            const scaled = Math.round((Math.min(catMaxRaw, Math.max(0, Number(val))) / catMaxRaw) * 15 * 100) / 100;
            setCat1Weight(String(scaled));
        } else {
            setCat1Weight('');
        }
    };

    const handleCat2RawChange = (val: string) => {
        setCat2Raw(val);
        if (val !== '') {
            const scaled = Math.round((Math.min(catMaxRaw, Math.max(0, Number(val))) / catMaxRaw) * 15 * 100) / 100;
            setCat2Weight(String(scaled));
        } else {
            setCat2Weight('');
        }
    };

    const handleFatRawChange = (val: string) => {
        setFatRaw(val);
        if (val !== '') {
            const scaled = Math.round((Math.min(fatMaxRaw, Math.max(0, Number(val))) / fatMaxRaw) * 40 * 100) / 100;
            setFatWeight(String(scaled));
        } else {
            setFatWeight('');
        }
    };

    const handleLabFatRawChange = (val: string) => {
        setLabFatRaw(val);
        if (val !== '') {
            const scaled = Math.round((Math.min(50, Math.max(0, Number(val))) / 50) * 40 * 100) / 100;
            setLabFatWeight(String(scaled));
        } else {
            setLabFatWeight('');
        }
    };

    const handleDaMarkChange = (index: number, val: string) => {
        const next = [...daMarks];
        next[index] = val;
        setDaMarks(next);
    };

    const updateComponentName = (idx: number, name: string) => {
        const updated = [...internalComponents];
        updated[idx] = { ...updated[idx], name };
        setInternalComponents(updated);
    };

    const updateComponentMarks = (idx: number, marksVal: string) => {
        const updated = [...internalComponents];
        updated[idx] = {
            ...updated[idx],
            marks: marksVal === '' ? null : Number(marksVal)
        };
        setInternalComponents(updated);
    };

    // Auto-map grade if matching subject exists in CGPA
    const handleCourseCodeBlur = async () => {
        if (!user || selectedGrade || !courseCode.trim()) return;
        try {
            const subQuery = query(collection(db, 'subjects'), where('user_id', '==', user.uid));
            const subSnap = await getDocs(subQuery);
            const match = subSnap.docs.find(d => {
                const data = d.data();
                return (data.subject_code || data.code || '').trim().toUpperCase() === courseCode.trim().toUpperCase();
            });
            if (match && match.data().grade) {
                setSelectedGrade(match.data().grade);
                if (match.data().semester_id && !selectedSemesterId) {
                    setSelectedSemesterId(match.data().semester_id);
                }
            }
        } catch (err) {
            console.error('Error auto-mapping grade:', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            showNotification('Please login to save course marks', 'error');
            return;
        }

        if (!courseName.trim()) {
            showNotification('Please enter a course name', 'warning');
            return;
        }

        if (!courseCode.trim()) {
            showNotification('Please enter a course code', 'warning');
            return;
        }

        setLoading(true);

        try {
            const selectedSem = semestersList.find(s => s.id === selectedSemesterId);

            const payload: Partial<CourseMarkEntry> = {
                user_id: user.uid,
                course_name: courseName.trim(),
                course_code: courseCode.trim().toUpperCase(),
                slot: slot.trim(),
                credit: Number(credit) || 1,
                type: courseType,
                semester_id: selectedSemesterId || undefined,
                semester_name: selectedSem ? selectedSem.label : undefined,
                grade: selectedGrade || undefined,
                total_marks: activeTotal, // Rounded to integer
                updated_at: new Date().toISOString(),
            };

            if (courseType === 'theory') {
                payload.theory_marks = {
                    category: theoryCategory,
                    cat_max_raw: catMaxRaw,
                    cat1_raw: cat1Raw !== '' ? Number(cat1Raw) : null,
                    cat1_weight: cat1Weight !== '' ? Number(cat1Weight) : null,
                    cat2_raw: cat2Raw !== '' ? Number(cat2Raw) : null,
                    cat2_weight: cat2Weight !== '' ? Number(cat2Weight) : null,
                    internal_pattern: internalPattern,
                    internal_components: internalComponents,
                    internal_total: theoryCalc.internal_total,
                    fat_max_raw: fatMaxRaw,
                    fat_raw: fatRaw !== '' ? Number(fatRaw) : null,
                    fat_weight: fatWeight !== '' ? Number(fatWeight) : null,
                };
            } else {
                payload.lab_marks = {
                    pattern: labPattern,
                    da_marks: daMarks.map(m => m !== '' ? Number(m) : null),
                    cat1_weight: labCat1Weight !== '' ? Number(labCat1Weight) : null,
                    cat2_weight: labCat2Weight !== '' ? Number(labCat2Weight) : null,
                    internal_weight: labInternalWeight !== '' ? Number(labInternalWeight) : null,
                    fat_raw: labFatRaw !== '' ? Number(labFatRaw) : null,
                    fat_weight: labFatWeight !== '' ? Number(labFatWeight) : null,
                };
            }

            if (initialData?.id) {
                await updateDoc(doc(db, 'course_marks', initialData.id), payload);
                showNotification(`Updated ${payload.course_code} successfully!`, 'success');
            } else {
                payload.created_at = new Date().toISOString();
                await addDoc(collection(db, 'course_marks'), payload);
                showNotification(`Added ${payload.course_code} to Marks!`, 'success');
            }

            // Sync grade with CGPA subjects collection if grade is set
            if (selectedGrade) {
                try {
                    const norm = (s?: string) => (s || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                    const codeNorm = norm(courseCode);
                    const nameNorm = norm(courseName);

                    const subQ = query(collection(db, 'subjects'), where('user_id', '==', user.uid));
                    const subSnap = await getDocs(subQ);
                    const matchedSubDoc = subSnap.docs.find(d => {
                        const dData = d.data();
                        const subCodeNorm = norm(dData.subject_code || dData.code);
                        const subNameNorm = norm(dData.subject_name || dData.name);
                        return (codeNorm && subCodeNorm && codeNorm === subCodeNorm) ||
                               (nameNorm && subNameNorm && nameNorm === subNameNorm);
                    });

                    if (matchedSubDoc) {
                        await updateDoc(doc(db, 'subjects', matchedSubDoc.id), {
                            grade: selectedGrade,
                            updated_at: new Date().toISOString()
                        });
                    } else if (selectedSemesterId) {
                        await addDoc(collection(db, 'subjects'), {
                            user_id: user.uid,
                            semester_id: selectedSemesterId,
                            subject_code: courseCode.trim().toUpperCase(),
                            subject_name: courseName.trim(),
                            credit: Number(credit) || 1,
                            grade: selectedGrade,
                            created_at: new Date().toISOString()
                        });
                    }
                } catch (syncErr) {
                    console.warn('Could not sync grade to CGPA subjects:', syncErr);
                }
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error saving course marks:', err);
            showNotification(err.message || 'Failed to save course', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? `Edit Course - ${initialData.course_code}` : 'Add Course / Module'}
            className="max-w-2xl max-h-[90vh] overflow-y-auto"
        >
            <form onSubmit={handleSubmit} className="space-y-6 pt-2">
                {/* Course Basic Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                            Course Name <span className="text-rose-500">*</span>
                        </label>
                        <Input
                            placeholder="e.g. Computer Networks or Soft Skills"
                            value={courseName}
                            onChange={(e) => {
                                const newName = e.target.value;
                                setCourseName(newName);
                                if (!initialData && isSoftSkillsCourse(courseCode, newName)) {
                                    handleTheoryCategoryChange('soft_skills');
                                }
                            }}
                            required
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                            Course Code <span className="text-rose-500">*</span>
                        </label>
                        <Input
                            placeholder="e.g. CSE3001 or STS2002"
                            value={courseCode}
                            onChange={(e) => {
                                const newCode = e.target.value.toUpperCase();
                                setCourseCode(newCode);
                                if (!initialData && isSoftSkillsCourse(newCode, courseName)) {
                                    handleTheoryCategoryChange('soft_skills');
                                }
                            }}
                            onBlur={handleCourseCodeBlur}
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Semester Choose Option (as in CGPA page) */}
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-primary" /> Semester
                        </label>
                        <select
                            value={selectedSemesterId}
                            onChange={(e) => setSelectedSemesterId(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            <option value="">No Semester</option>
                            {semestersList.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* CGPA Page Grade Choose Option */}
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                            <GraduationCap className="w-3 h-3 text-primary" /> CGPA Grade
                        </label>
                        <select
                            value={selectedGrade}
                            onChange={(e) => setSelectedGrade(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 font-medium"
                        >
                            <option value="">Pending / Not Graded</option>
                            {GRADE_OPTIONS.map(g => (
                                <option key={g.value} value={g.value}>
                                    Grade {g.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                            Credits
                        </label>
                        <Input
                            type="number"
                            min="1"
                            max="20"
                            step="0.5"
                            value={credit}
                            onChange={(e) => setCredit(Number(e.target.value))}
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                            Slot
                        </label>
                        <div className="relative">
                            <input
                                list="slot-options"
                                type="text"
                                value={slot}
                                onChange={(e) => setSlot(e.target.value.toUpperCase())}
                                placeholder="e.g. A1+TA1"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            <datalist id="slot-options">
                                {COMMON_SLOTS.map(s => <option key={s} value={s} />)}
                            </datalist>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                            Course Type
                        </label>
                        <div className="flex bg-muted/60 p-1 rounded-lg border border-border/60">
                            <button
                                type="button"
                                onClick={() => setCourseType('theory')}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-semibold rounded-md transition-all",
                                    courseType === 'theory'
                                        ? "bg-background text-primary shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <BookOpen className="w-3 h-3" />
                                Theory
                            </button>
                            <button
                                type="button"
                                onClick={() => setCourseType('lab')}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-semibold rounded-md transition-all",
                                    courseType === 'lab'
                                        ? "bg-background text-emerald-500 shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <FlaskConical className="w-3 h-3" />
                                Lab
                            </button>
                        </div>
                    </div>
                </div>

                {/* Live Total & CGPA Grade Strip (Rounded Total) */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-500/10 via-primary/5 to-teal-500/10 border border-sky-500/20 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold text-lg">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground font-medium">Total Marks (Rounded)</div>
                            <div className="text-2xl font-black text-foreground">
                                {activeTotal} <span className="text-xs font-normal text-muted-foreground">/ 100</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="text-right">
                            <div className="text-xs text-muted-foreground font-medium">CGPA Grade</div>
                            {selectedGrade && gradeBadge ? (
                                <div className={cn("text-xs font-bold px-3 py-1 rounded-full border mt-0.5", gradeBadge.bg, gradeBadge.text, gradeBadge.border)}>
                                    {gradeBadge.label}
                                </div>
                            ) : (
                                <div className="text-xs font-medium px-3 py-1 rounded-full border border-border/60 bg-muted/40 text-muted-foreground mt-0.5">
                                    Pending in CGPA
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* If THEORY */}
                {courseType === 'theory' && (
                    <div className="space-y-5 rounded-2xl border border-sky-500/20 bg-sky-500/[0.02] p-4 sm:p-5">
                        <div className="flex items-center justify-between border-b border-border/50 pb-2">
                            <span className="text-sm font-bold text-foreground flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-sky-500" /> Theory Marks Breakdown
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {theoryCategory === 'soft_skills'
                                    ? 'CAT1 (30→15) + CAT2 (30→15) + Internal (30) + FAT (50→40) = 100'
                                    : 'CAT1 (50→15) + CAT2 (50→15) + Internal (30) + FAT (100→40) = 100'}
                            </span>
                        </div>

                        {/* Evaluation Scheme Selector */}
                        <div className="p-3 rounded-xl bg-card/70 border border-border/70 space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Theory Evaluation Scheme
                                </label>
                                {theoryCategory === 'soft_skills' && (
                                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                                        Soft Skills / STS Pattern
                                    </span>
                                )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleTheoryCategoryChange('standard')}
                                    className={cn(
                                        "p-2.5 rounded-lg border text-left transition-all",
                                        theoryCategory === 'standard'
                                            ? "border-sky-500 bg-sky-500/10 text-sky-700 dark:text-sky-300 font-bold shadow-sm"
                                            : "border-border hover:bg-muted text-muted-foreground"
                                    )}
                                >
                                    <div className="text-xs font-semibold">Standard Theory</div>
                                    <div className="text-[10px] text-muted-foreground mt-0.5">
                                        CAT 1 & 2 (/50 → 15) • FAT (/100 → 40)
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleTheoryCategoryChange('soft_skills')}
                                    className={cn(
                                        "p-2.5 rounded-lg border text-left transition-all",
                                        theoryCategory === 'soft_skills'
                                            ? "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold shadow-sm"
                                            : "border-border hover:bg-muted text-muted-foreground"
                                    )}
                                >
                                    <div className="text-xs font-semibold flex items-center justify-between">
                                        <span>Soft Skills / STS</span>
                                        <span className="text-[9px] bg-amber-500/20 text-amber-700 dark:text-amber-300 px-1.5 py-0.2 rounded font-semibold">
                                            CAT /30 • FAT /50
                                        </span>
                                    </div>
                                    <div className="text-[10px] text-muted-foreground mt-0.5">
                                        CAT 1 & 2 (/30 → 15) • FAT (/50 → 40)
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* CAT 1 & CAT 2 Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* CAT 1 */}
                            <div className="p-3.5 rounded-xl border border-border/60 bg-background/50 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-foreground">CAT 1</span>
                                    <span className="text-xs font-semibold text-sky-500">
                                        Weight: {theoryCalc.cat1_weight} / 15
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[11px] text-muted-foreground block mb-1">
                                            Raw (out of {catMaxRaw})
                                        </label>
                                        <Input
                                            type="number"
                                            min="0"
                                            max={catMaxRaw}
                                            step="any"
                                            placeholder={theoryCategory === 'soft_skills' ? "e.g. 24 or 28" : "e.g. 33.5 or 36.75"}
                                            value={cat1Raw}
                                            onChange={(e) => handleCat1RawChange(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] text-muted-foreground block mb-1">
                                            CAT 1 (15)
                                        </label>
                                        <Input
                                            type="number"
                                            min="0"
                                            max="15"
                                            step="any"
                                            placeholder="e.g. 10.05 or 11.04"
                                            value={cat1Weight}
                                            onChange={(e) => setCat1Weight(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* CAT 2 */}
                            <div className="p-3.5 rounded-xl border border-border/60 bg-background/50 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-foreground">CAT 2</span>
                                    <span className="text-xs font-semibold text-sky-500">
                                        Weight: {theoryCalc.cat2_weight} / 15
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[11px] text-muted-foreground block mb-1">
                                            Raw (out of {catMaxRaw})
                                        </label>
                                        <Input
                                            type="number"
                                            min="0"
                                            max={catMaxRaw}
                                            step="any"
                                            placeholder={theoryCategory === 'soft_skills' ? "e.g. 24 or 28" : "e.g. 33.5 or 36.75"}
                                            value={cat2Raw}
                                            onChange={(e) => handleCat2RawChange(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] text-muted-foreground block mb-1">
                                            CAT 2 (15)
                                        </label>
                                        <Input
                                            type="number"
                                            min="0"
                                            max="15"
                                            step="any"
                                            placeholder="e.g. 10.05 or 11.04"
                                            value={cat2Weight}
                                            onChange={(e) => setCat2Weight(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Internal (30) with Custom Input Name Fields (Quiz, Seminar, Case Study, etc.) */}
                        <div className="p-3.5 rounded-xl border border-border/60 bg-background/50 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <span className="text-xs font-bold text-foreground block">
                                        Internal Continuous Assessments (30)
                                    </span>
                                    <span className="text-[11px] text-muted-foreground">
                                        Customize names (Quiz, Seminar, Case Study, etc.) and scores
                                    </span>
                                </div>
                                <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                                    Total: {theoryCalc.internal_total} / 30
                                </span>
                            </div>

                            {/* Internal Pattern Picker */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <button
                                    type="button"
                                    onClick={() => changeInternalPattern('complete')}
                                    className={cn(
                                        "py-1.5 px-2 text-xs font-medium rounded-lg border text-center transition-all",
                                        internalPattern === 'complete'
                                            ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                                            : "border-border hover:bg-muted text-muted-foreground"
                                    )}
                                >
                                    Complete 30
                                </button>
                                <button
                                    type="button"
                                    onClick={() => changeInternalPattern('15_15')}
                                    className={cn(
                                        "py-1.5 px-2 text-xs font-medium rounded-lg border text-center transition-all",
                                        internalPattern === '15_15'
                                            ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                                            : "border-border hover:bg-muted text-muted-foreground"
                                    )}
                                >
                                    15 + 15
                                </button>
                                <button
                                    type="button"
                                    onClick={() => changeInternalPattern('20_10')}
                                    className={cn(
                                        "py-1.5 px-2 text-xs font-medium rounded-lg border text-center transition-all",
                                        internalPattern === '20_10'
                                            ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                                            : "border-border hover:bg-muted text-muted-foreground"
                                    )}
                                >
                                    20 + 10
                                </button>
                                <button
                                    type="button"
                                    onClick={() => changeInternalPattern('10_10_10')}
                                    className={cn(
                                        "py-1.5 px-2 text-xs font-medium rounded-lg border text-center transition-all",
                                        internalPattern === '10_10_10'
                                            ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                                            : "border-border hover:bg-muted text-muted-foreground"
                                    )}
                                >
                                    10 + 10 + 10
                                </button>
                            </div>

                            {/* Internal Components with Input Name and Marks */}
                            <div className="space-y-3 pt-1">
                                {internalComponents.map((comp, idx) => (
                                    <div key={idx} className="p-3 rounded-lg border border-border/70 bg-card/60 space-y-2">
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                                            {/* Name Input */}
                                            <div className="sm:col-span-2">
                                                <label className="text-[11px] text-muted-foreground font-medium block mb-1">
                                                    Assessment Name (e.g. Quiz, Seminar, Case Study)
                                                </label>
                                                <div className="relative">
                                                    <Input
                                                        type="text"
                                                        placeholder={`Component ${idx + 1}`}
                                                        value={comp.name}
                                                        onChange={(e) => updateComponentName(idx, e.target.value)}
                                                        className="h-9 text-xs"
                                                    />
                                                </div>
                                            </div>

                                            {/* Marks Input */}
                                            <div>
                                                <label className="text-[11px] text-muted-foreground font-medium block mb-1">
                                                    Marks (out of {comp.max_marks})
                                                </label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    max={comp.max_marks}
                                                    step="any"
                                                    placeholder={`Max ${comp.max_marks}`}
                                                    value={comp.marks !== null && comp.marks !== undefined ? comp.marks : ''}
                                                    onChange={(e) => updateComponentMarks(idx, e.target.value)}
                                                    className="h-9 text-xs"
                                                />
                                            </div>
                                        </div>

                                        {/* Quick Preset Name Tags */}
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                <Tag className="w-2.5 h-2.5" /> Presets:
                                            </span>
                                            {PRESET_NAMES.map((preset) => (
                                                <button
                                                    key={preset}
                                                    type="button"
                                                    onClick={() => updateComponentName(idx, preset)}
                                                    className={cn(
                                                        "text-[10px] px-1.5 py-0.5 rounded border transition-colors",
                                                        comp.name === preset
                                                            ? "bg-primary/15 text-primary border-primary/30 font-semibold"
                                                            : "bg-muted/40 hover:bg-muted text-muted-foreground border-border/60"
                                                    )}
                                                >
                                                    {preset}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* FAT (40) */}
                        <div className="p-3.5 rounded-xl border border-border/60 bg-background/50 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-foreground">FAT (Final Assessment Test)</span>
                                <span className="text-xs font-semibold text-sky-500">
                                    Weight: {theoryCalc.fat_weight} / 40
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[11px] text-muted-foreground block mb-1">
                                        Raw FAT (out of {fatMaxRaw})
                                    </label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max={fatMaxRaw}
                                        step="any"
                                        placeholder={theoryCategory === 'soft_skills' ? "e.g. 42" : "e.g. 85"}
                                        value={fatRaw}
                                        onChange={(e) => handleFatRawChange(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-muted-foreground block mb-1">
                                        FAT (40)
                                    </label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="40"
                                        step="any"
                                        placeholder="34"
                                        value={fatWeight}
                                        onChange={(e) => setFatWeight(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* If LAB */}
                {courseType === 'lab' && (
                    <div className="space-y-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.02] p-4 sm:p-5">
                        <div className="flex items-center justify-between border-b border-border/50 pb-2">
                            <span className="text-sm font-bold text-foreground flex items-center gap-2">
                                <FlaskConical className="w-4 h-4 text-emerald-500" /> Lab Evaluation Scheme
                            </span>
                            <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                Total: {labCalc.total} / 100
                            </span>
                        </div>

                        {/* Lab Pattern Selector */}
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                                Faculty Evaluation Format
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setLabPattern('da6_fat')}
                                    className={cn(
                                        "p-2.5 rounded-xl border text-left transition-all",
                                        labPattern === 'da6_fat'
                                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold shadow-sm"
                                            : "border-border hover:bg-muted text-muted-foreground"
                                    )}
                                >
                                    <div className="text-xs font-semibold">DA 1 to 6 + FAT</div>
                                    <div className="text-[10px] text-muted-foreground mt-0.5">6 DAs (60) + FAT (40)</div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setLabPattern('da10_nofat')}
                                    className={cn(
                                        "p-2.5 rounded-xl border text-left transition-all",
                                        labPattern === 'da10_nofat'
                                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold shadow-sm"
                                            : "border-border hover:bg-muted text-muted-foreground"
                                    )}
                                >
                                    <div className="text-xs font-semibold">DA 1 to 10 (No FAT)</div>
                                    <div className="text-[10px] text-muted-foreground mt-0.5">10 DAs each 10 marks = 100</div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setLabPattern('cat_fat')}
                                    className={cn(
                                        "p-2.5 rounded-xl border text-left transition-all",
                                        labPattern === 'cat_fat'
                                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold shadow-sm"
                                            : "border-border hover:bg-muted text-muted-foreground"
                                    )}
                                >
                                    <div className="text-xs font-semibold">CAT1 + CAT2 + FAT</div>
                                    <div className="text-[10px] text-muted-foreground mt-0.5">CATs (15+15) + FAT (40) + DAs</div>
                                </button>
                            </div>
                        </div>

                        {/* Pattern 1: DA 1 to 6 + FAT */}
                        {labPattern === 'da6_fat' && (
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-foreground">DA 1 to DA 6 (Each 10 Marks)</span>
                                        <span className="text-xs font-semibold text-emerald-500">
                                            DAs Subtotal: {labCalc.da_total} / 60
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                        {[1, 2, 3, 4, 5, 6].map((num, i) => (
                                            <div key={num}>
                                                <label className="text-[11px] text-muted-foreground block mb-1 text-center font-medium">
                                                    DA {num}
                                                </label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    max="10"
                                                    step="any"
                                                    placeholder="10"
                                                    value={daMarks[i] || ''}
                                                    onChange={(e) => handleDaMarkChange(i, e.target.value)}
                                                    className="text-center h-9 px-1"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Lab FAT */}
                                <div className="p-3.5 rounded-xl border border-border/60 bg-background/50 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-foreground">Lab FAT (Final Assessment)</span>
                                        <span className="text-xs font-semibold text-emerald-500">
                                            Weight: {labCalc.fat_weight} / 40
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-[11px] text-muted-foreground block mb-1">
                                                Raw FAT (out of 50)
                                            </label>
                                            <Input
                                                type="number"
                                                min="0"
                                                max="50"
                                                step="any"
                                                placeholder="e.g. 45"
                                                value={labFatRaw}
                                                onChange={(e) => handleLabFatRawChange(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[11px] text-muted-foreground block mb-1">
                                                FAT (40)
                                            </label>
                                            <Input
                                                type="number"
                                                min="0"
                                                max="40"
                                                step="any"
                                                placeholder="36"
                                                value={labFatWeight}
                                                onChange={(e) => setLabFatWeight(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Pattern 2: DA 1 to 10 (each 10 marks, no FAT) */}
                        {labPattern === 'da10_nofat' && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-foreground">DA 1 to DA 10 (Continuous Assessment)</span>
                                    <span className="text-xs font-semibold text-emerald-500">
                                        Total: {labCalc.da_total} / 100
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num, i) => (
                                        <div key={num}>
                                            <label className="text-[11px] text-muted-foreground block mb-1 text-center font-medium">
                                                DA {num} (/10)
                                            </label>
                                            <Input
                                                type="number"
                                                min="0"
                                                max="10"
                                                step="any"
                                                placeholder="10"
                                                value={daMarks[i] || ''}
                                                onChange={(e) => handleDaMarkChange(i, e.target.value)}
                                                className="text-center h-9 px-1"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Pattern 3: CAT1 & CAT2 (each 15) + FAT (40) + DAs */}
                        {labPattern === 'cat_fat' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-xl border border-border/60 bg-background/50">
                                        <label className="text-xs font-bold text-foreground block mb-1">
                                            Lab CAT 1 (out of 15)
                                        </label>
                                        <Input
                                            type="number"
                                            min="0"
                                            max="15"
                                            step="any"
                                            placeholder="14"
                                            value={labCat1Weight}
                                            onChange={(e) => setLabCat1Weight(e.target.value)}
                                        />
                                    </div>
                                    <div className="p-3 rounded-xl border border-border/60 bg-background/50">
                                        <label className="text-xs font-bold text-foreground block mb-1">
                                            Lab CAT 2 (out of 15)
                                        </label>
                                        <Input
                                            type="number"
                                            min="0"
                                            max="15"
                                            step="any"
                                            placeholder="14.5"
                                            value={labCat2Weight}
                                            onChange={(e) => setLabCat2Weight(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="p-3 rounded-xl border border-border/60 bg-background/50">
                                    <label className="text-xs font-bold text-foreground block mb-1">
                                        Lab DAs / Continuous (/30)
                                    </label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="30"
                                        step="any"
                                        placeholder="28"
                                        value={labInternalWeight}
                                        onChange={(e) => setLabInternalWeight(e.target.value)}
                                    />
                                </div>

                                <div className="p-3 rounded-xl border border-border/60 bg-background/50 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-foreground block">
                                            Lab FAT (Final Assessment)
                                        </label>
                                        <span className="text-xs font-semibold text-emerald-500">
                                            Weight: {labCalc.fat_weight} / 40
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-[11px] text-muted-foreground block mb-1">
                                                Raw FAT (out of 50)
                                            </label>
                                            <Input
                                                type="number"
                                                min="0"
                                                max="50"
                                                step="any"
                                                placeholder="e.g. 45"
                                                value={labFatRaw}
                                                onChange={(e) => handleLabFatRawChange(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[11px] text-muted-foreground block mb-1">
                                                FAT (40)
                                            </label>
                                            <Input
                                                type="number"
                                                min="0"
                                                max="40"
                                                step="any"
                                                placeholder="36"
                                                value={labFatWeight}
                                                onChange={(e) => setLabFatWeight(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/50">
                    <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button type="submit" isLoading={loading} className="px-6 font-semibold shadow-md">
                        {initialData ? 'Update Course Marks' : 'Save Course Marks'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
