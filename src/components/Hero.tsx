import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BusinessFormationForm } from "@/components/BusinessFormationForm";
import { AuthModal } from "@/components/AuthModal";
import { PricingPackages } from "@/components/PricingPackages";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export const Hero = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [hasSubmittedInfo, setHasSubmittedInfo] = useState(false);
  const { isAuthenticated, logout, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user has submitted information
    const dashboardData = localStorage.getItem('dashboardData');
    setHasSubmittedInfo(!!dashboardData);
  }, [isAuthenticated]);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      setIsFormOpen(true);
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const handleDashboard = () => {
    navigate('/dashboard');
  };

  const handleFormSubmitted = () => {
    setIsFormOpen(false);
    setIsPricingOpen(true);
  };

  if (loading) {
    return (
      <section className="relative bg-gradient-to-r from-gray-50 to-gray-100 py-20 min-h-screen flex items-center justify-center">
        <div className="text-custom-dark-maroon text-xl">Loading...</div>
      </section>
    );
  }

  return (
    <>
      <section 
        id="/" 
        className="relative bg-gradient-to-r from-gray-50 to-gray-100 py-20 min-h-screen flex " 
        role="banner"
      >
        {/* Background with overlay */}
        <div 
          className="absolute inset-0 bg-[url('/hero.png')] bg-cover bg-no-repeat bg-center sm:bg-center bg-[position:80%_50%]"
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        </div>
        
        {/* Content container with z-index */}
        <div className="relative z-10 w-full ">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="space-y-20">
              <div className="space-y-6">
                <h1 className="pt-24 text-5xl lg:text-6xl font-bold text-custom-medium-gray leading-tight text-center space-y-6">
                  <p>Strategize</p>
                  <p>Optimize</p>
                  <p>Realize</p>
                </h1>
                <p className="pt-10 text-md font-thin text-custom-medium-gray leading-relaxed text-center">
                  Must have solutions for your business...
                </p>
                <div className="flex justify-center gap-4">
                  {isAuthenticated && hasSubmittedInfo ? (
                    <Button 
                      onClick={handleDashboard}
                      size="lg" 
                      className="text-custom-medium-gray font-light bg-custom-dark-maroon hover:bg-custom-deep-maroon text-white px-8 py-3 text-lg rounded-full hover:scale-105 transition-transform duration-300"
                    >
                      Dashboard
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleGetStarted}
                      size="lg" 
                      className="text-custom-medium-gray font-light bg-custom-dark-maroon hover:bg-custom-deep-maroon text-white px-8 py-3 text-lg rounded-full hover:scale-105 transition-transform duration-300"
                    >
                      Get Started
                    </Button>
                  )}
                  {isAuthenticated && (
                    <Button 
                      onClick={logout}
                      variant="outline"
                      size="lg" 
                      className="px-8 py-3 text-lg rounded-full hover:scale-105 transition-transform duration-300"
                    >
                      Logout
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 shadow-lg hover:scale-105 transition-transform duration-300">
                  <h2 className="text-center text-custom-medium-gray font-semibold border-b-[1px] mb-2">Business Law</h2>
                  <p className="text-center text-custom-medium-gray font-thin">Navigate legal complexities with our expert guidance.</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 shadow-lg hover:scale-105 transition-transform duration-300">
                  <h2 className="text-center text-custom-medium-gray font-semibold border-b-[1px] mb-2">Business Formation</h2>
                  <p className="text-center text-custom-medium-gray font-thin">Let us handle all the registration proceedings and required licensing proceedings.</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 shadow-lg hover:scale-105 transition-transform duration-300">
                  <h2 className="text-center text-custom-medium-gray font-semibold border-b-[1px] mb-2">Tax Submission</h2>
                  <p className="text-center text-custom-medium-gray font-thin">Optimize tax calculations and submissions efficiently.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />

      <BusinessFormationForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)}
        onSubmitted={handleFormSubmitted}
      />

      <PricingPackages 
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
      />
    </>
  );
};