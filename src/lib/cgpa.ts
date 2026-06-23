export type Grade = 'S' | 'A' | 'B' | 'C' | 'D' | 'E' | 'P' | 'A_ABSENT'; 

export const GRADE_POINTS: Record<Exclude<Grade, 'P' | 'A_ABSENT'>, number> = {
    S: 10,
    A: 9,
    B: 8,
    C: 7,
    D: 6,
    E: 5,
};

export interface Subject {
    id: string;
    subject_name: string;
    subject_code: string;
    grade: Grade;
    credit: number;
}

export interface Semester {
    id: string;
    year: number;
    term: 'Fall' | 'Winter';
    subjects: Subject[];
}

export function calculateGPA(subjects: Subject[]): number {
    if (!subjects || subjects.length === 0) return 0;

    let totalPoints = 0;
    let totalCredits = 0;

    subjects.forEach((subject) => {
        // Correctly skips Pass ('P') and Absent ('A_ABSENT')
        if (subject.grade === 'P' || subject.grade === 'A_ABSENT') {
            return; 
        }

        const points = GRADE_POINTS[subject.grade];
        if (points !== undefined) {
            totalPoints += points * subject.credit;
            totalCredits += subject.credit;
        }
    });

    if (totalCredits === 0) return 0;
    return Number((totalPoints / totalCredits).toFixed(2));
}

export function calculateCGPA(semesters: Semester[]): number {
    if (!semesters || semesters.length === 0) return 0;

    // Flatten all subjects from all semesters into a single array
    const allSubjects = semesters.flatMap((semester) => semester.subjects);
    
    // Reuse the GPA calculation logic to avoid code duplication
    return calculateGPA(allSubjects);
}
