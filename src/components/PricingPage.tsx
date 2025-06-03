import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('your_publishable_key');

interface Package {
  id: string;
  name: string;
  price: number;
  processing_time: string;
  features: string[];
}

export const PricingPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchPackages = async () => {
      const { data, error } = await supabase
        .from('packages')
        .select('*');

      if (error) {
        toast({
          title: "Error",
          description: "Failed to load packages. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setPackages(data);
    };

    fetchPackages();
  }, [toast]);

  const handlePayment = async (packageId: string, isExpress: boolean) => {
    setIsLoading(true);
    
    try {
      const registrationData = JSON.parse(sessionStorage.getItem('registrationData') || '{}');
      
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: registrationData.email,
        password: registrationData.password,
      });

      if (authError) throw authError;

      // Create business profile
      const { data: profileData, error: profileError } = await supabase
        .from('business_profiles')
        .insert([
          {
            user_id: authData.user?.id,
            ...registrationData,
          }
        ])
        .select()
        .single();

      if (profileError) throw profileError;

      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            business_profile_id: profileData.id,
            package_id: packageId,
            status: 'submitted',
            payment_status: 'pending',
          }
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      // Show success message
      toast({
        title: "Registration Successful",
        description: isExpress 
          ? "We will contact you within 5 business hours" 
          : "We will contact you within 5 business days",
      });

      // Clear session storage
      sessionStorage.removeItem('registrationData');

      // Navigate to dashboard
      navigate('/dashboard');

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process registration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-3xl font-bold text-center text-custom-dark-maroon mb-8">
        Choose Your Package
      </h2>

      <div className="grid md:grid-cols-2 gap-8">
        {packages.map((pkg) => (
          <div key={pkg.id} className="border rounded-lg p-6 shadow-md">
            <h3 className="text-xl font-semibold mb-2">{pkg.name}</h3>
            <p className="text-2xl font-bold text-custom-dark-maroon mb-4">
              ${pkg.price}
            </p>
            <p className="text-gray-600 mb-4">
              Processing time: {pkg.processing_time}
            </p>
            <ul className="mb-6 space-y-2">
              {pkg.features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              onClick={() => handlePayment(pkg.id, pkg.processing_time.includes('5 business hours'))}
              disabled={isLoading}
              className="w-full bg-custom-dark-maroon hover:bg-custom-deep-maroon text-white"
            >
              {isLoading ? 'Processing...' : 'Select Package'}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};