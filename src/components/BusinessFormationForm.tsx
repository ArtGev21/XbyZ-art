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
import { supabase } from '@/integrations/supabase/client';

interface Member {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  position: string;
}

interface BusinessFormData {
  // Business Information
  businessName: string;
  businessDescription: string;
  businessAddress: string;
  businessCity: string;
  businessState: string;
  businessZipCode: string;
  businessEmail: string;
  businessPhone: string;
  businessType: string;
  
  // Business Owner Information
  ownerName: string;
  ownerPhone: string;
  ownerAddress: string;
  ownerEmail: string;
  ownerSsnItin: string;
  
  // Members
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
  const [newMember, setNewMember] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    position: ''
  });
  
  const [formData, setFormData] = useState<BusinessFormData>({
    // Business Information
    businessName: '',
    businessDescription: '',
    businessAddress: '',
    businessCity: '',
    businessState: 'CA',
    businessZipCode: '',
    businessEmail: '',
    businessPhone: '',
    businessType: '',
    
    // Business Owner Information
    ownerName: '',
    ownerPhone: '',
    ownerAddress: '',
    ownerEmail: '',
    ownerSsnItin: '',
    
    // Members
    members: []
  });

  const handleAddMember = () => {
    if (!newMember.name || !newMember.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in at least the name and email for the member.",
        variant: "destructive",
      });
      return;
    }

    if (formData.members.length >= 3) {
      toast({
        title: "Maximum Members Reached",
        description: "You can only add up to 3 team members.",
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
      phone: '',
      email: '',
      address: '',
      position: ''
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

  const validateForm = () => {
    // Business Information Validation
    if (!formData.businessName.trim()) {
      toast({
        title: "Missing Information",
        description: "Business name is required.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.businessAddress.trim()) {
      toast({
        title: "Missing Information",
        description: "Business address is required.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.businessCity.trim()) {
      toast({
        title: "Missing Information",
        description: "Business city is required.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.businessZipCode.trim()) {
      toast({
        title: "Missing Information",
        description: "Business ZIP code is required.",
        variant: "destructive",
      });
      return false;
    }

    if (!validateZipCode(formData.businessZipCode)) {
      toast({
        title: "Invalid ZIP Code",
        description: "Please enter a valid California ZIP code.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.businessEmail.trim()) {
      toast({
        title: "Missing Information",
        description: "Business email is required.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.businessPhone.trim()) {
      toast({
        title: "Missing Information",
        description: "Business phone number is required.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.businessType) {
      toast({
        title: "Missing Information",
        description: "Please select a business type.",
        variant: "destructive",
      });
      return false;
    }

    // Business Owner Information Validation
    if (!formData.ownerName.trim()) {
      toast({
        title: "Missing Information",
        description: "Business owner name is required.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.ownerPhone.trim()) {
      toast({
        title: "Missing Information",
        description: "Business owner phone number is required.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.ownerAddress.trim()) {
      toast({
        title: "Missing Information",
        description: "Business owner address is required.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.ownerEmail.trim()) {
      toast({
        title: "Missing Information",
        description: "Business owner email is required.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Prepare application data for database
      const applicationData = {
        // Business Information
        business_name: formData.businessName,
        business_description: formData.businessDescription || null,
        business_address: formData.businessAddress,
        business_city: formData.businessCity,
        business_state: formData.businessState,
        business_zip_code: formData.businessZipCode,
        business_email: formData.businessEmail,
        business_phone: formData.businessPhone,
        business_type: formData.businessType,
        
        // Business Owner Information
        owner_name: formData.ownerName,
        owner_phone: formData.ownerPhone,
        owner_address: formData.ownerAddress,
        owner_email: formData.ownerEmail,
        owner_ssn_itin: formData.ownerSsnItin || null,
        
        // Member Information (up to 3 members)
        member1_name: formData.members[0]?.name || null,
        member1_phone: formData.members[0]?.phone || null,
        member1_email: formData.members[0]?.email || null,
        member1_address: formData.members[0]?.address || null,
        member1_position: formData.members[0]?.position || null,
        
        member2_name: formData.members[1]?.name || null,
        member2_phone: formData.members[1]?.phone || null,
        member2_email: formData.members[1]?.email || null,
        member2_address: formData.members[1]?.address || null,
        member2_position: formData.members[1]?.position || null,
        
        member3_name: formData.members[2]?.name || null,
        member3_phone: formData.members[2]?.phone || null,
        member3_email: formData.members[2]?.email || null,
        member3_address: formData.members[2]?.address || null,
        member3_position: formData.members[2]?.position || null,
        
        status: 'submitted'
      };

      // Insert into applications table
      const { data, error } = await supabase
        .from('applications')
        .insert([applicationData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Store form data in session storage for PricingPackages component
      const businessFormDataForPricing = {
        businessName: formData.businessName,
        businessType: formData.businessType,
        businessAddress: formData.businessAddress,
        city: formData.businessCity,
        state: formData.businessState,
        zipCode: formData.businessZipCode,
        phoneNumber: formData.businessPhone,
        businessEmail: formData.businessEmail,
        businessDescription: formData.businessDescription,
        ownerName: formData.ownerName,
        ownerPhone: formData.ownerPhone,
        ownerAddress: formData.ownerAddress,
        ownerEmail: formData.ownerEmail,
        ssnItin: formData.ownerSsnItin,
        members: formData.members
      };

      sessionStorage.setItem('businessFormData', JSON.stringify(businessFormDataForPricing));

      toast({
        title: "Application Submitted Successfully!",
        description: "Your business formation application has been submitted for review.",
      });

      // Store application data for potential future use
      sessionStorage.setItem('submittedApplication', JSON.stringify(data));

      // Close the form and trigger the callback
      onClose();
      if (onSubmitted) {
        onSubmitted();
      }
      
    } catch (error: any) {
      console.error('Error submitting application:', error);
      
      let errorMessage = "There was an error submitting your application. Please try again.";
      
      if (error.code === '23505') {
        if (error.message.includes('business_email')) {
          errorMessage = "This business email is already registered. Please use a different email address.";
        } else if (error.message.includes('owner_email')) {
          errorMessage = "This owner email is already registered. Please use a different email address.";
        }
      }
      
      toast({
        title: "Submission Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setShowMemberForm(false);
    setNewMember({
      name: '',
      phone: '',
      email: '',
      address: '',
      position: ''
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-4xl h-[90dvh] sm:h-auto sm:max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-custom-dark-maroon">Business Formation Application</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Business Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-custom-rich-black">Business Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                  placeholder="Enter your business name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="businessType">Business Type *</Label>
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
                    <RadioGroupItem value="Partnership" id="partnership" />
                    <Label htmlFor="partnership">Partnership</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Sole Proprietorship" id="sole" />
                    <Label htmlFor="sole">Sole Proprietorship</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <div>
              <Label htmlFor="businessDescription">Business Description</Label>
              <Textarea
                id="businessDescription"
                placeholder="Describe what your business does"
                value={formData.businessDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, businessDescription: e.target.value }))}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="businessAddress">Business Address * (California Only)</Label>
              <Input
                id="businessAddress"
                value={formData.businessAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, businessAddress: e.target.value }))}
                placeholder="Enter your California business address"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="businessCity">City *</Label>
                <Input
                  id="businessCity"
                  value={formData.businessCity}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessCity: e.target.value }))}
                  placeholder="City"
                  required
                />
              </div>

              <div>
                <Label htmlFor="businessState">State *</Label>
                <Input
                  id="businessState"
                  value={formData.businessState}
                  readOnly
                  className="bg-gray-100"
                  required
                />
              </div>

              <div>
                <Label htmlFor="businessZipCode">ZIP Code *</Label>
                <Input
                  id="businessZipCode"
                  value={formData.businessZipCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessZipCode: e.target.value }))}
                  placeholder="ZIP Code"
                  pattern="9[0-9]{4}"
                  title="Please enter a valid California ZIP code"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="businessEmail">Business Email *</Label>
                <Input
                  id="businessEmail"
                  type="email"
                  value={formData.businessEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessEmail: e.target.value }))}
                  placeholder="business@example.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="businessPhone">Business Phone *</Label>
                <Input
                  id="businessPhone"
                  type="tel"
                  value={formData.businessPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessPhone: e.target.value }))}
                  placeholder="(555) 123-4567"
                  required
                />
              </div>
            </div>
          </div>

          {/* Business Owner Information Section */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-semibold text-custom-rich-black">Business Owner Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ownerName">Owner Name *</Label>
                <Input
                  id="ownerName"
                  placeholder="Full name as it appears on ID"
                  value={formData.ownerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, ownerName: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="ownerPhone">Owner Phone *</Label>
                <Input
                  id="ownerPhone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formData.ownerPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, ownerPhone: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="ownerAddress">Owner Address *</Label>
              <Input
                id="ownerAddress"
                placeholder="Street, City, State and ZIP"
                value={formData.ownerAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, ownerAddress: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ownerEmail">Owner Email *</Label>
                <Input
                  id="ownerEmail"
                  placeholder="owner@example.com"
                  type="email"
                  value={formData.ownerEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, ownerEmail: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="ownerSsnItin">SSN or ITIN (Optional)</Label>
                <Input
                  id="ownerSsnItin"
                  placeholder="123-45-6789"
                  value={formData.ownerSsnItin}
                  onChange={(e) => setFormData(prev => ({ ...prev, ownerSsnItin: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Team Members Section */}
          <div className="border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-md font-semibold text-custom-rich-black">Team Members (Optional - Max 3)</h4>
              {formData.members.length < 3 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowMemberForm(true)}
                  className="hover:bg-custom-dark-maroon hover:text-white"
                >
                  Add Member
                </Button>
              )}
            </div>

            {/* Display existing members */}
            {formData.members.length > 0 && (
              <div className="space-y-3 mb-4">
                {formData.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                    <div className="flex-1">
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-gray-600">{member.email}</p>
                      {member.phone && <p className="text-sm text-gray-600">Phone: {member.phone}</p>}
                      {member.position && <p className="text-sm text-gray-600">Position: {member.position}</p>}
                      {member.address && <p className="text-sm text-gray-600">Address: {member.address}</p>}
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
                <h5 className="font-medium text-gray-900">Add Team Member</h5>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="memberName">Name *</Label>
                    <Input
                      id="memberName"
                      value={newMember.name}
                      onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Member's full name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="memberPosition">Position</Label>
                    <Input
                      id="memberPosition"
                      value={newMember.position}
                      onChange={(e) => setNewMember(prev => ({ ...prev, position: e.target.value }))}
                      placeholder="Job title or role"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="memberPhone">Phone</Label>
                    <Input
                      id="memberPhone"
                      type="tel"
                      value={newMember.phone}
                      onChange={(e) => setNewMember(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div>
                    <Label htmlFor="memberEmail">Email *</Label>
                    <Input
                      id="memberEmail"
                      type="email"
                      value={newMember.email}
                      onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="member@example.com"
                    />
                  </div>
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

          {/* Submit Section */}
          <div className="flex gap-4 pt-6 border-t">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading} 
              className="flex-1 bg-custom-dark-maroon hover:bg-custom-deep-maroon"
            >
              {isLoading ? 'Submitting Application...' : 'Submit Application'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};