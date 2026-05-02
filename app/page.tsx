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
  title: "Hire Google Ads Expert | GTM Server-Side Tracking Specialist",
  description: "Looking to hire a Google Ads expert? We provide expert GTM Server-Side tracking, GA4 audit, and Meta Conversions API (CAPI) setup to maximize your ROI.",
  keywords: [
    "hire google ads expert",
    "gtm server side tracking",
    "google ads specialist",
    "ga4 server side tracking",
    "meta conversions api",
    "facebook capi",
    "google ads audit service",
    "personalized email signature"
  ],
  openGraph: {
    title: "TrackFlow Pro | Precision Tracking & Ads Optimization",
    description: "Bypass iOS 14+ restrictions with GTM Server-Side Tracking. Get a professional Google Ads Audit today.",
    url: "https://trackflowpro.com", // আপনার অরিজিনাল ইউআরএল দিন
    siteName: "TrackFlow Pro",
    images: [
      {
        url: "/og-image.png", // আপনার সাইটের একটি প্রিভিউ ইমেজ লিঙ্ক
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
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

    {/* <LiveTrackingSection /> */}

    <Achivement />

    <CaseStady />

    <ResultsProof />

    <Warkingproces />
    

    

    <AgencyTeamSection />

    {/* <BlogSection />
    <TestimonialSection /> */}

    <CTASection />

  <Footer />
   </>
  );
 
  
  
}
