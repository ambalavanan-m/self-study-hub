import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Button } from '../components/ui/button';
import { Plus, Trash2, Wand2, Clock, MapPin } from 'lucide-react';
import { AddClassModal } from '../components/timetable/AddClassModal';
import { SmartAddModal } from '../components/timetable/SmartAddModal';
import { Card } from '../components/ui/card';
import { cn } from '../lib/utils';
import { SEO } from '../components/SEO';

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
}

export function Timetable() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [entries, setEntries] = useState<TimetableEntry[]>([]);
    const [isAddClassOpen, setIsAddClassOpen] = useState(false);
    const [isSmartAddOpen, setIsSmartAddOpen] = useState(false);
    const [selectedDay, setSelectedDay] = useState<string>(() => {
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        return ['Saturday', 'Sunday'].includes(today) ? 'Monday' : today;
    });

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    const fetchTimetable = async () => {
        if (!user) return;
        try {
            const basicQuery = query(collection(db, 'timetable_entries'), where('user_id', '==', user.uid));
            const smartQuery = query(collection(db, 'smart_timetable_entries'), where('user_id', '==', user.uid));

            const [basicSnapshot, smartSnapshot] = await Promise.all([
                getDocs(basicQuery),
                getDocs(smartQuery)
            ]);

            const basicData = basicSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
            const smartData = smartSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

            // Merge and sort entries
            const allEntries = [...basicData, ...smartData];
            allEntries.sort((a, b) => a.start_time.localeCompare(b.start_time));

            setEntries(allEntries);
        } catch (error) {
            console.error('Error fetching timetable:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTimetable();
    }, [user]);

    const handleDeleteEntry = async (id: string) => {
        if (!confirm('Are you sure you want to delete this class?')) return;
        try {
            // Try deleting from both tables (one will succeed, one will do nothing)
            await Promise.all([
                deleteDoc(doc(db, 'timetable_entries', id)),
                deleteDoc(doc(db, 'smart_timetable_entries', id))
            ]);
            fetchTimetable();
        } catch (error) {
            console.error('Error deleting entry:', error);
        }
    };

    const filteredEntries = entries.filter(entry => entry.day === selectedDay);

    if (loading) return <div className="p-8 text-center">Loading timetable...</div>;

    return (
        <div className="space-y-8 pb-20">
            <SEO 
                title="Timetable | StudyTrack" 
                description="Organize your weekly class schedule with StudyTrack's interactive timetable. Manage theory and lab sessions with ease."
            />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Timetable</h1>
                    <p className="text-muted-foreground">
                        Manage your weekly class schedule.
                    </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button onClick={() => setIsSmartAddOpen(true)} variant="secondary" className="flex-1 sm:flex-none">
                        <Wand2 className="mr-2 h-4 w-4" />
                        Smart Add
                    </Button>
                    <Button onClick={() => setIsAddClassOpen(true)} className="flex-1 sm:flex-none">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Class
                    </Button>
                </div>
            </div>

            {/* Day Selector */}
            <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide">
                {days.map((day) => (
                    <Button
                        key={day}
                        variant={selectedDay === day ? 'primary' : 'outline'}
                        onClick={() => setSelectedDay(day)}
                        className={cn(
                            "whitespace-nowrap flex-shrink-0",
                            selectedDay === day && "bg-primary text-primary-foreground"
                        )}
                    >
                        {day}
                    </Button>
                ))}
            </div>

            {/* Timetable Entries */}
            <div className="space-y-4">
                {filteredEntries.length === 0 ? (
                    <div className="text-center py-12 border rounded-lg bg-muted/10">
                        <p className="text-muted-foreground">No classes scheduled for {selectedDay}.</p>
                    </div>
                ) : (
                    filteredEntries.map((entry) => (
                        <Card key={entry.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:border-primary/50 transition-colors">
                            <div className="flex-shrink-0 w-full sm:w-32 text-center sm:text-left">
                                <div className="font-bold text-lg">
                                    {entry.start_time.slice(0, 5)} - {entry.end_time.slice(0, 5)}
                                </div>
                                <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">
                                    {entry.type}
                                </div>
                            </div>

                            <div className="flex-1 w-full text-center sm:text-left">
                                <h3 className="font-semibold text-lg">{entry.subject_name}</h3>
                                <div className="flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                                    <span className="flex items-center gap-1">
                                        <MapPin className="h-3.5 w-3.5" />
                                        {entry.subject_code}
                                    </span>
                                    {entry.room_number && (
                                        <span className="flex items-center gap-1">
                                            • Room: {entry.room_number}
                                        </span>
                                    )}
                                    {entry.slot_label && (
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3.5 w-3.5" />
                                            Slot: {entry.slot_label}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="w-full sm:w-auto flex justify-end">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => handleDeleteEntry(entry.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            <AddClassModal
                isOpen={isAddClassOpen}
                onClose={() => setIsAddClassOpen(false)}
                onSuccess={fetchTimetable}
            />

            <SmartAddModal
                isOpen={isSmartAddOpen}
                onClose={() => setIsSmartAddOpen(false)}
                onSuccess={fetchTimetable}
            />
        </div>
    );
}
