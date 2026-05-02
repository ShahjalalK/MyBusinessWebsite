import Image from "next/image";
import HeroGoogleAds from "./components/HeroSection/heroGoogleAds";
import Achivement from "./components/HeroSection/achivement";
import Warkingproces from "./components/HeroSection/warkingproces";
import CaseStady from "./components/HeroSection/caseStady";
import Footer from "./components/footer";
import Navbar from "./components/navbar";
import MainSection from "./components/HeroSection/mainSection";
import CTASection from "./components/ctaSection";
import ProblemSection from "./components/HeroSection/problemSection";
import SolutionSection from "./components/HeroSection/solutionSection";
import ResultsProof from "./components/HeroSection/results";
import ServiceDetails from "./components/HeroSection/serviceDetails";
import AgencyTeamSection from "./components/agencyTeamSection";
import BlogSection from "./components/HeroSection/blogSection";
import TestimonialSection from "./components/HeroSection/testimonial";


export const metadata = {
  // টাইটেলের শুরুতে মেইন কিওয়ার্ড রাখা এসইও-র জন্য সেরা
  title: "Hire Google Ads Expert | GTM Server-Side & CAPI Specialist",
  description: "Boost your ROAS! Hire a Google Ads expert for professional GA4 audits, GTM Server-Side tracking, and Meta Conversions API (CAPI) setup. Get a free audit today.",
  keywords: [
    "hire google ads expert", // KD 5% - High Priority
    "google ads specialist",
    "gtm server side tracking",
    "meta conversions api",
    "facebook capi expert",
    "ga4 audit service",
    "conversion tracking specialist"
  ],
  openGraph: {
    title: "TrackFlow Pro | Expert Google Ads & Precision Tracking",
    description: "Fix your tracking issues and scale your ads. Specialized in GTM Server-Side and Facebook CAPI for maximum data accuracy.",
    url: "https://trackflowpro.com", 
    siteName: "TrackFlow Pro",
    images: [
      {
        url: "/og-image.png", 
        width: 1200,
        height: 630,
        alt: "TrackFlow Pro - Google Ads & Tracking Excellence",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  // রোবটদের জন্য ইন্সট্রাকশন যোগ করা ভালো
  robots: {
    index: true,
    follow: true,
  }
};

export default function Home() {
  return (
   <>
   <Navbar />
   <MainSection />

    <HeroGoogleAds />

    <ProblemSection />

    <SolutionSection />

    <ServiceDetails />

    

    <Achivement />

    {/* <CaseStady /> */}

    

    <Warkingproces />
    

    
<ResultsProof />

    <AgencyTeamSection />

    <BlogSection />
    <TestimonialSection />

    <CTASection />

  <Footer />
   </>
  );
 
  
  
}
