"use client"
import { useEffect, useState } from 'react';
import { auth } from '../lib/firebase'; // তোমার ফায়ারবেস পাথ অনুযায়ী ঠিক করে নিও
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // AdminGuard.tsx এর ভেতরে
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user && user.email === ADMIN_EMAIL) {
            setIsAdmin(true);
        } else {
            router.push('/login');
        }
        setLoading(false);
    });
    return () => unsubscribe();
}, [router, ADMIN_EMAIL]);

    if (loading) return <div className="h-screen flex items-center justify-center font-black italic text-blue-600">VERIFYING ACCESS...</div>;

    return isAdmin ? <>{children}</> : null;
}