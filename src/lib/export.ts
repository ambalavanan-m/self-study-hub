import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { formatTimeTo12Hr } from './time';
import { 
    type Semester, 
    type Subject, 
    type Grade,
    BASKET_DEFINITIONS,
    calculateCGPA,
    calculateGPA,
    sortSubjectsAlphabeticallyWithLab
} from './cgpa';

// --- Helper Types ---
interface ExportOptions {
    format: 'json' | 'pdf';
    userId: string;
}

// --- Custom PDF Options ---
export interface CustomPDFOptions {
    reportTitle?: string;
    studentName?: string;
    studentId?: string;
    degreeName?: string;
    includeDate?: boolean;
    themeColor?: 'emerald' | 'cyan' | 'indigo' | 'slate';
    includeSummaryKPIs?: boolean;
    includeCGPAHistory?: boolean;
    includeGradeDistribution?: boolean;
    includeCurriculumBaskets?: boolean;
    includeCurriculumCourseList?: boolean;
}

const THEME_COLORS: Record<string, [number, number, number]> = {
    emerald: [27, 128, 87],
    cyan: [0, 168, 204],
    indigo: [79, 70, 229],
    slate: [51, 65, 85],
};

const GRADE_POINTS_MAP: Record<string, number> = {
    'S': 10, 'A': 9, 'B': 8, 'C': 7, 'D': 6, 'E': 5, 'F': 0, 'N': 0
};

