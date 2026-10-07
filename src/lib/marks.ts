import { type Grade } from './cgpa';

export type CourseType = 'theory' | 'lab';

export type TheoryInternalPattern = 'complete' | '15_15' | '20_10' | '10_10_10';

export type LabPattern = 'da6_fat' | 'da10_nofat' | 'cat_fat';

export type TheoryCourseCategory = 'standard' | 'soft_skills';

export interface InternalComponent {
    name: string; // e.g. "Quiz", "Seminar", "Case Study", "Assignment"
    max_marks: number; // e.g. 15, 10, 20, 30
    marks?: number | null;
}

export interface TheoryMarks {
    category?: TheoryCourseCategory; // 'standard' (CATs /50, FAT /100) | 'soft_skills' (CATs /30, FAT /50)
    cat_max_raw?: number; // 50 (standard) or 30 (soft_skills)
    cat1_raw?: number | null; // out of cat_max_raw
    cat1_weight?: number | null; // out of 15
    cat2_raw?: number | null; // out of cat_max_raw
    cat2_weight?: number | null; // out of 15
    internal_pattern: TheoryInternalPattern; // complete 30 | 15+15 | 20+10 | 10+10+10
    internal_components?: InternalComponent[];
    internal_parts?: {
        part1?: number | null;
        part2?: number | null;
        part3?: number | null;
    };
    internal_total?: number | null; // out of 30
    fat_max_raw?: number; // 100 (standard) or 50 (soft_skills)
    fat_raw?: number | null; // out of fat_max_raw
    fat_weight?: number | null; // out of 40
}

/**
 * Detects if a course is a Soft Skills / STS course by code or name
 */
export function isSoftSkillsCourse(courseCode?: string, courseName?: string): boolean {
    const code = (courseCode || '').trim().toUpperCase();
    const name = (courseName || '').trim().toUpperCase();
    return code.startsWith('STS') || code.includes('STS') || /SOFT\s*SKILL|APTITUDE|REASONING/.test(name);
}

export interface LabMarks {
    pattern: LabPattern;
    // For da6_fat: DA 1 to 6 (each 10 = 60) + Lab FAT (40) = 100
    // For da10_nofat: DA 1 to 10 (each 10 = 100), no FAT
    // For cat_fat: CAT1 (15) + CAT2 (15) + Lab FAT (40) + Lab DA/Continuous (30) = 100
    da_marks: (number | null)[]; // indices 0 to 9 for DA1 to DA10
    cat1_weight?: number | null; // out of 15
    cat2_weight?: number | null; // out of 15
    internal_weight?: number | null; // out of 30
    fat_raw?: number | null; // raw FAT out of 50 (if entered)
    fat_weight?: number | null; // out of 40
}

export interface CourseMarkEntry {
    id: string;
    user_id: string;
    course_name: string;
    course_code: string;
    slot: string;
    credit: number;
    type: CourseType;
    semester_id?: string;
    semester_name?: string;
    grade?: Grade | string; // Official grade from CGPA page (S, A, B, C, D, E, F, etc.)
    theory_marks?: TheoryMarks;
    lab_marks?: LabMarks;
    total_marks: number; // Rounded integer (out of 100)
    updated_at?: string;
    created_at?: string;
}

/**
 * Calculates Theory weightages and rounded total
 */
