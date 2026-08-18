import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
    type Semester, 
    type Subject, 
    type CurriculumBasketKey,
    type Grade,
    sortSubjectsAlphabeticallyWithLab
} from '../lib/cgpa';
import { Button } from '../components/ui/button';
import { SEO } from '../components/SEO';
import { Link } from 'react-router-dom';
import { 
    ArrowLeft, 
    ChevronRight, 
    Edit2, 
    BarChart3,
    AlertCircle,
    CheckCircle2,
    Download
} from 'lucide-react';
import { SubjectModal } from '../components/cgpa/SubjectModal';
import { generateCurriculumPDF } from '../lib/export';

interface BasketItemConfig {
    key: string;
    code: string;
    title: string;
    maxCredit: number;
    subBaskets?: { key: CurriculumBasketKey; title: string; requiredCredits: number }[];
    primaryColor: string;
    activeHeaderBg: string;
}

const BASKET_ITEMS: BasketItemConfig[] = [
    {
        key: 'discipline_core',
        code: 'DC',
        title: 'Discipline Core',
        maxCredit: 60,
        primaryColor: 'bg-[#1b8057] text-white',
        activeHeaderBg: 'bg-[#1b8057]',
    },
    {
        key: 'discipline_elective',
        code: 'DE',
        title: 'Discipline Elective',
        maxCredit: 24,
        primaryColor: 'bg-[#00a8cc] text-white',
        activeHeaderBg: 'bg-[#00a8cc]',
    },
    {
        key: 'project_internship',
        code: 'PI',
        title: 'Projects and Internship',
        maxCredit: 2,
        primaryColor: 'bg-[#00a8cc] text-white',
        activeHeaderBg: 'bg-[#00a8cc]',
    },
    {
        key: 'open_elective',
        code: 'OE',
        title: 'Open Elective',
        maxCredit: 9,
        primaryColor: 'bg-[#00a8cc] text-white',
        activeHeaderBg: 'bg-[#00a8cc]',
    },
    {
        key: 'ability_enhancement_group',
        code: 'AE',
        title: 'Ability Enhancement',
        maxCredit: 8,
        subBaskets: [
            { key: 'ability_enhancement', title: 'Ability Enhancement', requiredCredits: 5 },
            { key: 'language', title: 'Indian / Foreign Language', requiredCredits: 3 },
        ],
        primaryColor: 'bg-[#00a8cc] text-white',
        activeHeaderBg: 'bg-[#00a8cc]',
    },
    {
        key: 'skill_enhancement',
        code: 'SE',
        title: 'Skill Enhancement',
        maxCredit: 9,
        primaryColor: 'bg-[#00a8cc] text-white',
        activeHeaderBg: 'bg-[#00a8cc]',
    },
    {
        key: 'value_added_group',
        code: 'VAC',
        title: 'Value Added Courses',
        maxCredit: 8,
        subBaskets: [
            { key: 'value_added', title: 'Value Added Course', requiredCredits: 7 },
            { key: 'cocurricular', title: 'Co-curricular Course', requiredCredits: 1 },
        ],
        primaryColor: 'bg-[#00a8cc] text-white',
        activeHeaderBg: 'bg-[#00a8cc]',
    },
];

interface SubjectWithSemester extends Subject {
    semesterTerm?: string;
    semesterYear?: number;
    semesterId?: string;
}

const GRADE_BADGES: Record<Grade, string> = {
    S: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
    A: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
    B: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border-cyan-500/30',
    C: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30',
    D: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
    E: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30',
    F: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
    N: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30',
    P: 'bg-teal-500/15 text-teal-700 dark:text-teal-400 border-teal-500/30',
    A_ABSENT: 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-400 border-zinc-500/30',
};

