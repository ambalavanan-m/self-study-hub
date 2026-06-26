import { MobileSignup } from '../components/auth/MobileSignup';
import { DesktopSignup } from '../components/auth/DesktopSignup';
import { SEO } from '../components/SEO';

export function Signup() {
    return (
        <>
            <SEO 
                title="Sign Up | StudyTrack" 
                description="Create a StudyTrack account to start organizing your academic life. Track your CGPA, manage your timetable, and more."
            />
            <div className="block md:hidden">
                <MobileSignup />
            </div>
            <div className="hidden md:block">
                <DesktopSignup />
            </div>
        </>
    );
}