export function calculateTheoryMarks(data: Partial<TheoryMarks>): {
    cat1_weight: number;
    cat2_weight: number;
    internal_total: number;
    fat_weight: number;
    total: number;
} {
    const isSoftSkills = data.category === 'soft_skills';
    const catMax = data.cat_max_raw && data.cat_max_raw > 0 ? data.cat_max_raw : (isSoftSkills ? 30 : 50);
    const fatMax = data.fat_max_raw && data.fat_max_raw > 0 ? data.fat_max_raw : (isSoftSkills ? 50 : 100);

    // CAT 1 weight (out of 15, raw usually out of 50 or 30)
    let cat1_w = 0;
    if (data.cat1_weight !== undefined && data.cat1_weight !== null) {
        cat1_w = Number(data.cat1_weight) || 0;
    } else if (data.cat1_raw !== undefined && data.cat1_raw !== null) {
        cat1_w = Math.min(15, Math.max(0, (Number(data.cat1_raw) / catMax) * 15));
    }

    // CAT 2 weight (out of 15, raw usually out of 50 or 30)
    let cat2_w = 0;
    if (data.cat2_weight !== undefined && data.cat2_weight !== null) {
        cat2_w = Number(data.cat2_weight) || 0;
    } else if (data.cat2_raw !== undefined && data.cat2_raw !== null) {
        cat2_w = Math.min(15, Math.max(0, (Number(data.cat2_raw) / catMax) * 15));
    }

    // Internal (30)
    let internal_tot = 0;
    if (data.internal_components && data.internal_components.length > 0) {
        internal_tot = data.internal_components.reduce<number>(
            (sum, item) => sum + Math.min(item.max_marks, Math.max(0, Number(item.marks) || 0)),
            0
        );
        internal_tot = Math.min(30, internal_tot);
    } else {
        const parts = data.internal_parts || {};
        if (data.internal_pattern === 'complete') {
            internal_tot = Math.min(30, Math.max(0, Number(parts.part1) || 0));
        } else if (data.internal_pattern === '15_15') {
            const p1 = Math.min(15, Math.max(0, Number(parts.part1) || 0));
            const p2 = Math.min(15, Math.max(0, Number(parts.part2) || 0));
            internal_tot = p1 + p2;
        } else if (data.internal_pattern === '20_10') {
            const p1 = Math.min(20, Math.max(0, Number(parts.part1) || 0));
            const p2 = Math.min(10, Math.max(0, Number(parts.part2) || 0));
            internal_tot = p1 + p2;
        } else if (data.internal_pattern === '10_10_10') {
            const p1 = Math.min(10, Math.max(0, Number(parts.part1) || 0));
            const p2 = Math.min(10, Math.max(0, Number(parts.part2) || 0));
            const p3 = Math.min(10, Math.max(0, Number(parts.part3) || 0));
            internal_tot = p1 + p2 + p3;
        } else if (data.internal_total !== undefined && data.internal_total !== null) {
            internal_tot = Math.min(30, Math.max(0, Number(data.internal_total) || 0));
        }
    }

    // FAT weight (out of 40, raw usually out of 100 or 50)
    let fat_w = 0;
    if (data.fat_weight !== undefined && data.fat_weight !== null) {
        fat_w = Number(data.fat_weight) || 0;
    } else if (data.fat_raw !== undefined && data.fat_raw !== null) {
        fat_w = Math.min(40, Math.max(0, (Number(data.fat_raw) / fatMax) * 40));
    }

    cat1_w = Math.round(cat1_w * 100) / 100;
    cat2_w = Math.round(cat2_w * 100) / 100;
    internal_tot = Math.round(internal_tot * 100) / 100;
    fat_w = Math.round(fat_w * 100) / 100;

    // 2 decimal places total
    const rawTotal = cat1_w + cat2_w + internal_tot + fat_w;
    const roundedTotal = Math.min(100, Math.round(rawTotal * 100) / 100);

    return {
        cat1_weight: cat1_w,
        cat2_weight: cat2_w,
        internal_total: internal_tot,
        fat_weight: fat_w,
        total: roundedTotal,
    };
}

/**
 * Calculates Lab marks and rounded total based on chosen pattern (allowing 2 decimal places)
 */
export function calculateLabMarks(data: Partial<LabMarks>): {
    da_total: number;
    fat_weight: number;
    cat_total: number;
    total: number;
} {
    const pattern = data.pattern || 'da6_fat';
    const daMarks = data.da_marks || [];

    let fat_w = 0;
    if (data.fat_weight !== undefined && data.fat_weight !== null) {
        fat_w = Number(data.fat_weight) || 0;
    } else if (data.fat_raw !== undefined && data.fat_raw !== null) {
        fat_w = Math.min(40, Math.max(0, (Number(data.fat_raw) / 50) * 40));
    }
    fat_w = Math.round(fat_w * 100) / 100;

    if (pattern === 'da10_nofat') {
        const daTotal = daMarks.slice(0, 10).reduce<number>((sum, val) => sum + (Number(val) || 0), 0);
        const roundedDa = Math.round(daTotal * 100) / 100;
        return {
            da_total: roundedDa,
            fat_weight: 0,
            cat_total: 0,
            total: Math.min(100, roundedDa),
        };
    }

    if (pattern === 'cat_fat') {
        const cat1 = Math.min(15, Math.max(0, Number(data.cat1_weight) || 0));
        const cat2 = Math.min(15, Math.max(0, Number(data.cat2_weight) || 0));
        const catTotal = Math.round((cat1 + cat2) * 100) / 100;

        let internalDAs = 0;
        if (data.internal_weight !== undefined && data.internal_weight !== null) {
            internalDAs = Math.min(30, Math.max(0, Number(data.internal_weight) || 0));
        } else {
            internalDAs = daMarks.slice(0, 3).reduce<number>((sum, val) => sum + (Number(val) || 0), 0);
            internalDAs = Math.min(30, internalDAs);
        }

        const rawTotal = catTotal + fat_w + internalDAs;
        return {
            da_total: Math.round(internalDAs * 100) / 100,
            fat_weight: fat_w,
            cat_total: catTotal,
            total: Math.min(100, Math.round(rawTotal * 100) / 100),
        };
    }

    // Default: da6_fat -> DA 1 to 6 + FAT
    const da6Total = daMarks.slice(0, 6).reduce<number>((sum, val) => sum + (Number(val) || 0), 0);
    const roundedDa = Math.round(da6Total * 100) / 100;
    const rawTotal = roundedDa + fat_w;

    return {
        da_total: roundedDa,
        fat_weight: fat_w,
        cat_total: 0,
        total: Math.min(100, Math.round(rawTotal * 100) / 100),
    };
}

export interface LabBreakdownResult {
    pattern: LabPattern;
    internal_total: number;
    max_internal: number;
    fat_weight: number | null;
    max_fat: number;
    cat_total?: number;
    has_entered_internals: boolean;
    has_entered_fat: boolean;
    pattern_label: string;
}

