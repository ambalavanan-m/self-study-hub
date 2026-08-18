export type Grade = 'S' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'N' | 'P' | 'A_ABSENT'; 

export const GRADE_POINTS: Record<Exclude<Grade, 'P' | 'A_ABSENT'>, number> = {
    S: 10,
    A: 9,
    B: 8,
    C: 7,
    D: 6,
    E: 5,
    F: 0,
    N: 0,
};

export type CurriculumBasketKey = 
    | 'discipline_core'
    | 'discipline_elective'
    | 'project_internship'
    | 'open_elective'
    | 'ability_enhancement'
    | 'language'
    | 'skill_enhancement'
    | 'value_added'
    | 'cocurricular';

export interface BasketMetadata {
    key: CurriculumBasketKey;
    title: string;
    shortName: string;
    requiredCredits: number;
    parentKey?: 'ability_enhancement_group' | 'value_added_group';
    description: string;
}

export interface BasketGroupMetadata {
    key: 'ability_enhancement_group' | 'value_added_group';
    title: string;
    shortName: string;
    requiredCredits: number;
    subBaskets: CurriculumBasketKey[];
}

export const BASKET_DEFINITIONS: Record<CurriculumBasketKey, BasketMetadata> = {
    discipline_core: {
        key: 'discipline_core',
        title: 'Discipline Core',
        shortName: 'Core',
        requiredCredits: 60,
        description: 'Mandatory core departmental foundational courses',
    },
    discipline_elective: {
        key: 'discipline_elective',
        title: 'Discipline Elective',
        shortName: 'Elective',
        requiredCredits: 24,
        description: 'Advanced specialized departmental electives',
    },
    project_internship: {
        key: 'project_internship',
        title: 'Project and Internship',
        shortName: 'Project',
        requiredCredits: 2,
        description: 'Capstone project, summer internships, or research',
    },
    open_elective: {
        key: 'open_elective',
        title: 'Open Elective',
        shortName: 'Open El.',
        requiredCredits: 9,
        description: 'Interdisciplinary courses across schools and domains',
    },
    ability_enhancement: {
        key: 'ability_enhancement',
        title: 'Ability Enhancement',
        shortName: 'Ability Enh.',
        requiredCredits: 5,
        parentKey: 'ability_enhancement_group',
        description: 'Core communication, writing, and environmental studies',
    },
    language: {
        key: 'language',
        title: 'Indian / Foreign Language',
        shortName: 'Language',
        requiredCredits: 3,
        parentKey: 'ability_enhancement_group',
        description: 'Indian or foreign language competency courses',
    },
    skill_enhancement: {
        key: 'skill_enhancement',
        title: 'Skill Enhancement',
        shortName: 'Skill Enh.',
        requiredCredits: 9,
        description: 'Hands-on practical, software, and technical skill labs',
    },
    value_added: {
        key: 'value_added',
        title: 'Value Added Course',
        shortName: 'Value Added',
        requiredCredits: 7,
        parentKey: 'value_added_group',
        description: 'Ethics, universal human values, and soft skills',
    },
    cocurricular: {
        key: 'cocurricular',
        title: 'Co-curricular Course',
        shortName: 'Co-curricular',
        requiredCredits: 1,
        parentKey: 'value_added_group',
        description: 'NSS, NCC, sports, clubs, and cultural activities',
    },
};

export const BASKET_GROUPS: BasketGroupMetadata[] = [
    {
        key: 'ability_enhancement_group',
        title: 'Ability Enhancement',
        shortName: 'AE',
        requiredCredits: 8,
        subBaskets: ['ability_enhancement', 'language'],
    },
    {
        key: 'value_added_group',
        title: 'Value Added Course',
        shortName: 'VAC',
        requiredCredits: 8,
        subBaskets: ['value_added', 'cocurricular'],
    },
];

export const TOTAL_CURRICULUM_CREDITS = 120;

export interface Subject {
    id: string;
    subject_name: string;
    subject_code: string;
    grade: Grade;
    credit: number;
    basket?: CurriculumBasketKey;
}

export interface Semester {
    id: string;
    year: number;
    term: 'Fall' | 'Winter' | 'Spring' | 'Summer';
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

export function calculateGradeDistribution(subjects: Subject[]): Record<Grade, number> {
    const initial: Record<Grade, number> = {
        S: 0,
        A: 0,
        B: 0,
        C: 0,
        D: 0,
        E: 0,
        F: 0,
        N: 0,
        P: 0,
        A_ABSENT: 0,
    };

    subjects.forEach((subject) => {
        if (subject.grade && initial[subject.grade] !== undefined) {
            initial[subject.grade]++;
        }
    });

    return initial;
}

export function getSubjectSortKey(subject: Subject): { 
    baseCode: string; 
    baseName: string; 
    isLab: boolean; 
    rawCode: string; 
    rawName: string;
} {
    const rawCode = (subject.subject_code || '').trim().toUpperCase();
    const rawName = (subject.subject_name || '').trim().toLowerCase();

    let baseCode = rawCode;
    let isLab = false;

    // Check course code suffix (e.g. UCSC101L vs UCSC101P)
    if (rawCode.length > 2 && (rawCode.endsWith('L') || rawCode.endsWith('P') || rawCode.endsWith('J'))) {
        baseCode = rawCode.slice(0, -1);
        isLab = rawCode.endsWith('P');
    } else if (rawName.endsWith(' lab') || rawName.endsWith(' laboratory') || rawName.endsWith(' practical')) {
        isLab = true;
    }

    // Clean baseName by removing "lab", "laboratory", "practical" suffixes
    const baseName = rawName
        .replace(/\s+lab\b/gi, '')
        .replace(/\s+laboratory\b/gi, '')
        .replace(/\s+practical\b/gi, '')
        .trim();

    return { baseCode, baseName, isLab, rawCode, rawName };
}

/**
 * Sorts courses in alphabetical order such that paired theory (e.g. UCSC101L) 
 * and lab (e.g. UCSC101P) courses are listed consecutively one after another.
 */
export function sortSubjectsAlphabeticallyWithLab<T extends Subject>(subjects: T[]): T[] {
    if (!subjects || subjects.length === 0) return [];

    return [...subjects].sort((a, b) => {
        const keyA = getSubjectSortKey(a);
        const keyB = getSubjectSortKey(b);

        // 1. Primary sort: Base Course Code (e.g. UCSC101 vs UCSC102)
        if (keyA.baseCode && keyB.baseCode && keyA.baseCode !== keyB.baseCode) {
            return keyA.baseCode.localeCompare(keyB.baseCode, undefined, { numeric: true, sensitivity: 'base' });
        }

        // 2. Secondary sort: Base Course Name (e.g. Programming in Python vs Software Engineering)
        if (keyA.baseName !== keyB.baseName) {
            const nameCmp = keyA.baseName.localeCompare(keyB.baseName, undefined, { numeric: true, sensitivity: 'base' });
            if (nameCmp !== 0) return nameCmp;
        }

        // 3. Consecutive order: Theory (isLab = false) comes before Lab (isLab = true)
        if (keyA.isLab !== keyB.isLab) {
            return keyA.isLab ? 1 : -1;
        }

        // 4. Fallback to raw code / raw name
        const rawCodeCmp = keyA.rawCode.localeCompare(keyB.rawCode);
        if (rawCodeCmp !== 0) return rawCodeCmp;

        return keyA.rawName.localeCompare(keyB.rawName);
    });
}

