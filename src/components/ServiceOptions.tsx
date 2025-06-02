import { useState } from "react";
import { Building2, FileText, Shield, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BusinessFormationForm } from "@/components/BusinessFormationForm";

export const ServiceOptions = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);

  const services = [
    {
      icon: Building2,
      title: "Business Formation",
      description: "Launch your LLC, Corp, or Partnership with expert help and fast filing.",
      features: ["State filing", "EIN setup", "Operating agreement", "Compliance calendar"],
      price: "Starting at $299",
      popular: true,
    },
    {
      icon: FileText,
      title: "Registered Agent",
      description: "Stay compliant with privacy-focused document and mail handling.",
      features: ["Mail forwarding", "Scanning", "Compliance alerts", "Privacy support"],
      price: "Starting at $149/year",
      popular: false,
    },
    {
      icon: Shield,
      title: "Accounting & Taxation Guidance",
      description: "Keep your business in good standing with ongoing filing guidance.",
      features: ["Annual reports", "Filings", "Updates", "Reminder alerts"],
      price: "Starting at $199/year",
      popular: false,
    },
    {
      icon: "/trademark.png",
      title: "Trademark Guidance",
      description: "Legal, tax, and strategy help from vetted business professionals.",
      features: ["Legal advice", "Tax planning", "Strategy", "Doc review"],
      price: "Custom pricing",
      popular: false,
    },
  ];

  return (
    <>
      <section id="services" className="py-20 bg-custom-medium-gray min-h-screen">
        <div className="max-w-[1750px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-custom-dark-maroon text-4xl font-bold mb-8">
              Business Solutions
            </h2>
            <p className="text-xl text-custom-dark-gray max-w-3xl mx-auto">
              Expert consulting in business law, formation, accounting, taxation, Trademark and more...
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <div 
                key={index}
                className={`flex flex-col h-full min-h-[300px] bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow hover:scale-105 transition-transform duration-300 p-6 relative ${
                  service.popular ? 'ring-2 ring-custom-dark-maroon' : ''
                }`}
              >
                {service.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-custom-dark-maroon text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="w-12 h-12 bg-custom-light-gray rounded-lg flex items-center justify-center mb-4">
                  {typeof service.icon === 'string' ? (
                    // Render as image if icon is a string (assumed to be image URL)
                    <img 
                      src={service.icon} 
                      alt={service.title || 'Service icon'} 
                      className="h-8 w-8 object-contain"
                    />
                  ) : (
                    // Render as icon component if it's not a string
                    <service.icon className="h-8 w-8 text-black" />
                  )}
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {service.title}
                </h3>

                <p className="text-gray-600 mb-4 text-sm">
                  {service.description}
                </p>

                <ul className="space-y-2 mb-6">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-sm text-gray-600">
                      <ArrowRight className="h-3 w-3 text-custom-dark-maroon mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Align button to bottom */}
                {/* <div className="mt-auto pt-4">
                  <Button 
                    onClick={() => setIsFormOpen(true)}
                    className={`w-full transition-colors ${
                      service.popular 
                        ? 'bg-custom-dark-maroon hover:bg-custom-deep-maroon text-white' 
                        : 'bg-white text-custom-dark-maroon border-2 border-custom-dark-maroon hover:bg-custom-light-gray hover:text-custom-dark-maroon'
                    }`}
                    variant={service.popular ? 'default' : 'outline'}
                  >
                    Get Started
                  </Button>
                </div> */}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">
              Need help choosing the right package? Our business formation experts are here to help.
            </p>
            <Button 
              variant="outline"
              onClick={() => {
                const contactSection = document.getElementById('contact');
                if (contactSection) {
                  contactSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="bg-custom-dark-maroon text-custom-light-gray hover:bg-custom-deep-maroon hover:scale-105 transition-transform duration-300 px-8 py-3 text-lg font-normal border-2 border-custom-dark-maroon focus:outline-2 focus:outline-offset-2 focus:outline-custom-deep-maroon"
            >
              Talk to an Expert
            </Button>
          </div>
        </div>
      </section>

      <BusinessFormationForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
      />
    </>
  );
};