/**
 * Summarizes Lab internals and FAT weightages for clean list views
 */
export function getLabBreakdown(lm?: LabMarks): LabBreakdownResult {
    const pattern = lm?.pattern || 'da6_fat';
    if (!lm) {
        return {
            pattern,
            internal_total: 0,
            max_internal: pattern === 'da10_nofat' ? 100 : 60,
            fat_weight: null,
            max_fat: pattern === 'da10_nofat' ? 0 : 40,
            has_entered_internals: false,
            has_entered_fat: false,
            pattern_label: '6 DAs + FAT',
        };
    }

    const calc = calculateLabMarks(lm);
    const hasEnteredFat = lm.fat_weight !== null && lm.fat_weight !== undefined && lm.fat_weight !== ('' as any);
    const hasEnteredRawFat = lm.fat_raw !== null && lm.fat_raw !== undefined && lm.fat_raw !== ('' as any);

    if (pattern === 'da10_nofat') {
        const hasAnyDa = (lm.da_marks || []).slice(0, 10).some(v => v !== null && v !== undefined && v !== ('' as any));
        return {
            pattern,
            internal_total: calc.da_total,
            max_internal: 100,
            fat_weight: null,
            max_fat: 0,
            has_entered_internals: hasAnyDa,
            has_entered_fat: false,
            pattern_label: '10 DAs (100)',
        };
    }

    if (pattern === 'cat_fat') {
        const hasCat = (lm.cat1_weight !== null && lm.cat1_weight !== undefined) || (lm.cat2_weight !== null && lm.cat2_weight !== undefined);
        const hasDa = (lm.internal_weight !== null && lm.internal_weight !== undefined) || (lm.da_marks || []).some(v => v !== null && v !== undefined);
        const internalTotal = Math.round((calc.cat_total + calc.da_total) * 100) / 100;
        return {
            pattern,
            internal_total: internalTotal,
            max_internal: 60,
            fat_weight: hasEnteredFat || hasEnteredRawFat ? calc.fat_weight : null,
            max_fat: 40,
            cat_total: calc.cat_total,
            has_entered_internals: hasCat || hasDa,
            has_entered_fat: hasEnteredFat || hasEnteredRawFat,
            pattern_label: 'CATs + FAT',
        };
    }

    // Default: da6_fat
    const hasAnyDa = (lm.da_marks || []).slice(0, 6).some(v => v !== null && v !== undefined && v !== ('' as any));
    return {
        pattern,
        internal_total: calc.da_total,
        max_internal: 60,
        fat_weight: hasEnteredFat || hasEnteredRawFat ? calc.fat_weight : null,
        max_fat: 40,
        has_entered_internals: hasAnyDa,
        has_entered_fat: hasEnteredFat || hasEnteredRawFat,
        pattern_label: '6 DAs + FAT',
    };
}


/**
 * Formats marks to up to 2 decimal places without trailing floating-point inaccuracies
 */
export function formatMarks(val: number | null | undefined): string {
    if (val === null || val === undefined || isNaN(val)) return '-';
    const rounded = Math.round(Number(val) * 100) / 100;
    return rounded.toString();
}

/**
 * Grade badge color styling using CGPA page grade standards
 */
export function getGradeBadgeStyle(grade?: string): { bg: string; text: string; border: string; label: string } {
    switch (grade) {
        case 'S':
            return { bg: 'bg-emerald-500/15', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-500/30', label: 'S (10 pts)' };
        case 'A':
            return { bg: 'bg-blue-500/15', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-500/30', label: 'A (9 pts)' };
        case 'B':
            return { bg: 'bg-cyan-500/15', text: 'text-cyan-700 dark:text-cyan-400', border: 'border-cyan-500/30', label: 'B (8 pts)' };
        case 'C':
            return { bg: 'bg-indigo-500/15', text: 'text-indigo-700 dark:text-indigo-400', border: 'border-indigo-500/30', label: 'C (7 pts)' };
        case 'D':
            return { bg: 'bg-amber-500/15', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-500/30', label: 'D (6 pts)' };
        case 'E':
            return { bg: 'bg-orange-500/15', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-500/30', label: 'E (5 pts)' };
        case 'F':
            return { bg: 'bg-red-500/15', text: 'text-red-700 dark:text-red-400', border: 'border-red-500/30', label: 'F (Fail)' };
        case 'N':
            return { bg: 'bg-purple-500/15', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-500/30', label: 'N (No Grade)' };
        case 'P':
            return { bg: 'bg-teal-500/15', text: 'text-teal-700 dark:text-teal-400', border: 'border-teal-500/30', label: 'Pass' };
        case 'A_ABSENT':
            return { bg: 'bg-zinc-500/15', text: 'text-zinc-700 dark:text-zinc-400', border: 'border-zinc-500/30', label: 'Absent' };
        default:
            return { bg: 'bg-muted/40', text: 'text-muted-foreground', border: 'border-border/60', label: 'Not Graded' };
    }
}
