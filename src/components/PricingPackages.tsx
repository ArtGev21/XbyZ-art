
import React from 'react';
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface PricingPackagesProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PricingPackages = ({ isOpen, onClose }: PricingPackagesProps) => {
  if (!isOpen) return null;

  const packages = [
    {
      name: "Basic",
      price: "$299",
      description: "Perfect for getting started",
      features: [
        "Business Registration",
        "Basic Legal Documents",
        "Email Support",
        "1 Year Registered Agent"
      ]
    },
    {
      name: "Professional",
      price: "$599",
      description: "Most popular choice",
      features: [
        "Everything in Basic",
        "EIN Number",
        "Operating Agreement",
        "Phone Support",
        "2 Years Registered Agent",
        "Banking Assistance"
      ],
      popular: true
    },
    {
      name: "Premium",
      price: "$999",
      description: "Complete business package",
      features: [
        "Everything in Professional",
        "Business License Research",
        "Trademark Search",
        "Priority Support",
        "3 Years Registered Agent",
        "Tax Consultation"
      ]
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-custom-dark-maroon mb-4">
              Choose Your Package
            </h2>
            <p className="text-gray-600">
              Select the perfect plan to get your business started
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {packages.map((pkg, index) => (
              <div
                key={index}
                className={`relative rounded-lg border-2 p-6 ${
                  pkg.popular 
                    ? 'border-custom-dark-maroon bg-custom-dark-maroon/5' 
                    : 'border-gray-200'
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-custom-dark-maroon text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
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
                  className={`w-full ${
                    pkg.popular 
                      ? 'bg-custom-dark-maroon hover:bg-custom-deep-maroon' 
                      : 'bg-gray-800 hover:bg-gray-900'
                  }`}
                >
                  Get Started
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
