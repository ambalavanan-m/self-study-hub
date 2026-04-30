import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { BookOpen, Brain, Calendar, FileText, CheckSquare, Clock } from 'lucide-react';
import { SEO } from '../components/SEO';

export function Landing() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
            <SEO 
                title="StudyTrack - Your Academic Life, Organized" 
                description="Track your CGPA, manage your schedule, organize files, and stay on top of tasks. Everything you need to excel in college, in one place."
            />
            <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <BookOpen className="h-6 w-6 text-primary" />
                        <span className="text-xl font-bold">StudyTrack</span>
                    </div>
                    <div className="flex gap-2">
                        <Link to="/login">
                            <Button variant="ghost">Login</Button>
                        </Link>
                        <Link to="/signup">
                            <Button>Get Started</Button>
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="container px-4">
                <section className="flex flex-col items-center justify-center py-20 text-center">
                    <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
                        Your Academic Life,
                        <span className="text-primary"> Organized</span>
                    </h1>
                    <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
                        Track your CGPA, manage your schedule, organize files, and stay on top of tasks.
                        Everything you need to excel in college, in one place.
                    </p>
                    <div className="mt-8 flex gap-4">
                        <Link to="/signup">
                            <Button size="lg" className="text-lg px-8">
                                Start Free
                            </Button>
                        </Link>
                        <Link to="/login">
                            <Button size="lg" variant="outline" className="text-lg px-8">
                                Sign In
                            </Button>
                        </Link>
                    </div>
                </section>

                <section className="grid gap-8 py-16 md:grid-cols-2 lg:grid-cols-3">
                    <FeatureCard
                        icon={<Brain className="h-8 w-8" />}
                        title="CGPA Manager"
                        description="Track your grades, calculate GPA per semester, and monitor your academic progress over time."
                    />
                    <FeatureCard
                        icon={<Calendar className="h-8 w-8" />}
                        title="Timetable"
                        description="Organize your weekly class schedule with support for theory and lab sessions."
                    />
                    <FeatureCard
                        icon={<FileText className="h-8 w-8" />}
                        title="Files Manager"
                        description="Store and organize your study materials, assignments, and notes in one place."
                    />
                    <FeatureCard
                        icon={<CheckSquare className="h-8 w-8" />}
                        title="Task Management"
                        description="Keep track of assignments, projects, and deadlines with priority-based task lists."
                    />
                    <FeatureCard
                        icon={<Clock className="h-8 w-8" />}
                        title="Study Sessions"
                        description="Stay focused with the Pomodoro timer and track your study hours over time."
                    />
                    <FeatureCard
                        icon={<BookOpen className="h-8 w-8" />}
                        title="Dashboard"
                        description="Get a quick overview of your CGPA, upcoming tasks, and today's schedule at a glance."
                    />
                </section>

                <section className="py-20 text-center">
                    <h2 className="text-3xl font-bold">Ready to get organized?</h2>
                    <p className="mt-4 text-muted-foreground">
                        Join students who are taking control of their academic journey.
                    </p>
                    <div className="mt-8">
                        <Link to="/signup">
                            <Button size="lg" className="text-lg px-8">
                                Create Free Account
                            </Button>
                        </Link>
                    </div>
                </section>
            </main>

            <footer className="border-t py-8">
                <div className="container px-4 text-center text-sm text-muted-foreground">
                    <p>&copy; 2025 StudyTrack. Built for students, by students.</p>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, description }: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3 text-primary">
                {icon}
            </div>
            <h3 className="mb-2 text-xl font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
    );
}
