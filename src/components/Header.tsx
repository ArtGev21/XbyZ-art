import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { BusinessFormationForm } from "@/components/BusinessFormationForm";
import { AuthModal } from "@/components/AuthModal";
import { PricingPackages } from "@/components/PricingPackages";
import { useNavigate, useLocation } from "react-router-dom";

export const Header = () => {
  const { isAuthenticated, logout, loading, isAdmin } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [hasSubmittedInfo, setHasSubmittedInfo] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if user has submitted information
    const dashboardData = localStorage.getItem('dashboardData');
    setHasSubmittedInfo(!!dashboardData);
  }, [isAuthenticated]);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      // Check if user is admin and redirect accordingly
      if (isAdmin) {
        navigate('/admin');
      } else if (hasSubmittedInfo) {
        navigate('/dashboard');
      } else {
        setIsFormOpen(true);
      }
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const handleFormSubmitted = () => {
    setIsFormOpen(false);
    setIsPricingOpen(true);
  };

  const handleNavClick = (sectionId: string) => {
    // Close mobile menu
    setIsMenuOpen(false);
    
    // If we're not on the home page, navigate to home first
    if (location.pathname !== '/') {
      navigate('/');
      // Wait for navigation to complete, then scroll to section
      setTimeout(() => {
        const section = document.getElementById(sectionId);
        if (section) {
          section.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      // We're already on home page, just scroll to section
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading) {
    return (
      <section className="relative bg-gradient-to-r from-gray-50 to-gray-100 py-20 min-h-screen flex items-center justify-center">
        <div className="text-custom-dark-maroon text-xl">Loading...</div>
      </section>
    );
  }

  // Determine button text based on user type and status
  const getButtonText = () => {
    if (!isAuthenticated) return 'Get Started';
    if (isAdmin) return 'Admin Dashboard';
    if (hasSubmittedInfo) return 'Dashboard';
    return 'Get Started';
  };

  return (
    <header 
      className={`fixed w-full z-50 transition-colors duration-300 ${
        isScrolled
          ? 'bg-white shadow-md text-custom-dark-maroon' 
          : 'bg-white/50 text-custom-dark-maroon backdrop-blur-md'
      }`} 
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button 
              onClick={handleLogoClick}  
              className="flex items-center focus:outline-2 focus:outline-offset-2 focus:outline-custom-dark-maroon" 
              aria-label="Home"
            >
              <img 
                src="Logo-cropped.png" 
                alt="Company Logo" 
                className="h-20 w-auto p-4 pt-6"
              />
            </button>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8" role="navigation" aria-label="Main navigation">
            <button 
              onClick={() => handleNavClick('about')} 
              className="hover:text-custom-medium-gray transition-colors duration-300 focus:outline-2 focus:outline-offset-2 focus:outline-custom-dark-maroon"
            >
              About
            </button>
            <button 
              onClick={() => handleNavClick('services')} 
              className="hover:text-custom-medium-gray transition-colors duration-300 focus:outline-2 focus:outline-offset-2 focus:outline-custom-dark-maroon"
            >
              Services
            </button>
            <button 
              onClick={() => handleNavClick('partnerships')} 
              className="hover:text-custom-medium-gray transition-colors duration-300 focus:outline-2 focus:outline-offset-2 focus:outline-custom-dark-maroon"
            >
              Partnerships
            </button>
            <button 
              onClick={() => handleNavClick('contact')} 
              className="hover:text-custom-medium-gray transition-colors duration-300 focus:outline-2 focus:outline-offset-2 focus:outline-custom-dark-maroon"
            >
              Contact
            </button>
            
            <Button 
              onClick={handleGetStarted}
              size="lg" 
              className="text-custom-medium-gray font-light bg-custom-dark-maroon hover:bg-custom-deep-maroon text-white px-4 py-2 text-sm rounded-full hover:scale-105 transition-transform duration-300"
            >
              {getButtonText()}
            </Button>
            
            {isAuthenticated && (
              <Button 
                onClick={logout}
                variant="outline"
                size="lg" 
                className="px-4 py-2 text-sm rounded-full hover:scale-105 hover:bg-white/60 hover:text-custom-dark-maroon transition-transform duration-300"
              >
                Logout
              </Button>
            )}
          </nav>

          <div className="md:hidden flex items-center space-x-2">
            <Button 
              onClick={handleGetStarted}
              size="sm"
              className="text-custom-medium-gray font-light bg-custom-dark-maroon hover:bg-custom-deep-maroon text-white px-3 py-1 text-xs rounded-full hover:scale-105 transition-transform duration-300"
            >
              {getButtonText()}
            </Button>
            {isAuthenticated && (
              <Button 
                onClick={logout}
                variant="outline"
                size="sm"
                className="px-3 py-1 text-xs rounded-full hover:scale-105 hover:bg-white/60 hover:text-custom-dark-maroon transition-transform duration-300"
              >
                Logout
              </Button>
            )}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md focus:outline-2 focus:outline-offset-2 focus:outline-custom-dark-maroon transition-transform duration-300 hover:scale-110"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6 transition-transform duration-300 rotate-90" />
              ) : (
                <Menu className="h-6 w-6 transition-transform duration-300" />
              )}
            </button>
          </div>
        </div>

        {/* Animated Mobile Menu */}
        <div
          id="mobile-menu"
          className={`md:hidden overflow-hidden transition-all duration-700 ease-custom ${
            isMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-2 pt-2 pb-4 space-y-2 border-t">
            <button
              onClick={() => handleNavClick('about')}
              className={`block w-full px-4 py-3 text-left rounded-md transition-all duration-500 ${
                isMenuOpen ? 'translate-x-0' : '-translate-x-full'
              } hover:bg-white/50 focus:outline-2 focus:outline-offset-2 focus:outline-custom-dark-maroon`}
            >
              About
            </button>
            <button
              onClick={() => handleNavClick('services')}
              className={`block w-full px-4 py-3 text-left rounded-md transition-all duration-500 delay-100 ${
                isMenuOpen ? 'translate-x-0' : '-translate-x-full'
              } hover:bg-white/50 focus:outline-2 focus:outline-offset-2 focus:outline-custom-dark-maroon`}
            >
              Services
            </button>
            <button
              onClick={() => handleNavClick('partnerships')}
              className={`block w-full px-4 py-3 text-left rounded-md transition-all duration-500 delay-200 ${
                isMenuOpen ? 'translate-x-0' : '-translate-x-full'
              } hover:bg-white/50 focus:outline-2 focus:outline-offset-2 focus:outline-custom-dark-maroon`}
            >
              Partnerships
            </button>
            <button
              onClick={() => handleNavClick('contact')}
              className={`block w-full px-4 py-3 text-left rounded-md transition-all duration-500 delay-300 ${ 
                isMenuOpen ? 'translate-x-0' : '-translate-x-full'
              } hover:bg-white/50 focus:outline-2 focus:outline-offset-2 focus:outline-custom-dark-maroon`}
            >
              Contact
            </button>
            {isAuthenticated && (
              <button
                onClick={logout}
                className={`block w-full px-4 py-3 text-left rounded-md transition-all duration-500 delay-400 ${ 
                  isMenuOpen ? 'translate-x-0' : '-translate-x-full'
                } hover:bg-white/50 focus:outline-2 focus:outline-offset-2 focus:outline-custom-dark-maroon`}
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
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
    </header>
  );
};