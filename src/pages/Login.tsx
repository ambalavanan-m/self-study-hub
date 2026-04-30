
import { MobileLogin } from '../components/auth/MobileLogin';
import { DesktopLogin } from '../components/auth/DesktopLogin';
import { SEO } from '../components/SEO';

export function Login() {
    return (
        <>
            <SEO 
                title="Login | StudyTrack" 
                description="Sign in to your StudyTrack account to manage your academic progress, timetable, and study materials."
            />
            <div className="block md:hidden">
                <MobileLogin />
            </div>
            <div className="hidden md:block">
                <DesktopLogin />
            </div>
        </>
    );
}
