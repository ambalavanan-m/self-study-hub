import React, { useState } from 'react';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { type Grade } from '../../lib/cgpa';

interface AddSubjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    semesterId: string;
}

export function AddSubjectModal({ isOpen, onClose, onSuccess, semesterId }: AddSubjectModalProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        subject_name: '',
        subject_code: '',
        grade: 'S' as Grade,
        credit: 3,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);

        try {
            await addDoc(collection(db, 'subjects'), {
                user_id: user.uid,
                semester_id: semesterId,
                subject_name: formData.subject_name,
                subject_code: formData.subject_code,
                grade: formData.grade,
                credit: formData.credit,
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error adding subject:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Subject">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Subject Name"
                    value={formData.subject_name}
                    onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })}
                    required
                    placeholder="Data Structures"
                />
                <Input
                    label="Subject Code"
                    value={formData.subject_code}
                    onChange={(e) => setFormData({ ...formData, subject_code: e.target.value })}
                    required
                    placeholder="CSE101"
                />
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Grade</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={formData.grade}
                            onChange={(e) => setFormData({ ...formData, grade: e.target.value as Grade })}
                        >
                            {(['S', 'A', 'B', 'C', 'D', 'E', 'P', 'A_ABSENT'] as Grade[]).map((grade) => (
                                <option key={grade} value={grade}>
                                    {grade === 'A_ABSENT' ? 'Absent' : grade}
                                </option>
                            ))}
                        </select>
                    </div>
                    <Input
                        label="Credit"
                        type="number"
                        step="0.5"
                        value={formData.credit}
                        onChange={(e) => setFormData({ ...formData, credit: parseFloat(e.target.value) })}
                        required
                        min={1}
                        max={10}
                    />
                </div>
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" isLoading={loading}>
                        Add Subject
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
