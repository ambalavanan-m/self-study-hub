import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { type CourseMarkEntry, formatMarks, isSoftSkillsCourse } from './marks';
import { type Semester, GRADE_POINTS } from './cgpa';

export type MarksThemeColor = 'bw' | 'emerald' | 'cyan' | 'indigo' | 'violet' | 'rose' | 'amber' | 'slate';

export interface CustomMarksPDFOptions {
    reportTitle?: string;
    studentName?: string;
    studentId?: string;
    degreeName?: string;
    semesterFilter?: string; // 'all' or specific semester id
    semesterName?: string; // e.g. "Fall 2025" or "All Semesters"
    courseTypeFilter?: 'all' | 'theory' | 'lab';
    themeColor?: MarksThemeColor;
    includeDate?: boolean;
    includeGradeHistoryTable?: boolean; // Exact university Grade History format matching image
    includeSummaryKPIs?: boolean;
    includeScoreDistribution?: boolean;
    includeTheoryTable?: boolean;
    includeLabTable?: boolean;
    includeDetailedBreakdown?: boolean;
    customRemarks?: string;
}

/**
 * Detects course type abbreviation matching university grade history format:
 * 'TH' = Theory, 'LO' = Lab, 'SS' = Soft Skills
 */
function getCourseTypeCode(c: CourseMarkEntry): string {
    const code = (c.course_code || '').toUpperCase();
    if (code.includes('STS') || isSoftSkillsCourse(c.course_code, c.course_name)) {
        return 'SS';
    }
    if (c.type === 'lab' || code.endsWith('P')) {
        return 'LO';
    }
    return 'TH';
}

/**
 * Resolves course grade (from course object, matching subject in semester, or estimated from marks)
 */
function getCourseGrade(c: CourseMarkEntry, semesters: Semester[]): string {
    if (c.grade && typeof c.grade === 'string' && c.grade.trim() !== '' && c.grade !== '-') {
        return c.grade.trim();
    }

    const matchingSubject = semesters
        .flatMap(s => s.subjects || [])
        .find(s => s.subject_code?.trim().toUpperCase() === c.course_code?.trim().toUpperCase());
    if (matchingSubject?.grade) {
        return String(matchingSubject.grade);
    }

    const tm = Number(c.total_marks);
    if (!isNaN(tm) && tm > 0) {
        if (tm >= 90) return 'S';
        if (tm >= 80) return 'A';
        if (tm >= 70) return 'B';
        if (tm >= 60) return 'C';
        if (tm >= 50) return 'D';
        if (tm >= 40) return 'E';
        return 'F';
    }

    return '-';
}

/**
 * Resolves the exam month (e.g. 'Nov-2024', 'Apr-2025') based on semester information or academic term
 */
function getExamMonth(c: CourseMarkEntry, semesters: Semester[]): string {
    const sem = semesters.find(s => s.id === c.semester_id);
    if (sem) {
        const year = sem.year || new Date().getFullYear();
        if (sem.term === 'Fall') {
            return `Nov-${year}`;
        }
        if (sem.term === 'Winter') {
            return `Apr-${year + 1}`;
        }
        if (sem.term === 'Spring') {
            return `May-${year}`;
        }
        if (sem.term === 'Summer') {
            return `Jul-${year}`;
        }
    }

    const semName = (c.semester_name || '').toLowerCase();
    const currentYear = new Date().getFullYear();
    if (semName.includes('fall')) {
        const matchYear = semName.match(/\d{4}/);
        return `Nov-${matchYear ? matchYear[0] : currentYear - 1}`;
    }
    if (semName.includes('winter') || semName.includes('spring')) {
        const matchYear = semName.match(/\d{4}/);
        return `Apr-${matchYear ? matchYear[0] : currentYear}`;
    }

    // Default based on creation/update timestamp if available
    if (c.created_at || c.updated_at) {
        try {
            const d = new Date(c.created_at || c.updated_at!);
            const yr = d.getFullYear();
            const mo = d.getMonth();
            return mo >= 6 ? `Nov-${yr}` : `Apr-${yr}`;
        } catch {
            // fallback
        }
    }

    return `Nov-${currentYear - 1}`;
}

/**
 * Resolves Result Declared date based on Exam Month (standard university timeline)
 * e.g. Nov-2024 -> 02-Jan-2025, Apr-2025 -> 30-May-2025
 */
function getResultDeclaredDate(examMonth: string): string {
    const parts = examMonth.split('-');
    const month = parts[0] || '';
    const year = parseInt(parts[1] || '2025', 10);

    if (month.toLowerCase().startsWith('nov') || month.toLowerCase().startsWith('dec')) {
        return `02-Jan-${year + 1}`;
    }
    if (month.toLowerCase().startsWith('apr')) {
        return `30-May-${year}`;
    }
    if (month.toLowerCase().startsWith('may')) {
        return `15-Jun-${year}`;
    }
    if (month.toLowerCase().startsWith('jul')) {
        return `10-Aug-${year}`;
    }

    return `02-Jan-${year + 1}`;
}

