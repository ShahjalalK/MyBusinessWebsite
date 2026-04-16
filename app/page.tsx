import Image from "next/image";
import HeroGoogleAds from "./components/HeroSection/heroGoogleAds";
import Achivement from "./components/HeroSection/achivement";
import Warkingproces from "./components/HeroSection/warkingproces";
import CaseStady from "./components/HeroSection/caseStady";
import Testimonial from "./components/HeroSection/testimonial";
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

    <BlogSection />
    <Testimonial />

    <CTASection />

  <Footer />
   </>
  );
 
  
  
}
