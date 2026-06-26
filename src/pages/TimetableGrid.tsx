import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Button } from '../components/ui/button';
import { ArrowLeft, Download } from 'lucide-react';
import { EditClassModal } from '../components/timetable/EditClassModal';
import { SEO } from '../components/SEO';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { formatTimeTo12Hr } from '../lib/time';

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

const THEORY_COLUMNS = [
    { start: '08:00', end: '08:50' },
    { start: '09:00', end: '09:50' },
    { start: '10:00', end: '10:50' },
    { start: '11:00', end: '11:50' },
    { start: '12:00', end: '12:50' },
    { start: '-', end: '-' },
    { start: 'Lunch', end: 'Lunch' },
    { start: '14:00', end: '14:50' },
    { start: '15:00', end: '15:50' },
    { start: '16:00', end: '16:50' },
    { start: '17:00', end: '17:50' },
    { start: '18:00', end: '18:50' },
    { start: '18:51', end: '19:00' },
] as const;

const LAB_COLUMNS = [
    { start: '08:00', end: '08:50' },
    { start: '08:51', end: '09:40' },
    { start: '09:51', end: '10:40' },
    { start: '10:41', end: '11:30' },
    { start: '11:40', end: '12:30' },
    { start: '12:31', end: '13:20' },
    { start: 'Lunch', end: 'Lunch' },
    { start: '14:00', end: '14:50' },
    { start: '14:51', end: '15:40' },
    { start: '15:51', end: '16:40' },
    { start: '16:41', end: '17:30' },
    { start: '17:40', end: '18:30' },
    { start: '18:31', end: '19:20' },
] as const;

const DAYS_OF_WEEK = [
    { label: 'MON', fullName: 'Monday' },
    { label: 'TUE', fullName: 'Tuesday' },
    { label: 'WED', fullName: 'Wednesday' },
    { label: 'THU', fullName: 'Thursday' },
    { label: 'FRI', fullName: 'Friday' }
] as const;

const GRID_DATA: Record<string, { theory: string[], lab: string[] }> = {
    'Monday': {
        theory: ['A1', 'F1', 'D1', 'TB1', 'TG1', '-', 'Lunch', 'A2', 'F2', 'D2', 'TB2', 'TG2', '-'],
        lab: ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'Lunch', 'L31', 'L32', 'L33', 'L34', 'L35', 'L36']
    },
    'Tuesday': {
        theory: ['B1', 'G1', 'E1', 'TC1', 'TAA1', '-', 'Lunch', 'B2', 'G2', 'E2', 'TC2', 'TAA2', '-'],
        lab: ['L7', 'L8', 'L9', 'L10', 'L11', 'L12', 'Lunch', 'L37', 'L38', 'L39', 'L40', 'L41', 'L42']
    },
    'Wednesday': {
        theory: ['C1', 'A1', 'F1', 'V1', 'V2', '-', 'Lunch', 'C2', 'A2', 'F2', 'TD2', 'TBB2', '-'],
        lab: ['L13', 'L14', 'L15', 'L16', 'L17', 'L18', 'Lunch', 'L43', 'L44', 'L45', 'L46', 'L47', 'L48']
    },
    'Thursday': {
        theory: ['D1', 'B1', 'G1', 'TE1', 'TCC1', '-', 'Lunch', 'D2', 'B2', 'G2', 'TE2', 'TCC2', '-'],
        lab: ['L19', 'L20', 'L21', 'L22', 'L23', 'L24', 'Lunch', 'L49', 'L50', 'L51', 'L52', 'L53', 'L54']
    },
    'Friday': {
        theory: ['E1', 'C1', 'TA1', 'TF1', 'TD1', '-', 'Lunch', 'E2', 'C2', 'TA2', 'TF2', 'TDD2', '-'],
        lab: ['L25', 'L26', 'L27', 'L28', 'L29', 'L30', 'Lunch', 'L55', 'L56', 'L57', 'L58', 'L59', 'L60']
    }
};