/**
 * Resolves Course Distribution code (e.g. 'VAC', 'DC', 'AE', 'SE', 'OE')
 * matching university curriculum baskets and the reference Grade History marksheet.
 */
function getCourseDistribution(c: CourseMarkEntry, semesters: Semester[]): string {
    // 1. Check matching subject basket if enrolled in curriculum
    const matchingSubject = semesters
        .flatMap(s => s.subjects || [])
        .find(s => s.subject_code?.trim().toUpperCase() === c.course_code?.trim().toUpperCase());
    
    if (matchingSubject?.basket) {
        const basketMap: Record<string, string> = {
            discipline_core: 'DC',
            discipline_elective: 'DE',
            project_internship: 'DC',
            open_elective: 'OE',
            ability_enhancement: 'AE',
            language: 'AE',
            skill_enhancement: 'SE',
            value_added: 'VAC',
            cocurricular: 'VAC',
        };
        if (basketMap[matchingSubject.basket]) {
            return basketMap[matchingSubject.basket];
        }
    }

    // 2. Intelligent inference from course code and name
    const code = (c.course_code || '').trim().toUpperCase();
    const name = (c.course_name || '').trim().toUpperCase();

    if (code.startsWith('STS') || isSoftSkillsCourse(c.course_code, c.course_name)) {
        return 'SE'; // Skill Enhancement
    }
    if (
        code.startsWith('UCHY') || 
        code.startsWith('CHY') || 
        name.includes('ENVIRONMENT') || 
        name.includes('ETHICS') || 
        name.includes('VALUE')
    ) {
        return 'VAC'; // Value Added Course
    }
    if (
        code.startsWith('UENG') || 
        code.startsWith('ENG') || 
        code.startsWith('FRE') || 
        code.startsWith('GER') || 
        name.includes('COMMUNICATION') || 
        name.includes('LANGUAGE')
    ) {
        return 'AE'; // Ability Enhancement
    }
    if (code.endsWith('E') || name.includes('ELECTIVE')) {
        return 'DE'; // Discipline Elective
    }

    // Default for computer science / engineering courses (e.g. UCSC, UMAT, etc.)
    return 'DC'; // Discipline Core
}

/**
 * Generates an official university-style academic Marks & Assessments PDF report.
 * Uses Times serif typography, solid crisp black grid borders, spanning title rows,
 * and pure black-and-white presentation matching university grade history marksheets.
 */