export function Curriculum() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [activeBasketKey, setActiveBasketKey] = useState<string>('discipline_core');
    const [activeSubFilter, setActiveSubFilter] = useState<string>('ALL');

    // Table controls
    const [pageSize, setPageSize] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Subject editing state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedSubjectToEdit, setSelectedSubjectToEdit] = useState<SubjectWithSemester | null>(null);

    const fetchSemesters = async () => {
        if (!user) return;
        try {
            const semestersQuery = query(collection(db, 'semesters'), where('user_id', '==', user.uid));
            const semestersSnapshot = await getDocs(semestersQuery);
            const semestersData = semestersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const subjectsQuery = query(collection(db, 'subjects'), where('user_id', '==', user.uid));
            const subjectsSnapshot = await getDocs(subjectsQuery);
            const subjectsData = subjectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as (Subject & { semester_id: string })[];

            const combined = semestersData.map(sem => ({
                ...sem,
                subjects: subjectsData.filter((sub) => sub.semester_id === sem.id)
            })) as unknown as Semester[];

            setSemesters(combined || []);
        } catch (error) {
            console.error('Error fetching curriculum data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSemesters();
    }, [user]);

    const allSubjectsWithSem = useMemo(() => {
        const list: SubjectWithSemester[] = [];
        semesters.forEach(sem => {
            sem.subjects?.forEach(sub => {
                list.push({
                    ...sub,
                    semesterTerm: sem.term,
                    semesterYear: sem.year,
                    semesterId: sem.id,
                });
            });
        });
        return list;
    }, [semesters]);

    // Calculate credits for all individual basket keys
    const basketCreditsMap = useMemo(() => {
        const map: Record<string, number> = {
            discipline_core: 0,
            discipline_elective: 0,
            project_internship: 0,
            open_elective: 0,
            ability_enhancement: 0,
            language: 0,
            skill_enhancement: 0,
            value_added: 0,
            cocurricular: 0,
            unassigned: 0,
        };

        allSubjectsWithSem.forEach(sub => {
            if (sub.grade !== 'A_ABSENT') {
                const cred = Number(sub.credit) || 0;
                if (sub.basket && map[sub.basket] !== undefined) {
                    map[sub.basket] += cred;
                } else {
                    map.unassigned += cred;
                }
            }
        });

        return map;
    }, [allSubjectsWithSem]);

    // Calculate total credits for the 7 top-level sidebar items
    const sidebarCredits = useMemo(() => {
        return {
            discipline_core: basketCreditsMap.discipline_core || 0,
            discipline_elective: basketCreditsMap.discipline_elective || 0,
            project_internship: basketCreditsMap.project_internship || 0,
            open_elective: basketCreditsMap.open_elective || 0,
            ability_enhancement_group: (basketCreditsMap.ability_enhancement || 0) + (basketCreditsMap.language || 0),
            skill_enhancement: basketCreditsMap.skill_enhancement || 0,
            value_added_group: (basketCreditsMap.value_added || 0) + (basketCreditsMap.cocurricular || 0),
        };
    }, [basketCreditsMap]);

    // Total curriculum completed credits
    const totalCurriculumCompleted = useMemo(() => {
        return Object.values(sidebarCredits).reduce((a, b) => a + b, 0);
    }, [sidebarCredits]);

    const activeConfig = useMemo(() => {
        return BASKET_ITEMS.find(item => item.key === activeBasketKey) || BASKET_ITEMS[0];
    }, [activeBasketKey]);

    // Filter subjects for the currently active basket
    const currentBasketSubjects = useMemo(() => {
        const matched = allSubjectsWithSem.filter(sub => {
            if (activeConfig.key === 'ability_enhancement_group') {
                if (activeSubFilter === 'ability_enhancement') return sub.basket === 'ability_enhancement';
                if (activeSubFilter === 'language') return sub.basket === 'language';
                return sub.basket === 'ability_enhancement' || sub.basket === 'language';
            }
            if (activeConfig.key === 'value_added_group') {
                if (activeSubFilter === 'value_added') return sub.basket === 'value_added';
                if (activeSubFilter === 'cocurricular') return sub.basket === 'cocurricular';
                return sub.basket === 'value_added' || sub.basket === 'cocurricular';
            }
            return sub.basket === activeConfig.key;
        });

        return sortSubjectsAlphabeticallyWithLab(matched);
    }, [allSubjectsWithSem, activeConfig, activeSubFilter]);

    // Search and pagination filtering
    const filteredSubjects = useMemo(() => {
        let list = currentBasketSubjects;
        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase().trim();
            list = list.filter(sub => 
                sub.subject_name.toLowerCase().includes(query) ||
                sub.subject_code.toLowerCase().includes(query) ||
                (sub.semesterTerm && sub.semesterTerm.toLowerCase().includes(query))
            );
        }
        return list;
    }, [currentBasketSubjects, searchQuery]);

    const totalPages = Math.max(1, Math.ceil(filteredSubjects.length / pageSize));
    const paginatedSubjects = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredSubjects.slice(start, start + pageSize);
    }, [filteredSubjects, currentPage, pageSize]);

    const unassignedSubjects = useMemo(() => {
        return allSubjectsWithSem.filter(sub => !sub.basket);
    }, [allSubjectsWithSem]);

    const handleEditSubject = (subject: SubjectWithSemester) => {
        setSelectedSubjectToEdit(subject);
        setIsEditModalOpen(true);
    };

    // Helper to determine type and LTPJ
    const getCourseTypeAndLTPJ = (sub: Subject) => {
        const code = sub.subject_code.toUpperCase();
        const credit = Number(sub.credit) || 0;
        
        let type = 'TH';
        let l = credit >= 3 ? 3 : credit;
        let t = 0;
        let p = 0;
        let j = 0;

        if (code.endsWith('P') || sub.subject_name.toLowerCase().includes('lab') || sub.subject_name.toLowerCase().includes('practical')) {
            type = 'LO';
            l = 0;
            p = Math.round(credit * 2);
        } else if (sub.basket === 'project_internship' || sub.subject_name.toLowerCase().includes('project') || sub.subject_name.toLowerCase().includes('internship')) {
            type = 'PJC';
            l = 0;
            j = Math.round(credit);
        } else if (credit === 4) {
            type = 'TH';
            l = 3;
            t = 1;
        }

        return { type, l, t, p, j };
    };

    const handleDownloadPDF = () => {
        const basketsList = BASKET_ITEMS.map(item => {
            const earned = sidebarCredits[item.key as keyof typeof sidebarCredits] || 0;
            const subjects = allSubjectsWithSem.filter(sub => {
                if (item.key === 'ability_enhancement_group') {
                    return sub.basket === 'ability_enhancement' || sub.basket === 'language';
                }
                if (item.key === 'value_added_group') {
                    return sub.basket === 'value_added' || sub.basket === 'cocurricular';
                }
                return sub.basket === item.key;
            });
            return {
                code: item.code,
                title: item.title,
                maxCredit: item.maxCredit,
                earnedCredit: earned,
                subjects,
            };
        });

        generateCurriculumPDF(basketsList, totalCurriculumCompleted, user?.displayName || 'Student');
    };

    if (loading) return <div className="p-8 text-center">Loading curriculum view...</div>;

    return (
        <div className="space-y-6">
            <SEO 
                title="Curriculum Baskets | StudyTrack" 
                description="View your degree curriculum baskets, credit requirements, and mapped courses."
            />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <Link
                        to="/cgpa"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-1"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to CGPA Manager
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight">Curriculum Baskets</h1>
                    <p className="text-muted-foreground">
                        Overall Degree Requirement: <span className="font-bold text-primary">{totalCurriculumCompleted} / 120 Credits</span> completed
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button 
                        variant="outline" 
                        onClick={handleDownloadPDF}
                        className="gap-2 border-border/80 hover:bg-muted"
                        title="Download Degree Curriculum Baskets PDF Report"
                    >
                        <Download className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        Download PDF
                    </Button>
                    <Link to="/grades-view">
                        <Button variant="outline" className="gap-2">
                            <BarChart3 className="h-4 w-4 text-primary" />
                            Grades View
                        </Button>
                    </Link>
                    <Link to="/cgpa">
                        <Button variant="primary">
                            Manage CGPA
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Unassigned Warning Banner */}
            {unassignedSubjects.length > 0 && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                                {unassignedSubjects.length} course{unassignedSubjects.length !== 1 ? 's' : ''} unassigned ({basketCreditsMap.unassigned} credits)
                            </p>
                            <p className="text-xs text-amber-800/80 dark:text-amber-300/80">
                                Assign these courses to curriculum baskets to count towards your 120-credit degree requirements.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {unassignedSubjects.slice(0, 3).map(sub => (
                            <button
                                key={sub.id}
                                onClick={() => handleEditSubject(sub)}
                                className="px-2.5 py-1 rounded-lg bg-background border border-amber-500/30 text-xs font-medium hover:border-primary transition-all cursor-pointer"
                            >
                                {sub.subject_code} (Assign)
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Main Curriculum Layout: Left Sidebar Baskets + Right Content Table */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Baskets Sidebar */}
                <div className="lg:col-span-4 space-y-2">
                    {BASKET_ITEMS.map((item) => {
                        const earned = sidebarCredits[item.key as keyof typeof sidebarCredits] || 0;
                        const isSelected = activeBasketKey === item.key;
                        const isComplete = earned >= item.maxCredit;

                        return (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => {
                                    setActiveBasketKey(item.key);
                                    setActiveSubFilter('ALL');
                                    setCurrentPage(1);
                                }}
                                className={`w-full flex items-stretch rounded-xl border transition-all text-left overflow-hidden cursor-pointer shadow-xs ${
                                    isSelected
                                        ? 'border-primary ring-2 ring-primary/40 shadow-md'
                                        : 'border-border/60 hover:border-border bg-card'
                                }`}
                            >
                                {/* Left Color Block with Code, Credit, Max Credit */}
                                <div className={`w-28 p-2.5 flex flex-col items-center justify-center text-center shrink-0 ${
                                    item.key === 'discipline_core' 
                                        ? 'bg-[#1b8057] text-white' 
                                        : 'bg-[#00a8cc] text-white'
                                }`}>
                                    <span className="text-sm font-black tracking-wider leading-tight">{item.code}</span>
                                    <span className="text-[11px] font-medium leading-tight mt-0.5">Credit: {earned}</span>
                                    <span className="text-[11px] font-medium opacity-90 leading-tight">Max. Credit: {item.maxCredit}</span>
                                </div>

                                {/* Right Title Block */}
                                <div className={`flex-1 px-4 py-3 flex items-center justify-between transition-colors ${
                                    isSelected 
                                        ? 'bg-primary/5 dark:bg-primary/10' 
                                        : 'bg-card hover:bg-muted/30'
                                }`}>
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-1.5">
                                            <span className={`text-sm font-bold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                                                {item.title}
                                            </span>
                                            {isComplete && (
                                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                            )}
                                        </div>
                                        {item.subBaskets && (
                                            <p className="text-[10px] text-muted-foreground">
                                                {item.subBaskets.map(s => `${s.title.split(' ')[0]}: ${basketCreditsMap[s.key] || 0}/${s.requiredCredits}`).join(' • ')}
                                            </p>
                                        )}
                                    </div>
                                    <ChevronRight className={`h-4 w-4 shrink-0 transition-transform ${isSelected ? 'text-primary translate-x-0.5' : 'text-muted-foreground/60'}`} />
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Right Content Table */}
                <div className="lg:col-span-8 space-y-4">
                    {/* Top Green Banner Title (matching the image) */}
                    <div className="rounded-xl overflow-hidden shadow-xs border border-border/50 bg-card">
                        <div className="bg-[#1b8057] text-white px-4 py-2.5 flex items-center justify-between">
                            <h2 className="text-base font-bold tracking-wide flex items-center gap-2">
                                {activeConfig.title}
                            </h2>
                            <div className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/20 text-white">
                                Earned: {sidebarCredits[activeConfig.key as keyof typeof sidebarCredits]} / {activeConfig.maxCredit} Credits
                            </div>
                        </div>

                        {/* Sub-basket Tabs (for AE and VAC) */}
                        {activeConfig.subBaskets && (
                            <div className="px-4 pt-3 pb-1 border-b border-border/50 flex flex-wrap gap-2 bg-muted/20">
                                <button
                                    onClick={() => { setActiveSubFilter('ALL'); setCurrentPage(1); }}
                                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                        activeSubFilter === 'ALL'
                                            ? 'bg-primary text-primary-foreground shadow-xs'
                                            : 'bg-muted text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    All Sub-baskets ({sidebarCredits[activeConfig.key as keyof typeof sidebarCredits]} / {activeConfig.maxCredit} cr)
                                </button>
                                {activeConfig.subBaskets.map(sub => (
                                    <button
                                        key={sub.key}
                                        onClick={() => { setActiveSubFilter(sub.key); setCurrentPage(1); }}
                                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                            activeSubFilter === sub.key
                                                ? 'bg-primary text-primary-foreground shadow-xs'
                                                : 'bg-muted text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        {sub.title} ({basketCreditsMap[sub.key] || 0} / {sub.requiredCredits} cr)
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Table Controls (Show entries + Search) */}
                        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <span>Show</span>
                                <select
                                    value={pageSize}
                                    onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                                    className="h-8 rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                </select>
                                <span>entries</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="font-medium">Search:</span>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                        placeholder=""
                                        className="h-8 w-44 rounded-md border border-input bg-background px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Data Table */}
                        <div className="overflow-x-auto border-t border-border/50">
                            <table className="w-full text-xs min-w-[700px]">
                                <thead>
                                    <tr className="border-b bg-muted/30 text-muted-foreground font-semibold">
                                        <th className="p-3 text-left w-12">S.No.</th>
                                        <th className="p-3 text-left">Code/Syllabus</th>
                                        <th className="p-3 text-left">Title</th>
                                        <th className="p-3 text-center w-14">Type</th>
                                        <th className="p-3 text-center w-16">Credit</th>
                                        <th className="p-3 text-center w-10">L</th>
                                        <th className="p-3 text-center w-10">T</th>
                                        <th className="p-3 text-center w-10">P</th>
                                        <th className="p-3 text-center w-10">J</th>
                                        <th className="p-3 text-center w-16">Grade</th>
                                        <th className="p-3 text-right w-16">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedSubjects.length === 0 ? (
                                        <tr>
                                            <td colSpan={11} className="p-8 text-center text-muted-foreground">
                                                No courses added in this basket yet.
                                                <div className="mt-1 text-[11px]">
                                                    Add or edit a subject from the CGPA manager and assign it to <b>{activeConfig.title}</b>.
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedSubjects.map((sub, idx) => {
                                            const sNo = (currentPage - 1) * pageSize + idx + 1;
                                            const { type, l, t, p, j } = getCourseTypeAndLTPJ(sub);
                                            const gradeBadge = GRADE_BADGES[sub.grade] || GRADE_BADGES.A_ABSENT;

                                            return (
                                                <tr key={sub.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                                                    <td className="p-3 text-muted-foreground font-medium">{sNo}</td>
                                                    <td className="p-3 font-semibold text-foreground">{sub.subject_code}</td>
                                                    <td className="p-3 font-medium text-foreground">
                                                        <div className="flex items-center gap-1.5">
                                                            <span>{sub.subject_name}</span>
                                                            <span className="text-[10px] text-muted-foreground">
                                                                ({sub.semesterTerm} {sub.semesterYear})
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <span className="px-1.5 py-0.5 rounded bg-muted font-bold text-[11px]">
                                                            {type}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-center font-bold">{Number(sub.credit).toFixed(1)}</td>
                                                    <td className="p-3 text-center text-muted-foreground">{l}</td>
                                                    <td className="p-3 text-center text-muted-foreground">{t}</td>
                                                    <td className="p-3 text-center text-muted-foreground">{p}</td>
                                                    <td className="p-3 text-center text-muted-foreground">{j}</td>
                                                    <td className="p-3 text-center">
                                                        <span className={`inline-flex items-center justify-center rounded px-2 py-0.5 font-bold text-[11px] border ${gradeBadge}`}>
                                                            {sub.grade === 'A_ABSENT' ? 'Abs' : sub.grade}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                                                            onClick={() => handleEditSubject(sub)}
                                                            title="Edit subject / basket details"
                                                        >
                                                            <Edit2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Footer */}
                        <div className="p-4 border-t border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <span className="text-muted-foreground">
                                Showing {filteredSubjects.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to {Math.min(currentPage * pageSize, filteredSubjects.length)} of {filteredSubjects.length} entries
                            </span>

                            <div className="flex items-center gap-1 self-end sm:self-auto">
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-2.5 py-1 rounded border border-input text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted transition-colors cursor-pointer"
                                >
                                    Previous
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                                    <button
                                        key={pg}
                                        type="button"
                                        onClick={() => setCurrentPage(pg)}
                                        className={`h-7 w-7 rounded text-xs font-semibold transition-colors cursor-pointer ${
                                            currentPage === pg
                                                ? 'bg-blue-600 text-white'
                                                : 'border border-input hover:bg-muted text-foreground'
                                        }`}
                                    >
                                        {pg}
                                    </button>
                                ))}

                                <button
                                    type="button"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages || filteredSubjects.length === 0}
                                    className="px-2.5 py-1 rounded border border-input text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted transition-colors cursor-pointer"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Subject Modal */}
            {selectedSubjectToEdit && (
                <SubjectModal
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setSelectedSubjectToEdit(null);
                    }}
                    onSuccess={fetchSemesters}
                    semesterId={selectedSubjectToEdit.semesterId}
                    subjectToEdit={selectedSubjectToEdit}
                />
            )}
        </div>
    );
}
