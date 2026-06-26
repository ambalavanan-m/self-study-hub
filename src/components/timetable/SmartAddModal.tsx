import { useState } from 'react';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Plus, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { parseCourseEntries, type CourseInput, type ParsedEntry } from '../../lib/ffcs';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { formatTimeTo12Hr } from '../../lib/time';

interface SmartAddModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function SmartAddModal({ isOpen, onClose, onSuccess }: SmartAddModalProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [inputs, setInputs] = useState<CourseInput[]>([
        { subject_name: '', subject_code: '', type: 'theory', slot: '', room_number: '', credit: 0 }
    ]);
    const [preview, setPreview] = useState<{ entries: ParsedEntry[], errors: string[] } | null>(null);

    const handleInputChange = (index: number, field: keyof CourseInput, value: string | number) => {
        const newInputs = [...inputs];
        // @ts-ignore - Dynamic assignment
        newInputs[index] = { ...newInputs[index], [field]: value };
        setInputs(newInputs);
        setPreview(null); // Clear preview on edit
    };

    const addRow = () => {
        setInputs([...inputs, { subject_name: '', subject_code: '', type: 'theory', slot: '', room_number: '', credit: 0 }]);
    };

    const removeRow = (index: number) => {
        if (inputs.length === 1) return;
        const newInputs = inputs.filter((_, i) => i !== index);
        setInputs(newInputs);
        setPreview(null);
    };

    const handleGenerate = () => {
        const result = parseCourseEntries(inputs);
        setPreview(result);
    };

    const handleSave = async () => {
        if (!user || !preview || preview.errors.length > 0) return;
        setLoading(true);

        try {
            const batch = writeBatch(db);
            preview.entries.forEach(entry => {
                const docRef = doc(collection(db, 'smart_timetable_entries'));
                batch.set(docRef, { ...entry, user_id: user.uid });
            });
            await batch.commit();

            onSuccess();
            onClose();
            // Reset state
            setInputs([{ subject_name: '', subject_code: '', type: 'theory', slot: '', room_number: '', credit: 0 }]);
            setPreview(null);
        } catch (error) {
            console.error('Error saving timetable:', error);
            alert('Failed to save timetable entries.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Smart Add (FFCS Slots)" className="max-w-4xl">
            <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-2">
                <div className="space-y-4">
                    {inputs.map((input, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end p-4 border rounded-lg bg-card">
                            <div className="md:col-span-3">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Subject Name</label>
                                <Input
                                    value={input.subject_name}
                                    onChange={(e) => handleInputChange(index, 'subject_name', e.target.value)}
                                    placeholder="e.g. Python"
                                    className="mt-2"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Code</label>
                                <Input
                                    value={input.subject_code}
                                    onChange={(e) => handleInputChange(index, 'subject_code', e.target.value)}
                                    placeholder="CSE1001"
                                    className="mt-2"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Type</label>
                                <select
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-2"
                                    value={input.type}
                                    onChange={(e) => handleInputChange(index, 'type', e.target.value)}
                                >
                                    <option value="theory">Theory</option>
                                    <option value="lab">Lab</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Slot(s)</label>
                                <Input
                                    value={input.slot}
                                    onChange={(e) => handleInputChange(index, 'slot', e.target.value)}
                                    placeholder="A1+TA1"
                                    className="mt-2"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Room</label>
                                <Input
                                    value={input.room_number}
                                    onChange={(e) => handleInputChange(index, 'room_number', e.target.value)}
                                    placeholder="SJT 101"
                                    className="mt-2"
                                />
                            </div>
                            <div className="md:col-span-1 flex justify-end">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeRow(index)}
                                    disabled={inputs.length === 1}
                                    className="text-destructive hover:text-destructive h-10 w-10 p-0"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                <Button variant="outline" onClick={addRow} className="w-full">
                    <Plus className="mr-2 h-4 w-4" /> Add Another Course
                </Button>

                <div className="flex justify-end">
                    <Button onClick={handleGenerate} disabled={inputs.some(i => !i.slot || !i.subject_name)}>
                        Generate Preview
                    </Button>
                </div>

                {preview && (
                    <div className="space-y-4 border-t pt-4">
                        <h3 className="font-semibold">Preview</h3>

                        {preview.errors.length > 0 ? (
                            <div className="p-4 bg-destructive/10 text-destructive rounded-md space-y-2">
                                <div className="flex items-center gap-2 font-medium">
                                    <AlertCircle className="h-4 w-4" />
                                    Errors Found
                                </div>
                                <ul className="list-disc list-inside text-sm">
                                    {preview.errors.map((err, i) => (
                                        <li key={i}>{err}</li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-md flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4" />
                                    {preview.entries.length} sessions generated successfully.
                                </div>
                                <div className="border rounded-md overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted">
                                            <tr>
                                                <th className="p-2 text-left">Subject</th>
                                                <th className="p-2 text-left">Slot</th>
                                                <th className="p-2 text-left">Day</th>
                                                <th className="p-2 text-left">Time</th>
                                                <th className="p-2 text-left">Room</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {preview.entries.map((entry, i) => (
                                                <tr key={i} className="border-t">
                                                    <td className="p-2">{entry.subject_name}</td>
                                                    <td className="p-2">{entry.slot_code}</td>
                                                    <td className="p-2">{entry.day}</td>
                                                    <td className="p-2">{formatTimeTo12Hr(entry.start_time)} - {formatTimeTo12Hr(entry.end_time)}</td>
                                                    <td className="p-2">{entry.room_number}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button
                    onClick={handleSave}
                    disabled={!preview || preview.errors.length > 0 || loading}
                    isLoading={loading}
                >
                    Save Timetable
                </Button>
            </div>
        </Modal>
    );
}