export function generateCustomMarksPDF(
    courses: CourseMarkEntry[],
    options: CustomMarksPDFOptions = {},
    semesters: Semester[] = []
) {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2; // Exactly 182mm

    // Filter courses based on options
    let targetCourses = [...courses];
    if (options.semesterFilter && options.semesterFilter !== 'all') {
        if (options.semesterFilter === 'none') {
            targetCourses = targetCourses.filter(c => !c.semester_id);
        } else {
            targetCourses = targetCourses.filter(c => c.semester_id === options.semesterFilter);
        }
    }
    if (options.courseTypeFilter && options.courseTypeFilter !== 'all') {
        targetCourses = targetCourses.filter(c => c.type === options.courseTypeFilter);
    }

    const theoryCourses = targetCourses.filter(c => c.type === 'theory');
    const labCourses = targetCourses.filter(c => c.type === 'lab');

    // KPI Calculations
    const totalCount = targetCourses.length;
    const totalCredits = targetCourses.reduce((sum, c) => sum + (Number(c.credit) || 0), 0);
    const totalMarksSum = targetCourses.reduce((sum, c) => sum + (Number(c.total_marks) || 0), 0);
    const avgMarks = totalCount > 0 ? totalMarksSum / totalCount : 0;

    let highestCourse = targetCourses[0];
    let lowestCourse = targetCourses[0];
    let highScorersCount = 0; // >= 80 marks
    let passingCount = 0; // >= 50 marks

    targetCourses.forEach(c => {
        const tm = Number(c.total_marks) || 0;
        if (!highestCourse || tm > (Number(highestCourse.total_marks) || 0)) {
            highestCourse = c;
        }
        if (!lowestCourse || tm < (Number(lowestCourse.total_marks) || 0)) {
            lowestCourse = c;
        }
        if (tm >= 80) highScorersCount++;
        if (tm >= 50) passingCount++;
    });

    const passRate = totalCount > 0 ? (passingCount / totalCount) * 100 : 0;

    // GPA Calculation from official grades
    let gradedPoints = 0;
    let gradedCredits = 0;
    targetCourses.forEach(c => {
        if (c.grade && c.grade !== 'P' && c.grade !== 'A_ABSENT') {
            const pts = GRADE_POINTS[c.grade as keyof typeof GRADE_POINTS];
            if (pts !== undefined) {
                const cr = Number(c.credit) || 1;
                gradedPoints += pts * cr;
                gradedCredits += cr;
            }
        }
    });
    const calculatedGpa = gradedCredits > 0 ? (gradedPoints / gradedCredits).toFixed(2) : null;

    // Resolve semester label
    let semesterLabel = options.semesterName || 'All Semesters';
    if (!options.semesterName && options.semesterFilter && options.semesterFilter !== 'all') {
        const foundSem = semesters.find(s => s.id === options.semesterFilter);
        if (foundSem) {
            semesterLabel = `${foundSem.term} ${foundSem.year}`;
        }
    }

    // ==========================================
    // 1. TOP DOCUMENT HEADER (TIMES SERIF, BLACK & WHITE)
    // ==========================================
    doc.setTextColor(0, 0, 0);
    doc.setFont('times', 'bold');
    doc.setFontSize(14);
    const titleText = options.reportTitle || 'Grade History';
    doc.text(titleText, margin, 15);

    // Subtitle
    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.text('SELF STUDY HUB  •  CONTINUOUS ASSESSMENT & ACADEMIC RECORD', margin, 20);

    // Top Divider Line
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.35);
    doc.line(margin, 23, pageWidth - margin, 23);

    // ==========================================
    // 2. METADATA INFORMATION BOX (BORDERED GRID)
    // ==========================================
    let yPos = 26;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.rect(margin, yPos, contentWidth, 16, 'S');

    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);

    // Row 1
    doc.setFont('times', 'bold');
    doc.text('Student Name:', margin + 3, yPos + 5.5);
    doc.setFont('times', 'normal');
    doc.text(options.studentName || 'Student', margin + 23, yPos + 5.5);

    const col2X = margin + (contentWidth / 3);
    doc.setFont('times', 'bold');
    doc.text('Register No:', col2X, yPos + 5.5);
    doc.setFont('times', 'normal');
    doc.text(options.studentId || 'N/A', col2X + 18, yPos + 5.5);

    const col3X = margin + (contentWidth * 2 / 3);
    doc.setFont('times', 'bold');
    doc.text('Semester:', col3X, yPos + 5.5);
    doc.setFont('times', 'normal');
    doc.text(semesterLabel, col3X + 16, yPos + 5.5);

    // Row 2
    doc.setFont('times', 'bold');
    doc.text('Program:', margin + 3, yPos + 11.5);
    doc.setFont('times', 'normal');
    const progText = options.degreeName || 'Undergraduate Curriculum';
    doc.text(progText.length > 28 ? progText.slice(0, 28) + '...' : progText, margin + 23, yPos + 11.5);

    doc.setFont('times', 'bold');
    doc.text('Courses / Credits:', col2X, yPos + 11.5);
    doc.setFont('times', 'normal');
    doc.text(`${totalCount} Courses (${totalCredits.toFixed(1)} Credits)`, col2X + 25, yPos + 11.5);

    if (options.includeDate !== false) {
        doc.setFont('times', 'bold');
        doc.text('Export Date:', col3X, yPos + 11.5);
        doc.setFont('times', 'normal');
        doc.text(new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }), col3X + 18, yPos + 11.5);
    }

    yPos += 21;

    // ==========================================
    // 3. GRADE HISTORY TABLE (EXACT MATCH TO REFERENCE IMAGE)
    // ==========================================
    if (options.includeGradeHistoryTable !== false && targetCourses.length > 0) {
        const gradeHistoryRows = targetCourses.map((c, idx) => {
            const cr = Number(c.credit) || 0;
            const examMonth = getExamMonth(c, semesters);
            const resultDate = getResultDeclaredDate(examMonth);
            const grade = getCourseGrade(c, semesters);
            const courseType = getCourseTypeCode(c);
            const distribution = getCourseDistribution(c, semesters);

            return [
                (idx + 1).toString(),
                c.course_code || '-',
                c.course_name ? (c.course_name.length > 40 ? c.course_name.slice(0, 40) + '...' : c.course_name) : '-',
                courseType,
                cr.toFixed(1),
                grade,
                examMonth,
                resultDate,
                'NIL',
                distribution,
            ];
        });

        autoTable(doc, {
            startY: yPos,
            tableWidth: contentWidth,
            margin: { left: margin, right: margin },
            head: [
                [
                    {
                        content: 'Grade History',
                        colSpan: 10,
                        styles: {
                            halign: 'center',
                            font: 'times',
                            fontStyle: 'bold',
                            fontSize: 9.5,
                            textColor: [0, 0, 0],
                            fillColor: false,
                            lineWidth: 0.35,
                            lineColor: [0, 0, 0],
                            cellPadding: 2.2,
                        }
                    }
                ],
                [
                    'Sl.No',
                    'Course Code',
                    'Course Title',
                    'Course\nType',
                    'Credits',
                    'Grade',
                    'Exam Month',
                    'Result Declared\nOn',
                    'Course\nOption',
                    'Course\nDistrib\nution'
                ]
            ],
            body: gradeHistoryRows,
            theme: 'grid',
            headStyles: {
                font: 'times',
                fillColor: false,
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                fontSize: 7.5,
                halign: 'center',
                cellPadding: 1.8,
                lineWidth: 0.3,
                lineColor: [0, 0, 0],
            },
            alternateRowStyles: {
                fillColor: false,
            },
            styles: {
                font: 'times',
                fillColor: false,
                fontSize: 7.5,
                cellPadding: 1.8,
                textColor: [0, 0, 0],
                lineWidth: 0.25,
                lineColor: [0, 0, 0],
                overflow: 'linebreak',
            },
            columnStyles: {
                0: { halign: 'center', cellWidth: 9 },
                1: { halign: 'center', cellWidth: 19 },
                2: { halign: 'left', cellWidth: 50 },
                3: { halign: 'center', cellWidth: 13 },
                4: { halign: 'center', cellWidth: 12 },
                5: { halign: 'center', cellWidth: 12 },
                6: { halign: 'center', cellWidth: 18 },
                7: { halign: 'center', cellWidth: 23 },
                8: { halign: 'center', cellWidth: 13 },
                9: { halign: 'center', cellWidth: 13 },
            },
        });

        yPos = (doc as any).lastAutoTable.finalY + 7;
    }

    // ==========================================
    // 4. SECTION: EXECUTIVE KPI SUMMARY (OPTIONAL)
    // ==========================================
    if (options.includeSummaryKPIs) {
        if (yPos > pageHeight - 45) {
            doc.addPage();
            yPos = 18;
        }

        const kpiHeaders = [
            'Total Courses',
            'Earned Credits',
            'Mean Score (100)',
            'Top Score',
            'High Achievers (≥80%)',
            calculatedGpa ? 'Coursework GPA' : 'Passing Rate'
        ];

        const kpiValues = [
            `${totalCount} Courses`,
            `${totalCredits.toFixed(1)} Credits`,
            `${avgMarks.toFixed(1)} / 100`,
            highestCourse ? `${Number(highestCourse.total_marks).toFixed(1)} (${highestCourse.course_code})` : 'N/A',
            `${highScorersCount} (${totalCount > 0 ? ((highScorersCount / totalCount) * 100).toFixed(0) : 0}%)`,
            calculatedGpa ? `${calculatedGpa} / 10.00` : `${passRate.toFixed(1)}%`
        ];

        autoTable(doc, {
            startY: yPos,
            tableWidth: contentWidth,
            margin: { left: margin, right: margin },
            head: [
                [
                    {
                        content: 'Executive Performance Summary',
                        colSpan: 6,
                        styles: {
                            halign: 'center',
                            font: 'times',
                            fontStyle: 'bold',
                            fontSize: 9,
                            textColor: [0, 0, 0],
                            fillColor: false,
                            lineWidth: 0.3,
                            lineColor: [0, 0, 0],
                            cellPadding: 2,
                        }
                    }
                ],
                kpiHeaders
            ],
            body: [kpiValues],
            theme: 'grid',
            headStyles: {
                font: 'times',
                fillColor: false,
                textColor: [0, 0, 0],
                fontSize: 7.5,
                fontStyle: 'bold',
                halign: 'center',
                lineWidth: 0.3,
                lineColor: [0, 0, 0],
                cellPadding: 2,
            },
            styles: {
                font: 'times',
                fillColor: false,
                fontSize: 7.5,
                cellPadding: 2.2,
                halign: 'center',
                textColor: [0, 0, 0],
                lineWidth: 0.25,
                lineColor: [0, 0, 0],
            },
            alternateRowStyles: {
                fillColor: false,
            },
        });

        yPos = (doc as any).lastAutoTable.finalY + 7;
    }

    // ==========================================
    // 4. SECTION 2: SCORE DISTRIBUTION
    // ==========================================
    if (options.includeScoreDistribution !== false && totalCount > 0) {
        if (yPos > pageHeight - 45) {
            doc.addPage();
            yPos = 18;
        }

        const brackets = [
            { label: 'Outstanding (Grade S Equiv)', range: '90 - 100 Marks', min: 90, max: 100 },
            { label: 'Excellent (Grade A Equiv)', range: '80 - 89 Marks', min: 80, max: 89.99 },
            { label: 'Very Good (Grade B Equiv)', range: '70 - 79 Marks', min: 70, max: 79.99 },
            { label: 'Good (Grade C Equiv)', range: '60 - 69 Marks', min: 60, max: 69.99 },
            { label: 'Satisfactory (Grade D/E Equiv)', range: '50 - 59 Marks', min: 50, max: 59.99 },
            { label: 'Needs Improvement / Below 50', range: '< 50 Marks', min: 0, max: 49.99 },
        ];

        const distributionRows = brackets.map(b => {
            const matched = targetCourses.filter(c => {
                const tm = Number(c.total_marks) || 0;
                return tm >= b.min && tm <= b.max;
            });
            const credits = matched.reduce((s, c) => s + (Number(c.credit) || 0), 0);
            const count = matched.length;
            const pct = totalCount > 0 ? ((count / totalCount) * 100).toFixed(1) + '%' : '0%';

            return [b.label, b.range, count.toString(), `${credits.toFixed(1)} Credits`, pct];
        });

        autoTable(doc, {
            startY: yPos,
            tableWidth: contentWidth,
            margin: { left: margin, right: margin },
            head: [
                [
                    {
                        content: 'Score Distribution & Performance Brackets',
                        colSpan: 5,
                        styles: {
                            halign: 'center',
                            font: 'times',
                            fontStyle: 'bold',
                            fontSize: 9,
                            textColor: [0, 0, 0],
                            fillColor: false,
                            lineWidth: 0.3,
                            lineColor: [0, 0, 0],
                            cellPadding: 2,
                        }
                    }
                ],
                ['Performance Category', 'Score Range', 'Courses', 'Earned Credits', 'Share']
            ],
            body: distributionRows,
            theme: 'grid',
            headStyles: {
                font: 'times',
                fillColor: false,
                textColor: [0, 0, 0],
                fontSize: 7.5,
                fontStyle: 'bold',
                lineWidth: 0.3,
                lineColor: [0, 0, 0],
                cellPadding: 2,
            },
            alternateRowStyles: {
                fillColor: false,
            },
            styles: {
                font: 'times',
                fillColor: false,
                fontSize: 7.2,
                cellPadding: 1.8,
                textColor: [0, 0, 0],
                lineWidth: 0.25,
                lineColor: [0, 0, 0],
            },
            columnStyles: {
                0: { fontStyle: 'bold' },
                2: { halign: 'center' },
                3: { halign: 'center' },
                4: { halign: 'center', fontStyle: 'bold' },
            },
        });

        yPos = (doc as any).lastAutoTable.finalY + 7;
    }

    // ==========================================
    // 5. SECTION 3: THEORY COURSES ASSESSMENT TABLE (EXACT GRADE HISTORY STYLE)
    // ==========================================
    if (options.includeTheoryTable !== false && theoryCourses.length > 0) {
        if (yPos > pageHeight - 50) {
            doc.addPage();
            yPos = 18;
        }

        let sumCat1 = 0;
        let sumCat2 = 0;
        let sumInternal = 0;
        let sumFat = 0;
        let sumTotal = 0;
        let sumCredits = 0;

        const theoryRows = theoryCourses.map((c, idx) => {
            const tm = c.theory_marks;
            const cat1 = tm?.cat1_weight ?? null;
            const cat2 = tm?.cat2_weight ?? null;
            const internal = tm?.internal_total ?? null;
            const fat = tm?.fat_weight ?? null;
            const total = Number(c.total_marks) || 0;
            const cr = Number(c.credit) || 0;

            sumCredits += cr;
            if (cat1 !== null) sumCat1 += Number(cat1);
            if (cat2 !== null) sumCat2 += Number(cat2);
            if (internal !== null) sumInternal += Number(internal);
            if (fat !== null) sumFat += Number(fat);
            sumTotal += total;

            return [
                (idx + 1).toString(),
                c.course_code || '-',
                c.course_name ? (c.course_name.length > 38 ? c.course_name.slice(0, 38) + '...' : c.course_name) : '-',
                getCourseTypeCode(c),
                cr.toFixed(1),
                formatMarks(cat1),
                formatMarks(cat2),
                formatMarks(internal),
                formatMarks(fat),
                formatMarks(total),
                c.grade || '-',
            ];
        });

        // Summary row
        const avgCat1 = theoryCourses.length > 0 ? (sumCat1 / theoryCourses.length).toFixed(1) : '-';
        const avgCat2 = theoryCourses.length > 0 ? (sumCat2 / theoryCourses.length).toFixed(1) : '-';
        const avgInternal = theoryCourses.length > 0 ? (sumInternal / theoryCourses.length).toFixed(1) : '-';
        const avgFat = theoryCourses.length > 0 ? (sumFat / theoryCourses.length).toFixed(1) : '-';
        const avgTot = theoryCourses.length > 0 ? (sumTotal / theoryCourses.length).toFixed(1) : '-';

        const theoryFooter = [
            '',
            'Total / Avg',
            `Summary across ${theoryCourses.length} Courses`,
            '-',
            sumCredits.toFixed(1),
            avgCat1,
            avgCat2,
            avgInternal,
            avgFat,
            avgTot,
            '-',
        ];

        autoTable(doc, {
            startY: yPos,
            tableWidth: contentWidth,
            margin: { left: margin, right: margin },
            head: [
                [
                    {
                        content: 'Grade History',
                        colSpan: 11,
                        styles: {
                            halign: 'center',
                            font: 'times',
                            fontStyle: 'bold',
                            fontSize: 9,
                            textColor: [0, 0, 0],
                            fillColor: false,
                            lineWidth: 0.3,
                            lineColor: [0, 0, 0],
                            cellPadding: 2.2,
                        }
                    }
                ],
                ['Sl.No', 'Course Code', 'Course Title', 'Course\nType', 'Credits', 'CAT 1\n(15)', 'CAT 2\n(15)', 'Internal\n(30)', 'FAT\n(40)', 'Total\n(100)', 'Grade']
            ],
            body: theoryRows,
            foot: [theoryFooter],
            theme: 'grid',
            headStyles: {
                font: 'times',
                fillColor: false,
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                fontSize: 7.2,
                halign: 'center',
                cellPadding: 1.8,
                lineWidth: 0.3,
                lineColor: [0, 0, 0],
            },
            footStyles: {
                font: 'times',
                fillColor: false,
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                fontSize: 7.2,
                halign: 'center',
                lineWidth: 0.3,
                lineColor: [0, 0, 0],
            },
            alternateRowStyles: {
                fillColor: false,
            },
            styles: {
                font: 'times',
                fillColor: false,
                fontSize: 7.2,
                cellPadding: 1.8,
                textColor: [0, 0, 0],
                lineWidth: 0.25,
                lineColor: [0, 0, 0], // Solid black borders matching the image!
                overflow: 'linebreak',
            },
            columnStyles: {
                0: { halign: 'center', cellWidth: 9 },
                1: { halign: 'center', cellWidth: 20 },
                2: { halign: 'left', cellWidth: 'auto' }, // Responsive width taking remaining ~45mm
                3: { halign: 'center', cellWidth: 13 },
                4: { halign: 'center', cellWidth: 11 },
                5: { halign: 'center', cellWidth: 14 },
                6: { halign: 'center', cellWidth: 14 },
                7: { halign: 'center', cellWidth: 15 },
                8: { halign: 'center', cellWidth: 14 },
                9: { halign: 'center', cellWidth: 16 },
                10: { halign: 'center', cellWidth: 11 },
            },
        });

        yPos = (doc as any).lastAutoTable.finalY + 7;
    }

    // ==========================================
    // 6. SECTION 4: LAB COURSES ASSESSMENT TABLE (EXACT GRADE HISTORY STYLE)
    // ==========================================
    if (options.includeLabTable !== false && labCourses.length > 0) {
        if (yPos > pageHeight - 50) {
            doc.addPage();
            yPos = 18;
        }

        let sumDa = 0;
        let sumLabFat = 0;
        let sumLabTotal = 0;
        let sumLabCredits = 0;

        const labRows = labCourses.map((c, idx) => {
            const lm = c.lab_marks;
            const pattern = lm?.pattern || 'da6_fat';
            const daSum = lm?.da_marks ? lm.da_marks.reduce<number>((s, v) => s + (Number(v) || 0), 0) : 0;
            const fat = lm?.fat_weight ?? null;
            const total = Number(c.total_marks) || 0;
            const cr = Number(c.credit) || 0;

            sumLabCredits += cr;
            sumDa += daSum;
            if (fat !== null) sumLabFat += Number(fat);
            sumLabTotal += total;

            const patternLabel = pattern === 'da10_nofat' ? '10 DAs (100)' : pattern === 'cat_fat' ? 'CAT+DAs+FAT' : '6 DAs + FAT';

            return [
                (idx + 1).toString(),
                c.course_code || '-',
                c.course_name ? (c.course_name.length > 40 ? c.course_name.slice(0, 40) + '...' : c.course_name) : '-',
                getCourseTypeCode(c),
                cr.toFixed(1),
                patternLabel,
                formatMarks(daSum),
                formatMarks(fat),
                formatMarks(total),
                c.grade || '-',
            ];
        });

        const avgDa = labCourses.length > 0 ? (sumDa / labCourses.length).toFixed(1) : '-';
        const avgLabFat = labCourses.length > 0 ? (sumLabFat / labCourses.length).toFixed(1) : '-';
        const avgLabTot = labCourses.length > 0 ? (sumLabTotal / labCourses.length).toFixed(1) : '-';

        const labFooter = [
            '',
            'Total / Avg',
            `Summary across ${labCourses.length} Lab Courses`,
            '-',
            sumLabCredits.toFixed(1),
            '-',
            avgDa,
            avgLabFat,
            avgLabTot,
            '-',
        ];

        autoTable(doc, {
            startY: yPos,
            tableWidth: contentWidth,
            margin: { left: margin, right: margin },
            head: [
                [
                    {
                        content: 'Grade History - Laboratory Continuous Assessments',
                        colSpan: 10,
                        styles: {
                            halign: 'center',
                            font: 'times',
                            fontStyle: 'bold',
                            fontSize: 9,
                            textColor: [0, 0, 0],
                            fillColor: false,
                            lineWidth: 0.3,
                            lineColor: [0, 0, 0],
                            cellPadding: 2.2,
                        }
                    }
                ],
                ['Sl.No', 'Course Code', 'Course Title', 'Course\nType', 'Credits', 'Evaluation\nPattern', 'DAs /\nCont', 'FAT\n(40)', 'Total\n(100)', 'Grade']
            ],
            body: labRows,
            foot: [labFooter],
            theme: 'grid',
            headStyles: {
                font: 'times',
                fillColor: false,
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                fontSize: 7.2,
                halign: 'center',
                cellPadding: 1.8,
                lineWidth: 0.3,
                lineColor: [0, 0, 0],
            },
            footStyles: {
                font: 'times',
                fillColor: false,
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                fontSize: 7.2,
                halign: 'center',
                lineWidth: 0.3,
                lineColor: [0, 0, 0],
            },
            alternateRowStyles: {
                fillColor: false,
            },
            styles: {
                font: 'times',
                fillColor: false,
                fontSize: 7.2,
                cellPadding: 1.8,
                textColor: [0, 0, 0],
                lineWidth: 0.25,
                lineColor: [0, 0, 0], // Solid black borders matching the image!
                overflow: 'linebreak',
            },
            columnStyles: {
                0: { halign: 'center', cellWidth: 9 },
                1: { halign: 'center', cellWidth: 20 },
                2: { halign: 'left', cellWidth: 'auto' }, // Responsive width taking remaining ~48mm
                3: { halign: 'center', cellWidth: 13 },
                4: { halign: 'center', cellWidth: 11 },
                5: { halign: 'center', cellWidth: 25 },
                6: { halign: 'center', cellWidth: 16 },
                7: { halign: 'center', cellWidth: 14 },
                8: { halign: 'center', cellWidth: 16 },
                9: { halign: 'center', cellWidth: 11 },
            },
        });

        yPos = (doc as any).lastAutoTable.finalY + 7;
    }

    // ==========================================
    // 7. SECTION 5: DETAILED COMPONENT BREAKDOWN (TIMES SERIF, BLACK & WHITE)
    // ==========================================
    if (options.includeDetailedBreakdown !== false) {
        const coursesWithDetails = targetCourses.filter(c => {
            if (c.type === 'theory') {
                const tm = c.theory_marks;
                return (tm?.internal_components && tm.internal_components.length > 0) ||
                       tm?.cat1_raw !== undefined ||
                       tm?.cat2_raw !== undefined ||
                       tm?.fat_raw !== undefined;
            } else {
                const lm = c.lab_marks;
                return lm?.da_marks && lm.da_marks.some(d => d !== null && d !== undefined);
            }
        });

        if (coursesWithDetails.length > 0) {
            if (yPos > pageHeight - 50) {
                doc.addPage();
                yPos = 18;
            }

            const detailRows: any[] = [];
            coursesWithDetails.forEach(c => {
                if (c.type === 'theory') {
                    const tm = c.theory_marks;
                    const cat1RawStr = tm?.cat1_raw !== null && tm?.cat1_raw !== undefined ? `${tm.cat1_raw}/${tm?.cat_max_raw || 50} (${tm?.cat1_weight ?? '-'} w)` : '-';
                    const cat2RawStr = tm?.cat2_raw !== null && tm?.cat2_raw !== undefined ? `${tm.cat2_raw}/${tm?.cat_max_raw || 50} (${tm?.cat2_weight ?? '-'} w)` : '-';
                    const fatRawStr = tm?.fat_raw !== null && tm?.fat_raw !== undefined ? `${tm.fat_raw}/${tm?.fat_max_raw || 100} (${tm?.fat_weight ?? '-'} w)` : '-';

                    let compBreakdown = '';
                    if (tm?.internal_components && tm.internal_components.length > 0) {
                        compBreakdown = tm.internal_components
                            .map(comp => `${comp.name}: ${comp.marks ?? '-'}/${comp.max_marks}`)
                            .join(', ');
                    } else if (tm?.internal_parts) {
                        const parts = tm.internal_parts;
                        compBreakdown = [
                            parts.part1 !== undefined ? `P1: ${parts.part1}` : '',
                            parts.part2 !== undefined ? `P2: ${parts.part2}` : '',
                            parts.part3 !== undefined ? `P3: ${parts.part3}` : '',
                        ].filter(Boolean).join(', ');
                    }

                    detailRows.push([
                        c.course_code,
                        getCourseTypeCode(c),
                        cat1RawStr,
                        cat2RawStr,
                        compBreakdown || (tm?.internal_total ? `Total: ${tm.internal_total}/30` : '-'),
                        fatRawStr,
                        `${c.total_marks}/100`,
                    ]);
                } else {
                    const lm = c.lab_marks;
                    const daList = (lm?.da_marks || [])
                        .map((d, i) => (d !== null && d !== undefined ? `DA${i + 1}: ${d}` : ''))
                        .filter(Boolean)
                        .join(', ');

                    const fatStr = lm?.fat_raw !== null && lm?.fat_raw !== undefined
                        ? `${lm.fat_raw}/50 (${lm?.fat_weight ?? '-'} w)`
                        : (lm?.fat_weight ? `${lm.fat_weight}/40` : '-');

                    detailRows.push([
                        c.course_code,
                        getCourseTypeCode(c),
                        '-',
                        '-',
                        daList || 'No DA entries recorded',
                        fatStr,
                        `${c.total_marks}/100`,
                    ]);
                }
            });

            autoTable(doc, {
                startY: yPos,
                tableWidth: contentWidth,
                margin: { left: margin, right: margin },
                head: [
                    [
                        {
                            content: 'Component Assessment Breakdown',
                            colSpan: 7,
                            styles: {
                                halign: 'center',
                                font: 'times',
                                fontStyle: 'bold',
                                fontSize: 9,
                                textColor: [0, 0, 0],
                                fillColor: false,
                                lineWidth: 0.3,
                                lineColor: [0, 0, 0],
                                cellPadding: 2.2,
                            }
                        }
                    ],
                    ['Course Code', 'Type', 'CAT 1 Raw', 'CAT 2 Raw', 'Internal Components / DAs', 'FAT Raw', 'Final Total']
                ],
                body: detailRows,
                theme: 'grid',
                headStyles: {
                    font: 'times',
                    fillColor: false,
                    textColor: [0, 0, 0],
                    fontStyle: 'bold',
                    fontSize: 7.2,
                    cellPadding: 1.8,
                    halign: 'center',
                    lineWidth: 0.3,
                    lineColor: [0, 0, 0],
                },
                styles: {
                    font: 'times',
                    fillColor: false,
                    fontSize: 7,
                    cellPadding: 1.6,
                    lineWidth: 0.25,
                    lineColor: [0, 0, 0],
                    overflow: 'linebreak',
                },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 20 },
                    1: { halign: 'center', cellWidth: 12 },
                    2: { halign: 'center', cellWidth: 18 },
                    3: { halign: 'center', cellWidth: 18 },
                    4: { cellWidth: 'auto' },
                    5: { halign: 'center', cellWidth: 18 },
                    6: { halign: 'center', cellWidth: 16 },
                },
            });

            yPos = (doc as any).lastAutoTable.finalY + 7;
        }
    }

    // ==========================================
    // 8. SECTION 6: REMARKS
    // ==========================================
    if (options.customRemarks) {
        if (yPos > pageHeight - 35) {
            doc.addPage();
            yPos = 18;
        }
        doc.setFont('times', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(0, 0, 0);
        doc.text('Notes & Academic Remarks:', margin, yPos);
        yPos += 4;

        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.25);
        doc.rect(margin, yPos, contentWidth, 12, 'S');

        doc.setFont('times', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        doc.text(options.customRemarks, margin + 3, yPos + 7);
        yPos += 18;
    }

    // ==========================================
    // 9. FOOTERS & PAGE NUMBERS ACROSS ALL PAGES
    // ==========================================
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);

        // Footer divider line
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.25);
        doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

        doc.setFont('times', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(80, 80, 80);
        doc.text(
            `Self Study Hub  •  Course Marks & Assessment Report  •  Grade History Record`,
            margin,
            pageHeight - 6
        );

        doc.setFont('times', 'bold');
        doc.text(
            `Page ${i} of ${totalPages}`,
            pageWidth - margin,
            pageHeight - 6,
            { align: 'right' }
        );
    }

    // Save PDF
    const filenameDate = new Date().toISOString().slice(0, 10);
    const sanitizedTitle = (options.reportTitle || 'Course_Marks_Report').replace(/[^a-zA-Z0-9_-]/g, '_');
    doc.save(`${sanitizedTitle}_${filenameDate}.pdf`);
}
