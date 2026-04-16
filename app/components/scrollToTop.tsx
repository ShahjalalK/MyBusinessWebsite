"use client"
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    // অল্প কিছু সময় (১০-৫০ মিলিসেকেন্ড) দেরি করলে ব্রাউজার নতুন কন্টেন্ট রেন্ডার করার সুযোগ পায়
    const timeout = setTimeout(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "instant", // 'smooth' এর বদলে 'instant' ট্রাই করুন
      });
    }, 10); 

    return () => clearTimeout(timeout);
  }, [pathname]);

  return null;
}