// --- Custom Master PDF Generator ---
export function generateCustomAcademicPDF(semesters: Semester[], options: CustomPDFOptions = {}) {
    const doc = new jsPDF();
    const primaryColor = THEME_COLORS[options.themeColor || 'emerald'] || THEME_COLORS.emerald;
    const allSubjects = semesters.flatMap(s => s.subjects || []);
    const cgpa = calculateCGPA(semesters);

    let totalEarnedCredits = 0;
    allSubjects.forEach(s => {
        if (s.grade !== 'A_ABSENT') {
            totalEarnedCredits += (Number(s.credit) || 0);
        }
    });

    // Header Banner
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(17);
    doc.setFont('helvetica', 'bold');
    doc.text(options.reportTitle || 'Academic Progress & Degree Report', 14, 18);

    // Student & Report Meta
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');

    let yPos = 35;
    doc.text(`Student: ${options.studentName || 'Student'}`, 14, yPos);
    if (options.studentId) doc.text(`Reg/Student ID: ${options.studentId}`, 110, yPos);
    yPos += 5;

    if (options.degreeName) {
        doc.text(`Program: ${options.degreeName}`, 14, yPos);
        yPos += 5;
    }

    doc.text(`Cumulative CGPA: ${cgpa.toFixed(2)}`, 14, yPos);
    doc.text(`Total Earned Credits: ${totalEarnedCredits}`, 110, yPos);
    yPos += 5;

    if (options.includeDate !== false) {
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, yPos);
        yPos += 5;
    }

    yPos += 4;

    // SECTION 1: Summary KPIs
    if (options.includeSummaryKPIs !== false) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        doc.text('1. Executive Academic Summary', 14, yPos);
        yPos += 4;

        autoTable(doc, {
            startY: yPos,
            head: [['Current CGPA', 'Total Earned Credits', 'Evaluated Subjects', 'Curriculum Target']],
            body: [[
                `${cgpa.toFixed(2)} / 10.00`,
                `${totalEarnedCredits} Credits`,
                `${allSubjects.length} Courses`,
                `${totalEarnedCredits} / 120 Credits (${((totalEarnedCredits / 120) * 100).toFixed(1)}%)`,
            ]],
            theme: 'grid',
            headStyles: { fillColor: primaryColor, fontSize: 8.5 },
            styles: { fontSize: 8.5, cellPadding: 2.5, halign: 'center' },
            margin: { left: 14, right: 14 },
        });

        yPos = (doc as any).lastAutoTable.finalY + 9;
    }

    // SECTION 2: Grade Distribution
    if (options.includeGradeDistribution !== false) {
        if (yPos > 240) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        doc.text('2. Grade Distribution & Performance Breakdown', 14, yPos);
        yPos += 4;

        const gradeOrder: Grade[] = ['S', 'A', 'B', 'C', 'D', 'E', 'F', 'N', 'P', 'A_ABSENT'];
        const gradeCounts: Record<string, number> = {};
        const gradeCreditsMap: Record<string, number> = {};

        gradeOrder.forEach(g => {
            gradeCounts[g] = 0;
            gradeCreditsMap[g] = 0;
        });

        allSubjects.forEach(s => {
            if (s.grade && gradeCounts[s.grade] !== undefined) {
                gradeCounts[s.grade]++;
                gradeCreditsMap[s.grade] += (Number(s.credit) || 0);
            }
        });

        const totalCount = allSubjects.length || 1;
        const gradeRows = gradeOrder.filter(g => gradeCounts[g] > 0 || ['S', 'A', 'B', 'C', 'D', 'E', 'F', 'N'].includes(g)).map(g => [
            g,
            g === 'A_ABSENT' ? 'Absent' : `${g} Grade`,
            GRADE_POINTS_MAP[g] !== undefined ? `${GRADE_POINTS_MAP[g]} pts` : g === 'P' ? 'Pass' : 'Absent',
            gradeCounts[g],
            `${((gradeCounts[g] / totalCount) * 100).toFixed(1)}%`
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['Grade', 'Description', 'Weight', 'Courses', 'Share']],
            body: gradeRows,
            theme: 'striped',
            headStyles: { fillColor: primaryColor, fontSize: 8.5 },
            styles: { fontSize: 8, cellPadding: 2 },
            margin: { left: 14, right: 14 },
        });

        yPos = (doc as any).lastAutoTable.finalY + 9;
    }

    // SECTION 3: CGPA Progression History
    if (options.includeCGPAHistory !== false) {
        if (yPos > 240) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        doc.text('3. Semester-Wise Academic Progression', 14, yPos);
        yPos += 4;

        const yearGroups = semesters.reduce((acc, sem) => {
            const year = sem.year;
            if (!acc[year]) acc[year] = [];
            acc[year].push(sem);
            return acc;
        }, {} as Record<number, Semester[]>);

        const sortedYears = Object.keys(yearGroups).map(Number).sort((a, b) => b - a);

        sortedYears.forEach(year => {
            const semList = yearGroups[year];
            const yearSubjects = semList.flatMap(s => s.subjects || []);
            const yearGpa = calculateGPA(yearSubjects);

            if (yPos > 245) {
                doc.addPage();
                yPos = 20;
            }

            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(80, 80, 80);
            doc.text(`Academic Year [${year}-${String(year + 1).slice(2)}] (Year GPA: ${yearGpa.toFixed(2)})`, 14, yPos);
            yPos += 4;

            semList.forEach(sem => {
                const semGpa = calculateGPA(sem.subjects || []);

                if (yPos > 245) {
                    doc.addPage();
                    yPos = 20;
                }

                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(110, 110, 110);
                doc.text(`${sem.term} Semester • GPA: ${semGpa.toFixed(2)}`, 14, yPos);
                yPos += 3;

                const sortedSemSubjects = sortSubjectsAlphabeticallyWithLab(sem.subjects || []);
                const semTableData = sortedSemSubjects.map((sub, idx) => {
                    const basketMeta = sub.basket ? BASKET_DEFINITIONS[sub.basket] : null;
                    return [
                        idx + 1,
                        sub.subject_name,
                        sub.subject_code,
                        sub.credit,
                        sub.grade === 'A_ABSENT' ? 'Absent' : sub.grade,
                        basketMeta ? basketMeta.shortName : 'Unassigned',
                    ];
                });

                autoTable(doc, {
                    startY: yPos,
                    head: [['#', 'Subject Name', 'Code', 'Credit', 'Grade', 'Basket']],
                    body: semTableData.length > 0 ? semTableData : [['-', 'No subjects', '-', '-', '-', '-']],
                    theme: 'striped',
                    headStyles: { fillColor: [70, 75, 80], fontSize: 8 },
                    styles: { fontSize: 7.5, cellPadding: 1.8 },
                    margin: { left: 14, right: 14 },
                });

                yPos = (doc as any).lastAutoTable.finalY + 6;
            });

            yPos += 3;
        });

        yPos += 5;
    }

    // SECTION 4: Curriculum Baskets & Degree Tracking
    if (options.includeCurriculumBaskets !== false) {
        if (yPos > 240) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        doc.text('4. Degree Curriculum Baskets Audit (120 Credits)', 14, yPos);
        yPos += 4;

        const basketDefinitionsList = [
            { key: 'discipline_core', code: 'DC', title: 'Discipline Core', maxCredit: 60 },
            { key: 'discipline_elective', code: 'DE', title: 'Discipline Elective', maxCredit: 24 },
            { key: 'project_internship', code: 'PI', title: 'Projects and Internship', maxCredit: 2 },
            { key: 'open_elective', code: 'OE', title: 'Open Elective', maxCredit: 9 },
            { key: 'ability_enhancement', code: 'AE', title: 'Ability Enhancement (5 cr AE + 3 cr Lang)', maxCredit: 8 },
            { key: 'skill_enhancement', code: 'SE', title: 'Skill Enhancement', maxCredit: 9 },
            { key: 'value_added', code: 'VAC', title: 'Value Added Courses (7 cr VAC + 1 cr Co-curr)', maxCredit: 8 },
        ];

        const curriculumSummaryRows = basketDefinitionsList.map(b => {
            const matchedSubjects = allSubjects.filter(sub => {
                if (b.key === 'ability_enhancement') return sub.basket === 'ability_enhancement' || sub.basket === 'language';
                if (b.key === 'value_added') return sub.basket === 'value_added' || sub.basket === 'cocurricular';
                return sub.basket === b.key;
            });
            const earned = matchedSubjects.reduce((acc, sub) => sub.grade !== 'A_ABSENT' ? acc + (Number(sub.credit) || 0) : acc, 0);

            return [
                b.code,
                b.title,
                `${earned} / ${b.maxCredit} Credits`,
                earned >= b.maxCredit ? 'Completed' : `${Math.max(0, b.maxCredit - earned)} Credits Remaining`,
            ];
        });

        autoTable(doc, {
            startY: yPos,
            head: [['Code', 'Basket Title', 'Earned / Required', 'Status']],
            body: curriculumSummaryRows,
            theme: 'striped',
            headStyles: { fillColor: primaryColor, fontSize: 8.5 },
            styles: { fontSize: 8, cellPadding: 2 },
            margin: { left: 14, right: 14 },
        });

        yPos = (doc as any).lastAutoTable.finalY + 8;

        // Optional course detail per category
        if (options.includeCurriculumCourseList) {
            basketDefinitionsList.forEach(b => {
                const matchedSubjects = allSubjects.filter(sub => {
                    if (b.key === 'ability_enhancement') return sub.basket === 'ability_enhancement' || sub.basket === 'language';
                    if (b.key === 'value_added') return sub.basket === 'value_added' || sub.basket === 'cocurricular';
                    return sub.basket === b.key;
                });
                const sortedSubjects = sortSubjectsAlphabeticallyWithLab(matchedSubjects);

                if (yPos > 245) {
                    doc.addPage();
                    yPos = 20;
                }

                doc.setFontSize(9.5);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(80, 80, 80);
                doc.text(`[${b.code}] ${b.title}`, 14, yPos);
                yPos += 3;

                const cRows = sortedSubjects.map((sub, idx) => [
                    idx + 1,
                    sub.subject_code,
                    sub.subject_name,
                    sub.credit,
                    sub.grade === 'A_ABSENT' ? 'Absent' : sub.grade
                ]);

                autoTable(doc, {
                    startY: yPos,
                    head: [['#', 'Code', 'Title', 'Credit', 'Grade']],
                    body: cRows.length > 0 ? cRows : [['-', '-', 'No courses assigned yet', '-', '-']],
                    theme: 'grid',
                    headStyles: { fillColor: [80, 85, 90], fontSize: 8 },
                    styles: { fontSize: 7.5, cellPadding: 1.8 },
                    margin: { left: 14, right: 14 },
                });

                yPos = (doc as any).lastAutoTable.finalY + 6;
            });
        }
    }

    // Page Number Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(140, 140, 140);
        doc.text(`StudyTrack Academic Report  |  Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
    }

    doc.save(`Academic_Report_Custom_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// --- Profile Export Compatibility ---
export async function exportCGPA({ format, userId }: ExportOptions) {
    const semestersQuery = query(collection(db, 'semesters'), where('user_id', '==', userId));
    const semestersSnapshot = await getDocs(semestersQuery);
    const semestersData = semestersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

    const subjectsQuery = query(collection(db, 'subjects'), where('user_id', '==', userId));
    const subjectsSnapshot = await getDocs(subjectsQuery);
    const subjectsData = subjectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

    const semesters = semestersData.map(sem => ({
        ...sem,
        subjects: subjectsData.filter(sub => sub.semester_id === sem.id)
    })) as unknown as Semester[];

    if (format === 'json') {
        downloadJSON(semesters, 'cgpa_data.json');
    } else {
        generateCGPAPDF(semesters);
    }
}

// --- CGPA PDF Generator ---
export function generateCGPAPDF(semesters: Semester[], studentName?: string) {
    const doc = new jsPDF();
    const cgpa = calculateCGPA(semesters);
    const allSubjects = semesters.flatMap(s => s.subjects || []);
    
    let totalCredits = 0;
    allSubjects.forEach(s => {
        if (s.grade !== 'A_ABSENT') {
            totalCredits += (Number(s.credit) || 0);
        }
    });

    // Header Banner
    doc.setFillColor(27, 128, 87);
    doc.rect(0, 0, 210, 26, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('StudyTrack - Academic CGPA Report', 14, 16);

    // Metadata Bar
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Student: ${studentName || 'Student'}`, 14, 34);
    doc.text(`Current CGPA: ${cgpa.toFixed(2)}`, 14, 40);
    doc.text(`Total Earned Credits: ${totalCredits}`, 110, 34);
    doc.text(`Total Subjects: ${allSubjects.length}`, 110, 40);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 46);

    let yPos = 54;

    // Group Semesters by Academic Year
    const yearGroups = semesters.reduce((acc, sem) => {
        const year = sem.year;
        if (!acc[year]) acc[year] = [];
        acc[year].push(sem);
        return acc;
    }, {} as Record<number, Semester[]>);

    const sortedYears = Object.keys(yearGroups).map(Number).sort((a, b) => b - a);

    sortedYears.forEach(year => {
        const semList = yearGroups[year];
        const yearSubjects = semList.flatMap(s => s.subjects || []);
        const yearGpa = calculateGPA(yearSubjects);

        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(27, 128, 87);
        doc.text(`Academic Year [${year}-${String(year + 1).slice(2)}] (Year GPA: ${yearGpa.toFixed(2)})`, 14, yPos);
        yPos += 4;

        semList.forEach(sem => {
            const semGpa = calculateGPA(sem.subjects || []);

            if (yPos > 250) {
                doc.addPage();
                yPos = 20;
            }

            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(80, 80, 80);
            doc.text(`${sem.term} Semester - GPA: ${semGpa.toFixed(2)}`, 14, yPos);
            yPos += 3;

            const tableData = sortSubjectsAlphabeticallyWithLab(sem.subjects || []).map((sub, index) => {
                const basketMeta = sub.basket ? BASKET_DEFINITIONS[sub.basket] : null;
                return [
                    index + 1,
                    sub.subject_name,
                    sub.subject_code,
                    sub.credit,
                    sub.grade === 'A_ABSENT' ? 'Absent' : sub.grade,
                    basketMeta ? basketMeta.shortName : 'Unassigned',
                ];
            });

            autoTable(doc, {
                startY: yPos,
                head: [['#', 'Subject Name', 'Code', 'Credit', 'Grade', 'Curriculum Basket']],
                body: tableData.length > 0 ? tableData : [['-', 'No subjects', '-', '-', '-', '-']],
                theme: 'striped',
                headStyles: { fillColor: [40, 60, 50], fontSize: 9 },
                styles: { fontSize: 8, cellPadding: 2 },
                margin: { left: 14, right: 14 },
            });

            yPos = (doc as any).lastAutoTable.finalY + 8;
        });

        yPos += 4;
    });

    doc.save(`CGPA_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// --- Grades View PDF Generator ---
export function generateGradesViewPDF(
    cgpa: number,
    totalCredits: number,
    allSubjects: Subject[],
    gradeDistribution: Record<Grade, number>,
    studentName?: string
) {
    const doc = new jsPDF();

    // Header Banner
    doc.setFillColor(0, 168, 204);
    doc.rect(0, 0, 210, 26, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('StudyTrack - Grade Distribution Report', 14, 16);

    // Summary Box
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Student: ${studentName || 'Student'}`, 14, 34);
    doc.text(`Current CGPA: ${cgpa.toFixed(2)}`, 14, 40);
    doc.text(`Total Earned Credits: ${totalCredits}`, 110, 34);
    doc.text(`Total Subjects Evaluated: ${allSubjects.length}`, 110, 40);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 46);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 130, 160);
    doc.text('Grade Breakdown & Statistics', 14, 56);

    const gradeOrder: Grade[] = ['S', 'A', 'B', 'C', 'D', 'E', 'F', 'N', 'P', 'A_ABSENT'];
    const totalCount = allSubjects.length || 1;

    const tableRows = gradeOrder.map(g => {
        const count = gradeDistribution[g] || 0;
        const pct = ((count / totalCount) * 100).toFixed(1) + '%';
        const points = GRADE_POINTS_MAP[g] !== undefined ? `${GRADE_POINTS_MAP[g]} pts` : g === 'P' ? 'Pass' : 'Absent';
        const label = g === 'A_ABSENT' ? 'Absent' : `${g} Grade`;

        return [g, label, points, count, pct];
    });

    autoTable(doc, {
        startY: 60,
        head: [['Grade', 'Description', 'Grade Points', 'Subject Count', 'Percentage']],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [0, 130, 160], fontSize: 9 },
        styles: { fontSize: 8.5, cellPadding: 2.5 },
        margin: { left: 14, right: 14 },
    });

    doc.save(`Grades_Distribution_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// --- Curriculum Baskets PDF Generator ---
export function generateCurriculumPDF(
    basketsList: {
        code: string;
        title: string;
        maxCredit: number;
        earnedCredit: number;
        subjects: Subject[];
    }[],
    totalCompletedCredits: number,
    studentName?: string
) {
    const doc = new jsPDF();

    // Header Banner
    doc.setFillColor(27, 128, 87);
    doc.rect(0, 0, 210, 26, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('StudyTrack - Degree Curriculum Report', 14, 16);

    // Summary Box
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Student: ${studentName || 'Student'}`, 14, 34);
    doc.text(`Degree Requirement: 120 Credits`, 14, 40);
    doc.text(`Mapped Credits Completed: ${totalCompletedCredits} / 120 (${((totalCompletedCredits / 120) * 100).toFixed(1)}%)`, 110, 34);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 110, 40);

    // Category Overview Table
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(27, 128, 87);
    doc.text('Curriculum Categories Summary', 14, 52);

    const summaryRows = basketsList.map(b => [
        b.code,
        b.title,
        `${b.earnedCredit} / ${b.maxCredit} Credits`,
        b.earnedCredit >= b.maxCredit ? 'Completed' : `${b.maxCredit - b.earnedCredit} Credits Remaining`,
    ]);

    autoTable(doc, {
        startY: 56,
        head: [['Code', 'Category Name', 'Earned / Required', 'Status']],
        body: summaryRows,
        theme: 'striped',
        headStyles: { fillColor: [27, 128, 87], fontSize: 9 },
        styles: { fontSize: 8.5, cellPadding: 2 },
        margin: { left: 14, right: 14 },
    });

    let yPos = (doc as any).lastAutoTable.finalY + 10;

    // Detailed lists per category
    basketsList.forEach(b => {
        if (yPos > 240) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(27, 128, 87);
        doc.text(`[${b.code}] ${b.title} (${b.earnedCredit} / ${b.maxCredit} Credits)`, 14, yPos);
        yPos += 4;

        const courseRows = sortSubjectsAlphabeticallyWithLab(b.subjects).map((sub, idx) => [
            idx + 1,
            sub.subject_code,
            sub.subject_name,
            sub.credit,
            sub.grade === 'A_ABSENT' ? 'Absent' : sub.grade
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['#', 'Code', 'Title', 'Credit', 'Grade']],
            body: courseRows.length > 0 ? courseRows : [['-', '-', 'No courses assigned yet', '-', '-']],
            theme: 'grid',
            headStyles: { fillColor: [60, 80, 70], fontSize: 8.5 },
            styles: { fontSize: 8, cellPadding: 2 },
            margin: { left: 14, right: 14 },
        });

        yPos = (doc as any).lastAutoTable.finalY + 8;
    });

    doc.save(`Curriculum_Baskets_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// --- Timetable PDF Export ---
export async function exportTimetable({ format, userId }: ExportOptions) {
    const entriesQuery = query(collection(db, 'smart_timetable_entries'), where('user_id', '==', userId));
    const entriesSnapshot = await getDocs(entriesQuery);
    const entries = entriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

    if (format === 'json') {
        downloadJSON(entries, 'timetable_data.json');
    } else {
        const doc = new jsPDF();
        doc.text('Timetable', 14, 15);

        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const tableData: any[] = [];

        days.forEach(day => {
            const dayEntries = entries?.filter((e: any) => e.day === day) || [];
            if (dayEntries.length > 0) {
                dayEntries.forEach((e: any) => {
                    tableData.push([
                        day,
                        `${formatTimeTo12Hr(e.start_time)} - ${formatTimeTo12Hr(e.end_time)}`,
                        e.subject_name,
                        e.subject_code,
                        e.type,
                        e.room_number || '-'
                    ]);
                });
            }
        });

        autoTable(doc, {
            startY: 25,
            head: [['Day', 'Time', 'Subject', 'Code', 'Type', 'Room']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [66, 66, 66] },
        });

        doc.save('timetable.pdf');
    }
}

// --- Helper Functions ---
function downloadJSON(data: any, filename: string) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

