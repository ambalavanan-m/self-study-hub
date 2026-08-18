import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { type Grade, type CurriculumBasketKey, type Subject, BASKET_DEFINITIONS } from '../../lib/cgpa';

interface SubjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    semesterId?: string | null;
    subjectToEdit?: Subject | null;
    restrictEditToGradeAndCredit?: boolean;
}

export function SubjectModal({ 
    isOpen, 
    onClose, 
    onSuccess, 
    semesterId, 
    subjectToEdit,
    restrictEditToGradeAndCredit = false
}: SubjectModalProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<{
        subject_name: string;
        subject_code: string;
        grade: Grade;
        credit: number;
        basket: CurriculumBasketKey | '';
    }>({
        subject_name: '',
        subject_code: '',
        grade: 'S',
        credit: 3,
        basket: '',
    });

    const isEditMode = Boolean(subjectToEdit);
    const isCFOC = (subjectToEdit?.subject_code || formData.subject_code || '').trim().toUpperCase().startsWith('CFOC');

    useEffect(() => {
        if (subjectToEdit) {
            setFormData({
                subject_name: subjectToEdit.subject_name || '',
                subject_code: subjectToEdit.subject_code || '',
                grade: subjectToEdit.grade || 'S',
                credit: Number(subjectToEdit.credit) || 3,
                basket: subjectToEdit.basket || '',
            });
        } else {
            setFormData({
                subject_name: '',
                subject_code: '',
                grade: 'S',
                credit: 3,
                basket: '',
            });
        }
    }, [subjectToEdit, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);

        try {
            if (isEditMode && subjectToEdit) {
                if (restrictEditToGradeAndCredit) {
                    const updatePayload: Record<string, any> = {
                        grade: formData.grade,
                        credit: Number(formData.credit),
                    };
                    if (isCFOC) {
                        updatePayload.subject_code = formData.subject_code.trim().toUpperCase();
                    }
                    await updateDoc(doc(db, 'subjects', subjectToEdit.id), updatePayload);
                } else {
                    const payload: Partial<Subject> = {
                        subject_name: formData.subject_name.trim(),
                        subject_code: formData.subject_code.trim().toUpperCase(),
                        grade: formData.grade,
                        credit: Number(formData.credit),
                        basket: formData.basket || undefined,
                    };
                    await updateDoc(doc(db, 'subjects', subjectToEdit.id), payload);
                }
            } else {
                if (!semesterId) {
                    throw new Error('Semester ID is required when adding a subject');
                }
                const payload: Partial<Subject> & { user_id: string; semester_id: string } = {
                    user_id: user.uid,
                    semester_id: semesterId,
                    subject_name: formData.subject_name.trim(),
                    subject_code: formData.subject_code.trim().toUpperCase(),
                    grade: formData.grade,
                    credit: Number(formData.credit),
                    basket: formData.basket || undefined,
                };
                await addDoc(collection(db, 'subjects'), payload);
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving subject:', error);
        } finally {
            setLoading(false);
        }
    };

    const modalTitle = isEditMode
        ? (restrictEditToGradeAndCredit 
            ? (isCFOC ? 'Update Course Code, Grade & Credit' : 'Update Grade & Credit')
            : 'Edit Subject')
        : 'Add Subject';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={modalTitle}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {isEditMode && restrictEditToGradeAndCredit && (
                    <>
                        <div className="p-3 rounded-xl bg-muted/60 border border-border/50 space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-foreground">{formData.subject_name}</span>
                                {!isCFOC && (
                                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                                        {formData.subject_code}
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                {isCFOC 
                                    ? 'Course name is fixed. Course code (CFOC), grade, and credit can be updated.' 
                                    : 'Course name and code are fixed. You can modify the earned grade and credit weight below.'}
                            </p>
                        </div>

                        {/* Editable Course Code for CFOC courses */}
                        {isCFOC && (
                            <Input
                                label="Course Code"
                                value={formData.subject_code}
                                onChange={(e) => setFormData({ ...formData, subject_code: e.target.value })}
                                required
                                placeholder="e.g. CFOC101"
                            />
                        )}
                    </>
                )}

                {!restrictEditToGradeAndCredit && (
                    <>
                        <Input
                            label="Subject Name"
                            value={formData.subject_name}
                            onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })}
                            required
                            placeholder="e.g. Data Structures and Algorithms"
                        />
                        <Input
                            label="Subject Code"
                            value={formData.subject_code}
                            onChange={(e) => setFormData({ ...formData, subject_code: e.target.value })}
                            required
                            placeholder="e.g. CSE1001"
                        />
                    </>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Grade</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 font-medium"
                            value={formData.grade}
                            onChange={(e) => setFormData({ ...formData, grade: e.target.value as Grade })}
                        >
                            {[
                                { value: 'S', label: 'S (10 Points)' },
                                { value: 'A', label: 'A (9 Points)' },
                                { value: 'B', label: 'B (8 Points)' },
                                { value: 'C', label: 'C (7 Points)' },
                                { value: 'D', label: 'D (6 Points)' },
                                { value: 'E', label: 'E (5 Points)' },
                                { value: 'F', label: 'F (0 Points - Fail)' },
                                { value: 'N', label: 'N (0 Points - No Grade)' },
                                { value: 'P', label: 'P (Pass / Non-credit)' },
                                { value: 'A_ABSENT', label: 'Absent' },
                            ].map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <Input
                        label="Credit"
                        type="number"
                        step="0.5"
                        value={formData.credit}
                        onChange={(e) => setFormData({ ...formData, credit: parseFloat(e.target.value) || 0 })}
                        required
                        min={0.5}
                        max={30}
                    />
                </div>

                {/* Curriculum Basket Selection (when not restricted) */}
                {!restrictEditToGradeAndCredit && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center justify-between">
                            <span>Curriculum Basket</span>
                            <span className="text-xs font-normal text-muted-foreground">For curriculum credit mapping</span>
                        </label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={formData.basket}
                            onChange={(e) => setFormData({ ...formData, basket: e.target.value as CurriculumBasketKey | '' })}
                        >
                            <option value="">-- Select Curriculum Basket (Optional) --</option>
                            <option value="discipline_core">
                                {BASKET_DEFINITIONS.discipline_core.title} ({BASKET_DEFINITIONS.discipline_core.requiredCredits} credits)
                            </option>
                            <option value="discipline_elective">
                                {BASKET_DEFINITIONS.discipline_elective.title} ({BASKET_DEFINITIONS.discipline_elective.requiredCredits} credits)
                            </option>
                            <option value="project_internship">
                                {BASKET_DEFINITIONS.project_internship.title} ({BASKET_DEFINITIONS.project_internship.requiredCredits} credits)
                            </option>
                            <option value="open_elective">
                                {BASKET_DEFINITIONS.open_elective.title} ({BASKET_DEFINITIONS.open_elective.requiredCredits} credits)
                            </option>
                            <optgroup label="Ability Enhancement (8 credits total)">
                                <option value="ability_enhancement">
                                    • Ability Enhancement ({BASKET_DEFINITIONS.ability_enhancement.requiredCredits} credits)
                                </option>
                                <option value="language">
                                    • Indian / Foreign Language ({BASKET_DEFINITIONS.language.requiredCredits} credits)
                                </option>
                            </optgroup>
                            <option value="skill_enhancement">
                                {BASKET_DEFINITIONS.skill_enhancement.title} ({BASKET_DEFINITIONS.skill_enhancement.requiredCredits} credits)
                            </option>
                            <optgroup label="Value Added Course (8 credits total)">
                                <option value="value_added">
                                    • Value Added Course ({BASKET_DEFINITIONS.value_added.requiredCredits} credits)
                                </option>
                                <option value="cocurricular">
                                    • Co-curricular Course ({BASKET_DEFINITIONS.cocurricular.requiredCredits} credit)
                                </option>
                            </optgroup>
                        </select>
                    </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" isLoading={loading}>
                        {isEditMode ? 'Update' : 'Add Subject'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

// Backward compatibility export
export const AddSubjectModal = SubjectModal;

