import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from "@/contexts/AuthContext";

interface PricingPackagesProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PricingPackages = ({ isOpen, onClose }: PricingPackagesProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [businessType, setBusinessType] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Get business type from session storage
    const formData = sessionStorage.getItem('businessFormData');
    if (formData) {
      try {
        const parsedData = JSON.parse(formData);
        setBusinessType(parsedData.businessType || '');
      } catch (error) {
        console.error('Error parsing form data:', error);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getPackagesForType = () => {
    switch (businessType.toLowerCase()) {
      case 'llc':
        return [
          {
            name: "Express LLC",
            price: "$499",
            description: "Fast-track LLC formation",
            features: [
              "Same-day processing",
              "Priority support",
              "All standard features",
              "Express filing",
              "Response within 5 business hours"
            ],
            isExpress: true
          },
          {
            name: "Standard LLC",
            price: "$99",
            description: "Basic LLC formation",
            features: [
              "State filing",
              "Operating agreement",
              "Tax ID",
              "Basic support",
              "Response within 5 business days"
            ],
            isExpress: false
          }
        ];
      case 'corporation':
        return [
          {
            name: "Express Corporation",
            price: "$499",
            description: "Fast-track incorporation",
            features: [
              "Same-day processing",
              "Priority support",
              "All standard features",
              "Express filing",
              "Response within 5 business hours"
            ],
            isExpress: true
          },
          {
            name: "Standard Corporation",
            price: "$125",
            description: "Basic incorporation",
            features: [
              "State filing",
              "Bylaws",
              "Tax ID",
              "Basic support",
              "Response within 5 business days"
            ],
            isExpress: false
          }
        ];
      case 'partnership':
        return [
          {
            name: "Express Partnership",
            price: "$499",
            description: "Fast-track partnership formation",
            features: [
              "Same-day processing",
              "Priority support",
              "All standard features",
              "Express filing",
              "Response within 5 business hours"
            ],
            isExpress: true
          },
          {
            name: "Standard Partnership",
            price: "$99",
            description: "Basic partnership formation",
            features: [
              "State filing",
              "Partnership agreement",
              "Tax ID",
              "Basic support",
              "Response within 5 business days"
            ],
            isExpress: false
          }
        ];
      case 'sole proprietorship':
        return [
          {
            name: "DBA Registration",
            price: "$100",
            description: "DBA filing for different business name",
            features: [
              "DBA filing",
              "Name search",
              "Basic support",
              "Processing within 5-7 days",
              "Response within 5 business days"
            ],
            isExpress: false
          }
        ];
      default:
        return [];
    }
  };

  const handlePackageSelect = async (packageName: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Get form data from session storage
      const formData = sessionStorage.getItem('businessFormData');
      if (!formData) {
        throw new Error('No form data found');
      }

      const parsedFormData = JSON.parse(formData);

      // Create business profile
      const businessProfileData = {
        user_id: user.id,
        business_name: parsedFormData.businessName,
        business_type: parsedFormData.businessType.toLowerCase().replace(' ', '_'),
        address_line1: parsedFormData.businessAddress,
        address_line2: parsedFormData.addressLine2 || null,
        city: parsedFormData.city,
        state: parsedFormData.state,
        zip_code: parsedFormData.zipCode,
        phone: parsedFormData.phoneNumber,
        email: parsedFormData.businessEmail,
        tax_id: parsedFormData.ssnItin || null,
        description: parsedFormData.businessDescription || null,
        status: 'submitted'
      };

      const { data: businessProfile, error: profileError } = await supabase
        .from('business_profiles')
        .insert([businessProfileData])
        .select()
        .single();

      if (profileError) {
        throw profileError;
      }

      // Store additional data in localStorage for dashboard
      const dashboardData = {
        businessProfile: businessProfile,
        ownerInfo: {
          name: parsedFormData.ownerName,
          address: parsedFormData.ownerAddress,
          email: parsedFormData.ownerEmail,
          ssnItin: parsedFormData.ssnItin
        },
        members: parsedFormData.members || [],
        selectedPackage: packageName
      };

      localStorage.setItem('dashboardData', JSON.stringify(dashboardData));

      // Clear session storage
      sessionStorage.removeItem('businessFormData');

      // TODO: Implement payment processing here
      // const paymentResult = await processPayment(packageName, businessProfile.id);
      // if (!paymentResult.success) {
      //   throw new Error('Payment failed');
      // }

      toast({
        title: "Registration Successful",
        description: "Your business information has been saved successfully!",
      });

      // Navigate to dashboard
      navigate('/dashboard');

    } catch (error) {
      console.error('Error saving business profile:', error);
      toast({
        title: "Error",
        description: "Failed to save your information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const packages = getPackagesForType();

  if (packages.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-custom-dark-maroon mb-4">
              No Packages Available
            </h2>
            <p className="text-gray-600 mb-6">
              No packages found for the selected business type: {businessType}
            </p>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-custom-dark-maroon mb-4">
              {businessType === 'sole proprietorship' ? 'Available Package' : 'Choose Your Package'}
            </h2>
            <p className="text-gray-600">
              {businessType === 'sole proprietorship' 
                ? 'Registration package for your sole proprietorship'
                : `Select the perfect plan for your ${businessType?.toLowerCase().replace('_', ' ')}`
              }
            </p>
          </div>

          <div className={`grid grid-cols-1 ${packages.length > 1 ? 'md:grid-cols-2' : ''} gap-8 justify-items-center`}>
            {packages.map((pkg, index) => (
              <div
                key={index}
                className={`relative rounded-lg border-2 p-6 max-w-md w-full ${
                  pkg.isExpress 
                    ? 'border-custom-dark-maroon bg-custom-dark-maroon/5' 
                    : 'border-gray-200'
                }`}
              >
                {pkg.isExpress && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-custom-dark-maroon text-white px-4 py-1 rounded-full text-sm font-medium">
                      Express Service
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                  <div className="text-3xl font-bold text-custom-dark-maroon mb-2">
                    {pkg.price}
                  </div>
                  <p className="text-gray-600">{pkg.description}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {pkg.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  onClick={() => handlePackageSelect(pkg.name)}
                  disabled={isLoading}
                  className={`w-full ${
                    pkg.isExpress 
                      ? 'bg-custom-dark-maroon hover:bg-custom-deep-maroon' 
                      : 'bg-gray-800 hover:bg-gray-900'
                  }`}
                >
                  {isLoading ? 'Processing...' : 'Continue'}
                </Button>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};