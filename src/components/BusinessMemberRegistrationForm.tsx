import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { Calendar, User, Briefcase, Mail, Phone, Users, Shield, X, Save, Loader2 } from 'lucide-react';

interface BusinessMemberRegistrationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (member: any) => void;
}

interface FormData {
  full_name: string;
  position_title: string;
  department: string;
  employment_status: string;
  start_date: string;
  email: string;
  phone: string;
  reporting_manager: string;
  access_level: string;
}

interface FormErrors {
  [key: string]: string;
}

const DEPARTMENTS = [
  'Executive',
  'Management',
  'Operations',
  'Finance',
  'HR',
  'Sales/Marketing',
  'IT/Technical',
  'Other'
];

const EMPLOYMENT_STATUSES = [
  'Full-time',
  'Part-time',
  'Contractor',
  'Consultant'
];

const ACCESS_LEVELS = [
  'Admin',
  'Manager',
  'Standard',
  'Limited'
];

export const BusinessMemberRegistrationForm = ({ 
  isOpen, 
  onClose, 
  onSuccess 
}: BusinessMemberRegistrationFormProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  
  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    position_title: '',
    department: '',
    employment_status: '',
    start_date: '',
    email: '',
    phone: '',
    reporting_manager: '',
    access_level: ''
  });

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    // Basic phone validation - at least 10 digits
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone.trim());
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required field validation
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }

    if (!formData.position_title.trim()) {
      newErrors.position_title = 'Position/Role title is required';
    }

    if (!formData.department) {
      newErrors.department = 'Department is required';
    }

    if (!formData.employment_status) {
      newErrors.employment_status = 'Employment status is required';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    } else {
      // Validate start date is not in the future
      const startDate = new Date(formData.start_date);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      
      if (startDate > today) {
        newErrors.start_date = 'Start date cannot be in the future';
      }
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!formData.reporting_manager.trim()) {
      newErrors.reporting_manager = 'Reporting manager is required';
    }

    if (!formData.access_level) {
      newErrors.access_level = 'Access level is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please correct the errors in the form.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Use the custom function for validation and insertion
      const { data, error } = await supabase.rpc('insert_business_member', {
        p_full_name: formData.full_name.trim(),
        p_position_title: formData.position_title.trim(),
        p_department: formData.department,
        p_employment_status: formData.employment_status,
        p_start_date: formData.start_date,
        p_email: formData.email.trim(),
        p_phone: formData.phone.trim(),
        p_reporting_manager: formData.reporting_manager.trim(),
        p_access_level: formData.access_level
      });

      if (error) {
        console.error('Registration error:', error);
        
        // Handle specific error cases
        if (error.message.includes('Email address is already in use')) {
          setErrors({ email: 'This email address is already registered' });
          toast({
            title: "Email Already Exists",
            description: "This email address is already registered for another member.",
            variant: "destructive",
          });
        } else if (error.message.includes('Invalid email format')) {
          setErrors({ email: 'Please enter a valid email address' });
          toast({
            title: "Invalid Email",
            description: "Please enter a valid email address.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Registration Failed",
            description: error.message || "Failed to register business member. Please try again.",
            variant: "destructive",
          });
        }
        return;
      }

      toast({
        title: "Member Registered Successfully!",
        description: `${formData.full_name} has been added to your business members.`,
      });

      // Reset form
      setFormData({
        full_name: '',
        position_title: '',
        department: '',
        employment_status: '',
        start_date: '',
        email: '',
        phone: '',
        reporting_manager: '',
        access_level: ''
      });

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(data);
      }

      // Close the form
      onClose();

    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Unexpected Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        full_name: '',
        position_title: '',
        department: '',
        employment_status: '',
        start_date: '',
        email: '',
        phone: '',
        reporting_manager: '',
        access_level: ''
      });
      setErrors({});
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-custom-dark-maroon flex items-center justify-center space-x-2">
            <Users className="w-6 h-6" />
            <span>Register Business Member</span>
          </DialogTitle>
          <p className="text-center text-gray-600 mt-2">
            Add a new member to your business team with their role and access permissions.
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Personal Information</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  placeholder="Enter full name"
                  className={errors.full_name ? 'border-red-500' : ''}
                  disabled={isLoading}
                />
                {errors.full_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.full_name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter email address"
                    className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter phone number"
                    className={`pl-10 ${errors.phone ? 'border-red-500' : ''}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                )}
              </div>

              <div>
                <Label htmlFor="start_date">Start Date *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                    className={`pl-10 ${errors.start_date ? 'border-red-500' : ''}`}
                    disabled={isLoading}
                    max={new Date().toISOString().split('T')[0]} // Prevent future dates
                  />
                </div>
                {errors.start_date && (
                  <p className="text-red-500 text-sm mt-1">{errors.start_date}</p>
                )}
              </div>
            </div>
          </div>

          {/* Role Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Briefcase className="w-5 h-5" />
              <span>Role Information</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="position_title">Position/Role Title *</Label>
                <Input
                  id="position_title"
                  value={formData.position_title}
                  onChange={(e) => handleInputChange('position_title', e.target.value)}
                  placeholder="e.g., Senior Developer, Marketing Manager"
                  className={errors.position_title ? 'border-red-500' : ''}
                  disabled={isLoading}
                />
                {errors.position_title && (
                  <p className="text-red-500 text-sm mt-1">{errors.position_title}</p>
                )}
              </div>

              <div>
                <Label htmlFor="department">Department *</Label>
                <select
                  id="department"
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-dark-maroon focus-visible:ring-offset-2 ${errors.department ? 'border-red-500' : ''}`}
                  disabled={isLoading}
                >
                  <option value="">Select department</option>
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                {errors.department && (
                  <p className="text-red-500 text-sm mt-1">{errors.department}</p>
                )}
              </div>

              <div>
                <Label htmlFor="employment_status">Employment Status *</Label>
                <select
                  id="employment_status"
                  value={formData.employment_status}
                  onChange={(e) => handleInputChange('employment_status', e.target.value)}
                  className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-dark-maroon focus-visible:ring-offset-2 ${errors.employment_status ? 'border-red-500' : ''}`}
                  disabled={isLoading}
                >
                  <option value="">Select employment status</option>
                  {EMPLOYMENT_STATUSES.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                {errors.employment_status && (
                  <p className="text-red-500 text-sm mt-1">{errors.employment_status}</p>
                )}
              </div>

              <div>
                <Label htmlFor="reporting_manager">Reporting Manager *</Label>
                <Input
                  id="reporting_manager"
                  value={formData.reporting_manager}
                  onChange={(e) => handleInputChange('reporting_manager', e.target.value)}
                  placeholder="Enter reporting manager's name"
                  className={errors.reporting_manager ? 'border-red-500' : ''}
                  disabled={isLoading}
                />
                {errors.reporting_manager && (
                  <p className="text-red-500 text-sm mt-1">{errors.reporting_manager}</p>
                )}
              </div>
            </div>
          </div>

          {/* Access Level Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Access Permissions</span>
            </h3>
            
            <div>
              <Label htmlFor="access_level">Access Level *</Label>
              <select
                id="access_level"
                value={formData.access_level}
                onChange={(e) => handleInputChange('access_level', e.target.value)}
                className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-dark-maroon focus-visible:ring-offset-2 ${errors.access_level ? 'border-red-500' : ''}`}
                disabled={isLoading}
              >
                <option value="">Select access level</option>
                {ACCESS_LEVELS.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
              {errors.access_level && (
                <p className="text-red-500 text-sm mt-1">{errors.access_level}</p>
              )}
              
              <div className="mt-2 text-sm text-gray-600">
                <p><strong>Admin:</strong> Full system access and user management</p>
                <p><strong>Manager:</strong> Department-level access and team management</p>
                <p><strong>Standard:</strong> Regular user access to assigned features</p>
                <p><strong>Limited:</strong> Restricted access to specific functions only</p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-6 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose} 
              className="flex-1"
              disabled={isLoading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading} 
              className="flex-1 bg-custom-dark-maroon hover:bg-custom-deep-maroon"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Register Member
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};