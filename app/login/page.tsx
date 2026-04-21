"use client"
import { auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LoginPage() {
    const [user, setUser] = useState<any>(null);
    const router = useRouter();

  // login/page.tsx এর ভেতরে
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user && user.email === ADMIN_EMAIL) {
            router.push('/admin/dashboard'); 
        }
    });
    return () => unsubscribe();
}, [router, ADMIN_EMAIL]);

    const handleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Login Error:", error);
            alert("Login failed!");
        }
    };

    return (
        <div className="h-screen flex flex-col items-center justify-center bg-[#FAFBFF] font-sans">
            <div className="bg-white p-10 rounded-[40px] shadow-xl border border-gray-100 text-center max-w-sm w-full">
                <h1 className="text-3xl font-black italic uppercase tracking-tighter mb-2">Access Portal</h1>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-8">Authorized Personnel Only</p>
                
                {!user ? (
                    <button 
                        onClick={handleLogin}
                        className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-blue-700 transition-all active:scale-95 uppercase text-xs"
                    >
                        Login with Google
                    </button>
                ) : (
                    <div className="space-y-4">
                        <p className="text-xs font-bold text-emerald-500 uppercase">Logged in as: {user.email}</p>
                        {user.email !== "your-email@gmail.com" && (
                            <p className="text-[10px] text-red-500 font-black uppercase">You don't have admin access!</p>
                        )}
                        <button 
                            onClick={() => signOut(auth)}
                            className="w-full bg-gray-100 text-gray-400 font-black py-4 rounded-2xl hover:bg-gray-200 transition-all uppercase text-xs"
                        >
                            Sign Out
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}