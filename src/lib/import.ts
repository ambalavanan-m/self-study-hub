import { collection, addDoc, writeBatch, doc } from 'firebase/firestore';
import { db } from './firebase';

interface ImportOptions {
    file: File;
    userId: string;
}

export async function importCGPA({ file, userId }: ImportOptions): Promise<void> {
    const text = await file.text();
    const data = JSON.parse(text);

    if (!Array.isArray(data)) throw new Error('Invalid data format');

    for (const semester of data) {
        // 1. Create Semester
        const semDocRef = await addDoc(collection(db, 'semesters'), {
            user_id: userId,
            year: semester.year,
            term: semester.term
        });

        // 2. Create Subjects
        if (semester.subjects && semester.subjects.length > 0) {
            const batch = writeBatch(db);
            semester.subjects.forEach((sub: any) => {
                const subRef = doc(collection(db, 'subjects'));
                batch.set(subRef, {
                    user_id: userId,
                    semester_id: semDocRef.id,
                    subject_name: sub.subject_name,
                    subject_code: sub.subject_code,
                    credit: sub.credit,
                    grade: sub.grade
                });
            });
            await batch.commit();
        }
    }
}

export async function importTimetable({ file, userId }: ImportOptions): Promise<void> {
    const text = await file.text();
    const data = JSON.parse(text);

    if (!Array.isArray(data)) throw new Error('Invalid data format');

    const batch = writeBatch(db);
    data.forEach((entry: any) => {
        const docRef = doc(collection(db, 'timetable_entries'));
        batch.set(docRef, {
            user_id: userId,
            day: entry.day,
            start_time: entry.start_time,
            end_time: entry.end_time,
            subject_name: entry.subject_name,
            subject_code: entry.subject_code,
            type: entry.type,
            room_number: entry.room_number,
            slot_code: entry.slot_code,
            slot_label: entry.slot_label
        });
    });
    await batch.commit();
}

