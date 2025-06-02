
import { Hero } from "@/components/Hero";
import { ServiceOptions } from "@/components/ServiceOptions";
import { TrustedPartners } from "@/components/TrustedPartners";
import { PartnershipsSection } from "@/components/PartnershipsSection";
import { About } from "@/components/About";
import { ContactSection } from "@/components/ContactSection";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <Hero />
        <About />
        <ServiceOptions />
        <PartnershipsSection />
        <TrustedPartners />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
