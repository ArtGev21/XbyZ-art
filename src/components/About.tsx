import { Button } from "@/components/ui/button";

export const About = () => {
  const handleConsultation = () => {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="about" className="py-20 bg-custom-dark-gray min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold leading-tight text-custom-light-gray text-center">
          Your Future, Our Commitment
        </h2>
        <p className="text-xl text-custom-light-gray leading-relaxed pt-10 text-center">
          We specialize in gathering essential personal and business information to help you build a successful future. Trust us to support your journey with tailored insights and dedicated service.
        </p>
        <h3 className="text-3xl font-semibold leading-tight text-custom-light-gray text-center mt-10">Client Information Hub</h3>
        <p className="text-center text-custom-light-gray font-thin mt-4">We collect and manage your personal and business information for future growth and success.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12 text-center">
          <div className="bg-white/20 backdrop-blur-md rounded-lg p-6 shadow-lg hover:scale-105 transition-transform duration-300">
            <img
              src="/about/about-1.avif"
              className="rounded-lg mb-4 max-w-full h-auto mx-auto"
            />
            <h4 className="text-lg font-light text-custom-light-gray border-b-[1px] mb-2">Data Collection Service</h4>
            <p className="text-center text-custom-light-gray font-thin">Our service ensures secure and efficient collection of your personal and business information.</p>
          </div>
          <div className="bg-white/20 backdrop-blur-md rounded-lg p-6 shadow-lg hover:scale-105 transition-transform duration-300">
            <img
              src="/about/about-2.avif"
              className="rounded-lg mb-4 max-w-full h-auto mx-auto"
            />
            <h4 className="text-lg font-light text-custom-light-gray border-b-[1px] mb-2">Future Planning Tool</h4>
            <p className="text-center text-custom-light-gray font-thin">Utilize our platform to strategize and plan for your business's future with collected data.</p>
          </div>
          <div className="bg-white/20 backdrop-blur-md rounded-lg p-6 shadow-lg hover:scale-105 transition-transform duration-300">
            <img
              src="/about/about-3.avif"
              className="rounded-lg mb-4 max-w-full h-auto mx-auto"
            />
            <h4 className="text-lg font-light text-custom-light-gray border-b-[1px] mb-2">Insight Generation</h4>
            <p className="text-center text-custom-light-gray font-thin">We provide insights based on your information to help you make informed business decisions.</p>
          </div>
        </div>
        <div className="mt-12 text-center">
          <Button 
            size="lg"
            onClick={handleConsultation}
            className="bg-custom-dark-maroon text-custom-light-gray hover:bg-custom-deep-maroon focus:text-custom-medium-gray px-8 py-3 text-lg font-semibold hover:scale-105 transition-all duration-300 border-2 border-custom-dark-maroon focus:outline-2 focus:outline-offset-2 focus:outline-custom-deep-maroon"
          >
            Get a Free Consultation
          </Button>
        </div>
      </div>
    </section>
  );
};
