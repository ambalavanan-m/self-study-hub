import React, { createContext, useContext, useEffect, useState } from 'react';
import { type User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                const now = new Date();
                const today7AM = new Date(now);
                today7AM.setHours(7, 0, 0, 0);

                const lastActiveStr = localStorage.getItem('lastActiveTimestamp');

                if (lastActiveStr) {
                    const lastActive = new Date(lastActiveStr);

                    if (now >= today7AM) {
                        if (lastActive < today7AM) {
                            firebaseSignOut(auth).then(() => {
                                setUser(null);
                                setLoading(false);
                                localStorage.setItem('lastActiveTimestamp', now.toISOString());
                            });
                            return;
                        }
                    }
                }

                localStorage.setItem('lastActiveTimestamp', now.toISOString());
            }
            
            setUser(currentUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signOut = async () => {
        await firebaseSignOut(auth);
    };

    return (
        <AuthContext.Provider value={{ user, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