export function TimetableGrid() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [entries, setEntries] = useState<TimetableEntry[]>([]);
    const [isEditClassOpen, setIsEditClassOpen] = useState(false);
    const [selectedEntryForEdit, setSelectedEntryForEdit] = useState<TimetableEntry | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const fetchTimetable = async () => {
        if (!user) return;
        try {
            const basicQuery = query(collection(db, 'timetable_entries'), where('user_id', '==', user.uid));
            const smartQuery = query(collection(db, 'smart_timetable_entries'), where('user_id', '==', user.uid));

            const [basicSnapshot, smartSnapshot] = await Promise.all([
                getDocs(basicQuery),
                getDocs(smartQuery)
            ]);

            const basicData = basicSnapshot.docs.map(doc => ({ id: doc.id, _collection: 'timetable_entries' as const, ...doc.data() as any }));
            const smartData = smartSnapshot.docs.map(doc => ({ id: doc.id, _collection: 'smart_timetable_entries' as const, ...doc.data() as any }));

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

    const getCellEntry = (dayName: string, type: 'theory' | 'lab', slotCode: string, colIndex: number) => {
        if (slotCode === '-' || slotCode === 'Lunch') return null;
        
        return entries.find(entry => {
            if (entry.day !== dayName || entry.type !== type) return false;
            
            if (entry.slot_code && entry.slot_code.toUpperCase() === slotCode.toUpperCase()) {
                return true;
            }
            
            const columns = type === 'theory' ? THEORY_COLUMNS : LAB_COLUMNS;
            const cellTime = columns[colIndex]?.start;
            if (cellTime && cellTime !== '-' && cellTime !== 'Lunch') {
                if (entry.start_time && entry.start_time.slice(0, 5) === cellTime) {
                    return true;
                }
            }
            
            return false;
        });
    };

    const handleDownloadImage = async () => {
        const gridElement = document.getElementById('timetable-grid-container');
        if (!gridElement) return;

        setIsDownloading(true);
        try {
            const isDark = document.documentElement.classList.contains('dark');
            const bgColor = isDark ? '#020617' : '#f8f8fd';

            const canvas = await html2canvas(gridElement, {
                useCORS: true,
                scale: 2,
                backgroundColor: bgColor,
                logging: false,
                onclone: (clonedDoc) => {
                    const clonedEl = clonedDoc.getElementById('timetable-grid-container');
                    if (clonedEl) {
                        clonedEl.style.overflow = 'visible';
                        clonedEl.style.width = 'auto';
                        clonedEl.style.maxWidth = 'none';
                        clonedEl.style.padding = '24px';
                    }
                }
            });

            const link = document.createElement('a');
            link.download = 'timetable-grid.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            console.error('Error exporting grid to image:', error);
        } finally {
            setIsDownloading(false);
        }
    };

    const formatCellContent = (slotCode: string, entry: TimetableEntry) => {
        const typeLabel = entry.type === 'theory' ? 'TH' : 'LO';
        const room = entry.room_number ? entry.room_number.replace(/\s+/g, '') : 'TBA';
        return `${slotCode}-${entry.subject_code}-${typeLabel}-${room}`;
    };

    if (loading) return <div className="p-8 text-center">Loading timetable grid...</div>;

    return (
        <div className="space-y-8 pb-20">
            <SEO 
                title="Weekly Grid | StudyTrack" 
                description="View your weekly class schedule in a complete VIT FFCS slot grid."
            />
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={() => navigate('/timetable')} className="h-9 w-9 p-0 hover:bg-muted">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Weekly Grid</h1>
                        <p className="text-muted-foreground">
                            VIT FFCS master slot schedule.
                        </p>
                    </div>
                </div>
                <Button
                    onClick={handleDownloadImage}
                    disabled={isDownloading}
                    className="w-full sm:w-auto flex items-center justify-center gap-2"
                >
                    <Download className="h-4 w-4" />
                    {isDownloading ? 'Downloading...' : 'Download PNG'}
                </Button>
            </div>

            <div id="timetable-grid-container" className="w-full overflow-x-auto rounded-3xl border border-white/10 glass shadow-xxl p-2 select-none">
                <table className="w-full border-collapse text-[10px] md:text-xs min-w-[1000px] xl:min-w-full table-fixed">
                    <thead>
                        <tr className="bg-muted/40 text-center font-bold text-muted-foreground">
                            <th rowSpan={2} className="border border-white/10 p-2 w-20 text-foreground font-extrabold uppercase bg-muted/60 rounded-tl-2xl">THEORY</th>
                            <th className="border border-white/10 p-2 w-16">Start</th>
                            {THEORY_COLUMNS.map((col, idx) => (
                                <th key={`t-start-${idx}`} className="border border-white/10 p-2 font-semibold text-[10px]">{formatTimeTo12Hr(col.start)}</th>
                            ))}
                        </tr>
                        <tr className="bg-muted/40 text-center font-bold text-muted-foreground">
                            <th className="border border-white/10 p-2 w-16">End</th>
                            {THEORY_COLUMNS.map((col, idx) => (
                                <th key={`t-end-${idx}`} className="border border-white/10 p-2 font-semibold text-[10px]">{formatTimeTo12Hr(col.end)}</th>
                            ))}
                        </tr>
                        <tr className="bg-muted/40 text-center font-bold text-muted-foreground">
                            <th rowSpan={2} className="border border-white/10 p-2 w-20 text-foreground font-extrabold uppercase bg-muted/60">LAB</th>
                            <th className="border border-white/10 p-2 w-16">Start</th>
                            {LAB_COLUMNS.map((col, idx) => (
                                <th key={`l-start-${idx}`} className="border border-white/10 p-2 font-semibold text-[10px]">{formatTimeTo12Hr(col.start)}</th>
                            ))}
                        </tr>
                        <tr className="bg-muted/40 text-center font-bold text-muted-foreground">
                            <th className="border border-white/10 p-2 w-16">End</th>
                            {LAB_COLUMNS.map((col, idx) => (
                                <th key={`l-end-${idx}`} className="border border-white/10 p-2 font-semibold text-[10px]">{formatTimeTo12Hr(col.end)}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {DAYS_OF_WEEK.map((day) => {
                            const theorySlots = GRID_DATA[day.fullName].theory;
                            const labSlots = GRID_DATA[day.fullName].lab;

                            return (
                                <React.Fragment key={day.fullName}>
                                    <tr className="h-16">
                                        <td rowSpan={2} className="border border-white/10 p-2 font-bold text-center bg-muted/30 text-foreground text-sm tracking-wider uppercase">
                                            {day.label}
                                        </td>
                                        <td className="border border-white/10 p-2 font-semibold text-center bg-muted/20 text-muted-foreground text-[10px] uppercase">
                                            THEORY
                                        </td>
                                        {theorySlots.map((slot, idx) => {
                                            if (slot === 'Lunch') {
                                                return (
                                                    <td key={`t-cell-${day.fullName}-${idx}`} className="border border-white/10 p-2 text-center bg-muted/15 text-muted-foreground font-medium text-[11px] uppercase tracking-wide">
                                                        Lunch
                                                    </td>
                                                );
                                            }
                                            if (slot === '-') {
                                                return (
                                                    <td key={`t-cell-${day.fullName}-${idx}`} className="border border-white/10 p-2 text-center text-muted-foreground/35 bg-muted/5 font-normal text-sm">
                                                        -
                                                    </td>
                                                );
                                            }

                                            const matchedEntry = getCellEntry(day.fullName, 'theory', slot, idx);

                                            if (matchedEntry) {
                                                return (
                                                    <td
                                                        key={`t-cell-${day.fullName}-${idx}`}
                                                        onClick={() => {
                                                            setSelectedEntryForEdit(matchedEntry);
                                                            setIsEditClassOpen(true);
                                                        }}
                                                        className="border border-white/10 p-1 text-center bg-[#ff4d79] text-white font-bold text-[10px] md:text-[11px] leading-tight cursor-pointer hover:scale-[1.02] active:scale-95 transition-all shadow-md rounded-md hover:z-10"
                                                        title={`Subject: ${matchedEntry.subject_name}`}
                                                    >
                                                        {formatCellContent(slot, matchedEntry)}
                                                    </td>
                                                );
                                            }

                                            return (
                                                <td key={`t-cell-${day.fullName}-${idx}`} className="border border-white/10 p-2 text-center text-muted-foreground bg-card/45 hover:bg-muted/10 font-medium">
                                                    {slot}
                                                </td>
                                            );
                                        })}
                                    </tr>

                                    <tr className="h-16">
                                        <td className="border border-white/10 p-2 font-semibold text-center bg-muted/20 text-muted-foreground text-[10px] uppercase">
                                            LAB
                                        </td>
                                        {labSlots.map((slot, idx) => {
                                            if (slot === 'Lunch') {
                                                return (
                                                    <td key={`l-cell-${day.fullName}-${idx}`} className="border border-white/10 p-2 text-center bg-muted/15 text-muted-foreground font-medium text-[11px] uppercase tracking-wide">
                                                        Lunch
                                                    </td>
                                                );
                                            }
                                            if (slot === '-') {
                                                return (
                                                    <td key={`l-cell-${day.fullName}-${idx}`} className="border border-white/10 p-2 text-center text-muted-foreground/35 bg-muted/5 font-normal text-sm">
                                                        -
                                                    </td>
                                                );
                                            }

                                            const matchedEntry = getCellEntry(day.fullName, 'lab', slot, idx);

                                            if (matchedEntry) {
                                                return (
                                                    <td
                                                        key={`l-cell-${day.fullName}-${idx}`}
                                                        onClick={() => {
                                                            setSelectedEntryForEdit(matchedEntry);
                                                            setIsEditClassOpen(true);
                                                        }}
                                                        className="border border-white/10 p-1 text-center bg-[#ff4d79] text-white font-bold text-[10px] md:text-[11px] leading-tight cursor-pointer hover:scale-[1.02] active:scale-95 transition-all shadow-md rounded-md hover:z-10"
                                                        title={`Subject: ${matchedEntry.subject_name}`}
                                                    >
                                                        {formatCellContent(slot, matchedEntry)}
                                                    </td>
                                                );
                                            }

                                            return (
                                                <td key={`l-cell-${day.fullName}-${idx}`} className="border border-white/10 p-2 text-center text-muted-foreground bg-card/45 hover:bg-muted/10 font-medium">
                                                    {slot}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <EditClassModal
                isOpen={isEditClassOpen}
                onClose={() => {
                    setIsEditClassOpen(false);
                    setSelectedEntryForEdit(null);
                }}
                onSuccess={fetchTimetable}
                entry={selectedEntryForEdit}
            />
        </div>
    );
}
