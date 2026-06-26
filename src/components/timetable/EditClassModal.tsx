import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import {
    DAYS,
    THEORY_SLOTS,
    LAB_SLOTS,
    calculateEndTime,
    type Day
} from '../../lib/time';

interface TimetableEntry {
    id: string;
    day: string;
    start_time: string;
    end_time: string;
    subject_name: string;
    subject_code: string;
    type: 'theory' | 'lab';
    room_number: string;
    slot_code?: string;
    slot_label?: string;
    credit?: number;
    _collection?: 'timetable_entries' | 'smart_timetable_entries';
}

interface EditClassModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    entry: TimetableEntry | null;
}

export function EditClassModal({ isOpen, onClose, onSuccess, entry }: EditClassModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        day: 'Monday' as Day,
        type: 'theory' as 'theory' | 'lab',
        slot_code: 'A1',
        slot_label: 'Morning',
        subject_name: '',
        subject_code: '',
        room_number: '',
        start_time: '08:00',
        credit: 3,
    });

    useEffect(() => {
        if (entry) {
            setFormData({
                day: (entry.day || 'Monday') as Day,
                type: entry.type || 'theory',
                slot_code: entry.slot_code || 'A1',
                slot_label: entry.slot_label || 'Morning',
                subject_name: entry.subject_name || '',
                subject_code: entry.subject_code || '',
                room_number: entry.room_number || '',
                start_time: entry.start_time || '08:00',
                credit: entry.credit !== undefined ? entry.credit : 3,
            });
        }
    }, [entry, isOpen]);

    if (!entry) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const endTime = calculateEndTime(formData.start_time, formData.type);
        const collectionName = entry._collection || 'timetable_entries';

        try {
            await updateDoc(doc(db, collectionName, entry.id), {
                day: formData.day,
                type: formData.type,
                slot_code: formData.type === 'theory' ? formData.slot_code : null,
                slot_label: formData.type === 'lab' ? formData.slot_label : null,
                subject_name: formData.subject_name,
                subject_code: formData.subject_code,
                room_number: formData.room_number,
                start_time: formData.start_time,
                end_time: endTime,
                credit: formData.credit,
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error updating class:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Class" className="md:max-w-3xl">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                    <Input
                        label="Subject Name"
                        value={formData.subject_name}
                        onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })}
                        required
                        placeholder="Operating Systems"
                    />

                    <Input
                        label="Subject Code"
                        value={formData.subject_code}
                        onChange={(e) => setFormData({ ...formData, subject_code: e.target.value })}
                        required
                        placeholder="CSE202"
                    />

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Day</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={formData.day}
                            onChange={(e) => setFormData({ ...formData, day: e.target.value as Day })}
                        >
                            {DAYS.map((day) => (
                                <option key={day} value={day}>
                                    {day}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Type</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value as 'theory' | 'lab' })}
                        >
                            <option value="theory">Theory</option>
                            <option value="lab">Lab</option>
                        </select>
                    </div>

                    <div>
                        {formData.type === 'theory' ? (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Slot</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={formData.slot_code}
                                    onChange={(e) => setFormData({ ...formData, slot_code: e.target.value })}
                                >
                                    {THEORY_SLOTS.map((slot) => (
                                        <option key={slot} value={slot}>
                                            {slot}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Session</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={formData.slot_label}
                                    onChange={(e) => setFormData({ ...formData, slot_label: e.target.value })}
                                >
                                    {LAB_SLOTS.map((slot) => (
                                        <option key={slot} value={slot}>
                                            {slot}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <Input
                        label="Room Number"
                        value={formData.room_number}
                        onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                        placeholder="e.g. SJT 101"
                    />

                    <Input
                        label="Start Time"
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => {
                            const newStartTime = e.target.value;
                            setFormData({
                                ...formData,
                                start_time: newStartTime,
                            });
                        }}
                        required
                    />

                    <div className="space-y-2">
                        <label className="text-sm font-medium flex justify-between items-center">
                            <span>End Time</span>
                            <span className="text-xs text-muted-foreground font-normal">
                                ({formData.type === 'theory' ? '50' : '100'} mins)
                            </span>
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="time"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={calculateEndTime(formData.start_time, formData.type)}
                                readOnly
                            />
                        </div>
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

                <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" isLoading={loading}>
                        Save Changes
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
