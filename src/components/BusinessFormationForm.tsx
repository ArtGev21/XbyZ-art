import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";
import { Loader } from '@googlemaps/js-api-loader';

interface Member {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
}

interface BusinessFormData {
  businessName: string;
  companyInfo: string;
  businessAddress: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  businessEmail: string;
  phoneNumber: string;
  ownerName: string;
  ownerAddress: string;
  ssnItin: string;
  ownerEmail: string;
  businessType: string;
  businessDescription: string;
  members: Member[];
}

interface BusinessFormationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

export const BusinessFormationForm = ({ isOpen, onClose, onSubmitted }: BusinessFormationFormProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [addressInput, setAddressInput] = useState<google.maps.places.Autocomplete | null>(null);
  const [newMember, setNewMember] = useState({
    name: '',
    address: '',
    phone: '',
    email: ''
  });
  
  const [formData, setFormData] = useState<BusinessFormData>({
    businessName: '',
    companyInfo: '',
    businessAddress: '',
    addressLine2: '',
    city: '',
    state: 'CA',
    zipCode: '',
    businessEmail: '',
    phoneNumber: '',
    ownerName: '',
    ownerAddress: '',
    ssnItin: '',
    ownerEmail: '',
    businessType: '',
    businessDescription: '',
    members: []
  });

  useEffect(() => {
    const loader = new Loader({
      apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
      version: "weekly",
      libraries: ["places"]
    });

    loader.load().then(() => {
      const input = document.getElementById('businessAddress') as HTMLInputElement;
      const autocomplete = new google.maps.places.Autocomplete(input, {
        componentRestrictions: { country: 'us' },
        fields: ['address_components']
      });

      setAddressInput(autocomplete);

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.address_components) {
          let zipCode = '';
          let city = '';
          let state = '';

          place.address_components.forEach(component => {
            if (component.types.includes('postal_code')) {
              zipCode = component.long_name;
            }
            if (component.types.includes('locality')) {
              city = component.long_name;
            }
            if (component.types.includes('administrative_area_level_1')) {
              state = component.short_name;
            }
          });

          if (state !== 'CA') {
            toast({
              title: "Invalid Address",
              description: "Please enter a California address only.",
              variant: "destructive",
            });
            setFormData(prev => ({
              ...prev,
              businessAddress: '',
              city: '',
              state: 'CA',
              zipCode: ''
            }));
            return;
          }

          setFormData(prev => ({
            ...prev,
            businessAddress: input.value,
            city,
            state,
            zipCode
          }));
        }
      });
    });
  }, [toast]);

  const handleAddMember = () => {
    if (!newMember.name || !newMember.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in at least the name and email for the member.",
        variant: "destructive",
      });
      return;
    }

    const member: Member = {
      id: Date.now().toString(),
      ...newMember
    };

    setFormData(prev => ({
      ...prev,
      members: [...prev.members, member]
    }));

    setNewMember({
      name: '',
      address: '',
      phone: '',
      email: ''
    });

    setShowMemberForm(false);
  };

  const handleRemoveMember = (memberId: string) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.filter(member => member.id !== memberId)
    }));
  };

  const validateZipCode = (zipCode: string) => {
    // California ZIP codes range from 90001 to 96162
    const zipNumber = parseInt(zipCode, 10);
    return zipNumber >= 90001 && zipNumber <= 96162;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!validateZipCode(formData.zipCode)) {
        toast({
          title: "Invalid ZIP Code",
          description: "Please enter a valid California ZIP code.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Store form data in session storage
      sessionStorage.setItem('businessFormData', JSON.stringify(formData));
      
      // Navigate to pricing page
      navigate('/pricing');
      
    } catch (error) {
      toast({
        title: "Submission Error",
        description: "There was an error submitting your form. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      onClose();
      onSubmitted?.();
    }
  };

  const handleClose = () => {
    setShowMemberForm(false);
    setNewMember({
      name: '',
      address: '',
      phone: '',
      email: ''
    });
    setFormData({
      businessName: '',
      companyInfo: '',
      businessAddress: '',
      addressLine2: '',
      city: '',
      state: 'CA',
      zipCode: '',
      businessEmail: '',
      phoneNumber: '',
      ownerName: '',
      ownerAddress: '',
      ssnItin: '',
      ownerEmail: '',
      businessType: '',
      businessDescription: '',
      members: []
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-4xl h-[90dvh] sm:h-auto sm:max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-custom-dark-maroon">Tell us About YOUR Business</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Business Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-custom-rich-black">Business Information</h3>

            <div>
              <Label htmlFor="businessName">Business Name*</Label>
              <Input
                id="businessName"
                value={formData.businessName}
                onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="businessDescription">Business Description</Label>
              <Textarea
                id="businessDescription"
                placeholder="Enter your business description"
                value={formData.businessDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, businessDescription: e.target.value }))}
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="businessAddress">Business Address* (California Only)</Label>
              <Input
                id="businessAddress"
                value={formData.businessAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, businessAddress: e.target.value }))}
                placeholder="Enter your California address"
                required
              />
            </div>

            <div>
              <Label htmlFor="addressLine2">Address Line 2</Label>
              <Input
                id="addressLine2"
                value={formData.addressLine2}
                onChange={(e) => setFormData(prev => ({ ...prev, addressLine2: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City*</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  required
                  readOnly
                />
              </div>

              <div>
                <Label htmlFor="state">State*</Label>
                <Input
                  id="state"
                  value={formData.state}
                  readOnly
                  required
                />
              </div>

              <div>
                <Label htmlFor="zipCode">ZIP Code*</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                  required
                  pattern="9[0-9]{4}"
                  title="Please enter a valid California ZIP code"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="businessEmail">Business Email*</Label>
              <Input
                id="businessEmail"
                type="email"
                value={formData.businessEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, businessEmail: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="phoneNumber">Phone Number*</Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                required
              />
            </div>

            {/* Members Section */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-md font-semibold text-custom-rich-black">Team Members</h4>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowMemberForm(true)}
                  className="hover:bg-custom-dark-maroon hover:text-white"
                >
                  Add a Member
                </Button>
              </div>

              {/* Display existing members */}
              {formData.members.length > 0 && (
                <div className="space-y-3 mb-4">
                  {formData.members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex-1">
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-gray-600">{member.email}</p>
                        {member.phone && <p className="text-sm text-gray-600">{member.phone}</p>}
                        {member.address && <p className="text-sm text-gray-600">{member.address}</p>}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add member form */}
              {showMemberForm && (
                <div className="border border-gray-200 rounded-md p-4 space-y-4 mb-4">
                  <h5 className="font-medium text-gray-900">Add New Member</h5>
                  
                  <div>
                    <Label htmlFor="memberName">Name*</Label>
                    <Input
                      id="memberName"
                      value={newMember.name}
                      onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Member's full name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="memberAddress">Address</Label>
                    <Input
                      id="memberAddress"
                      value={newMember.address}
                      onChange={(e) => setNewMember(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Member's address"
                    />
                  </div>

                  <div>
                    <Label htmlFor="memberPhone">Phone</Label>
                    <Input
                      id="memberPhone"
                      type="tel"
                      value={newMember.phone}
                      onChange={(e) => setNewMember(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Member's phone number"
                    />
                  </div>

                  <div>
                    <Label htmlFor="memberEmail">Email*</Label>
                    <Input
                      id="memberEmail"
                      type="email"
                      value={newMember.email}
                      onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Member's email address"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowMemberForm(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleAddMember}
                      className="flex-1 bg-custom-dark-maroon hover:bg-custom-deep-maroon"
                    >
                      Add Member
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Owner Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Owner Information</h3>
            
            <div>
              <Label htmlFor="ownerName">Owner/Organizer name*</Label>
              <Input
                id="ownerName"
                placeholder="First and Last names as it shows on ID"
                value={formData.ownerName}
                onChange={(e) => setFormData(prev => ({ ...prev, ownerName: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="ownerAddress">Owner/Organizer Address*</Label>
              <Input
                id="ownerAddress"
                placeholder="Street, City, State and ZIP"
                value={formData.ownerAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, ownerAddress: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="ssnItin">SSN or ITIN (if applicable)</Label>
              <Input
                id="ssnItin"
                placeholder="123-45-6789"
                value={formData.ssnItin}
                onChange={(e) => setFormData(prev => ({ ...prev, ssnItin: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="ownerEmail">Email*</Label>
              <Input
                id="ownerEmail"
                placeholder="email@example.com"
                type="email"
                value={formData.ownerEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, ownerEmail: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label>Business Type*</Label>
              <RadioGroup
                value={formData.businessType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, businessType: value }))}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="LLC" id="llc" />
                  <Label htmlFor="llc">Limited Liability Company (LLC)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Corporation" id="corporation" />
                  <Label htmlFor="corporation">Corporation</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Sole Proprietorship" id="sole" />
                  <Label htmlFor="sole">Sole Proprietorship</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Partnership" id="partnership" />
                  <Label htmlFor="partnership">Partnership</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1 hover:bg-custom-dark-maroon">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1 bg-custom-dark-maroon hover:bg-custom-deep-maroon">
              {isLoading ? 'Processing...' : 'Next'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};