
import { Button } from "@/components/ui/button";
import { link } from "fs";
import { Handshake, Users, Globe, Award } from "lucide-react";

export const PartnershipsSection = () => {
  const handlePartnerInquiry = () => {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const partnerships = [
    {
      logo: "/CitrusAppsLab (1).png",
      link: "https://citrusappslab.com",
      title: "Citrus Apps Lab",
      description: "Citrus Apps Lab is a digital agency based in Glendale, California, specializing in web development, mobile app development, and AI implementation. "
    },
    {
      logo: "/founderscard.png",
      link: "https://founderscard.com/membership?code=FCSTYOPA604",
      title: "FOUNDERSCARD",
      description: "Connect to FoundersCard with XbyZ to access exclusive benefits and get your first year free."
    },
    // {
    //   icon: Globe,
    //   title: "Global Network",
    //   description: "Access our international network of legal and business professionals worldwide."
    // },
    // {
    //   icon: Award,
    //   title: "Certified Partners",
    //   description: "Become a certified XByzeth partner with exclusive benefits and training programs."
    // }
  ];

  return (
    <section id="partnerships" className="py-20 bg-custom-light-gray ">
      <div className="max-w-[1750px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-custom-dark-maroon mb-4">
            Partnership Opportunities
          </h2>
          <p className="text-xl text-black/80 max-w-3xl mx-auto font-normal">
            Join forces with X<span className="text-custom-dark-maroon font-normal">by</span>Z to create mutually beneficial partnerships that drive growth and success for both our organizations and clients.
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 mb-12 justify-items-center">
          {partnerships.map((partnership, index) => (
            <div key={index} className="max-w-[400px] bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200">
              <div className="flex items-center justify-start mb-1 space-x-4">
                <a href={partnership.link} target="_blank" rel="noopener noreferrer">
                  <img
                    src={partnership.logo}
                    alt={`${partnership.title} logo`}
                    className="w-16 h-16 rounded-lg flex items-center justify-center mb-4 hover:scale-105 transition-transform duration-300"
                  />
                </a>
                
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {partnership.title}
              </h3>
              </div>
              <p className="text-black/80 justify-center items-center">
                {partnership.description}
              </p>
            </div>
          ))}
        </div>

        {/* <div className="text-center">
          <Button 
            onClick={handlePartnerInquiry}
            size="lg"
            className="bg-custom-dark-maroon hover:bg-custom-deep-maroon focus:bg-custom-deep-maroon text-white px-8 py-3 border-2 border-custom-dark-maroon focus:outline-2 focus:outline-offset-2 focus:outline-custom-dark-maroon hover:scale-105 transition-transform duration-300"
            aria-label="Become a Partner"
          >
            Become a Partner
          </Button>
        </div> */}
      </div>
    </section>
  );
};
