import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BusinessFormationForm } from '@/components/BusinessFormationForm';
import { PricingPackages } from '@/components/PricingPackages';
import { 
  Building2, 
  User, 
  FileText, 
  Download, 
  Edit, 
  Save, 
  X,
  Users,
  Trash2,
  Phone,
  Mail,
  Briefcase,
  Check,
  Loader2,
  MapPin,
  Plus,
  FileCheck
} from 'lucide-react';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  profile_picture_url?: string;
  created_at: string;
  updated_at: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  position: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

interface BusinessProfile {
  id: string;
  user_id: string;
  business_name: string;
  business_type: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  email: string;
  tax_id?: string;
  description?: string;
  status: string;
  owner_phone?: string;
  created_at: string;
  updated_at: string;
}

interface DashboardData {
  businessProfile: any;
  ownerInfo: {
    name: string;
    address: string;
    email: string;
    ssnItin?: string;
  };
  members: Array<{
    id: string;
    name: string;x
    address: string;
    phone: string;
    email: string;
  }>;
  selectedPackage: string;
}

interface Document {
  id: string;
  name: string;
  status: 'pending' | 'ready' | 'completed';
  type: string;
  downloadUrl?: string;
}

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Profile state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [activeSection, setActiveSection] = useState('business');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState<Partial<UserProfile>>({});
  const [memberForms, setMemberForms] = useState<Record<string, Partial<TeamMember>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Business form state
  const [isEditingBusiness, setIsEditingBusiness] = useState(false);
  const [businessForm, setBusinessForm] = useState<any>({});
  
  // Form modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);

  // Mock documents for demonstration
  const [documents] = useState<Document[]>([
    {
      id: '1',
      name: 'Articles of Organization',
      status: 'pending',
      type: 'formation'
    },
    {
      id: '2',
      name: 'Operating Agreement',
      status: 'pending',
      type: 'agreement'
    },
    {
      id: '3',
      name: 'Tax ID (EIN) Certificate',
      status: 'pending',
      type: 'tax'
    },
    {
      id: '4',
      name: 'Compliance Calendar',
      status: 'ready',
      type: 'compliance',
      downloadUrl: '#'
    }
  ]);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    loadUserProfile();
    loadBusinessProfile();
    loadTeamMembers();
    
    // Set up real-time subscriptions
    const profileSubscription = supabase
      .channel('user_profiles_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'user_profiles', filter: `id=eq.${user.id}` },
        (payload) => {
          console.log('Profile updated:', payload);
          if (payload.eventType === 'UPDATE') {
            setUserProfile(payload.new as UserProfile);
          }
        }
      )
      .subscribe();

    const businessSubscription = supabase
      .channel('business_profiles_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'business_profiles', filter: `user_id=eq.${user.id}` },
        (payload) => {
          console.log('Business profile updated:', payload);
          if (payload.eventType === 'UPDATE') {
            setBusinessProfile(payload.new as BusinessProfile);
          }
        }
      )
      .subscribe();

    const teamSubscription = supabase
      .channel('team_members_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'team_members', filter: `user_id=eq.${user.id}` },
        (payload) => {
          console.log('Team member updated:', payload);
          loadTeamMembers(); // Reload team members on any change
        }
      )
      .subscribe();

    return () => {
      profileSubscription.unsubscribe();
      businessSubscription.unsubscribe();
      teamSubscription.unsubscribe();
    };
  }, [user, navigate]);

  const loadUserProfile = async () => {
    if (!user) return;

    try {
      // Check if profile exists using limit(1) to avoid PGRST116 error
      const { data: profiles, error } = await supabase
        .from('user_profiles')
        .select('id,full_name,email,phone,role,profile_picture_url,created_at,updated_at')
        .eq('id', user.id)
        .limit(1);

      if (error) throw error;

      let profile;
      
      if (profiles.length === 0) {
        // Profile doesn't exist, create one
        const newProfile = {
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          phone: '',
          role: 'Business Owner',
          profile_picture_url: user.user_metadata?.avatar_url || null
        };

        const { data: createdProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert([newProfile])
          .select('id,full_name,email,phone,role,profile_picture_url,created_at,updated_at')
          .single();

        if (createError) throw createError;
        profile = createdProfile;
      } else {
        profile = profiles[0];
      }

      setUserProfile(profile);
      setProfileForm(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
      toast({
        title: "Error",
        description: "Failed to load user profile.",
        variant: "destructive",
      });
    }
  };

  const loadBusinessProfile = async () => {
    if (!user) return;

    try {
      const { data: profiles, error } = await supabase
        .from('business_profiles')
        .select('id,user_id,business_name,business_type,address_line1,address_line2,city,state,zip_code,phone,email,tax_id,description,status,owner_phone,created_at,updated_at')
        .eq('user_id', user.id)
        .limit(1);

      if (error) throw error;

      if (profiles.length > 0) {
        const profile = profiles[0];
        setBusinessProfile(profile);
        setBusinessForm(profile);
      }
    } catch (error) {
      console.error('Error loading business profile:', error);
      toast({
        title: "Error",
        description: "Failed to load business profile.",
        variant: "destructive",
      });
    }
  };

  const loadTeamMembers = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('id,user_id,name,role,email,phone,position,status,created_at,updated_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('Loaded team members:', data); // Debug log
      setTeamMembers(data || []);
      
      // Initialize member forms
      const forms: Record<string, Partial<TeamMember>> = {};
      data?.forEach(member => {
        forms[member.id] = { ...member };
      });
      setMemberForms(forms);
    } catch (error) {
      console.error('Error loading team members:', error);
      toast({
        title: "Error",
        description: "Failed to load team members.",
        variant: "destructive",
      });
    }
  };

  const handleProfileSave = async () => {
    if (!user || !userProfile) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: profileForm.full_name,
          email: profileForm.email,
          phone: profileForm.phone,
          role: profileForm.role,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      setIsEditingProfile(false);
      setHasChanges(false);
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleMemberSave = async (memberId: string) => {
    if (!user) return;

    setIsSaving(true);
    try {
      const memberData = memberForms[memberId];
      const { error } = await supabase
        .from('team_members')
        .update({
          name: memberData.name,
          role: memberData.role,
          email: memberData.email,
          phone: memberData.phone,
          position: memberData.position,
          status: memberData.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId);

      if (error) throw error;

      setEditingMemberId(null);
      setHasChanges(false);
      toast({
        title: "Success",
        description: "Team member updated successfully!",
      });
    } catch (error) {
      console.error('Error updating team member:', error);
      toast({
        title: "Error",
        description: "Failed to update team member.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTeamMember = async () => {
    if (!user) return;

    const newMember = {
      user_id: user.id,
      name: 'New Team Member',
      role: 'Team Member',
      email: '',
      phone: '',
      position: 'Team Member',
      status: 'active' as const
    };

    try {
      const { data, error } = await supabase
        .from('team_members')
        .insert([newMember])
        .select('id,user_id,name,role,email,phone,position,status,created_at,updated_at')
        .single();

      if (error) throw error;

      setEditingMemberId(data.id);
      setMemberForms(prev => ({
        ...prev,
        [data.id]: { ...data }
      }));

      toast({
        title: "Success",
        description: "New team member added! Please edit their details.",
      });
    } catch (error) {
      console.error('Error adding team member:', error);
      toast({
        title: "Error",
        description: "Failed to add team member.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveTeamMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Team member removed successfully!",
      });
    } catch (error) {
      console.error('Error removing team member:', error);
      toast({
        title: "Error",
        description: "Failed to remove team member.",
        variant: "destructive",
      });
    }
  };

  const handleBusinessSave = async () => {
    if (!businessProfile?.id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('business_profiles')
        .update({
          business_name: businessForm.business_name,
          address_line1: businessForm.address_line1,
          address_line2: businessForm.address_line2,
          city: businessForm.city,
          zip_code: businessForm.zip_code,
          phone: businessForm.phone,
          email: businessForm.email,
          description: businessForm.description,
          owner_phone: businessForm.owner_phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', businessProfile.id);

      if (error) throw error;

      setBusinessProfile(prev => prev ? { ...prev, ...businessForm } : null);
      setIsEditingBusiness(false);
      toast({
        title: "Success",
        description: "Business information updated successfully!",
      });
    } catch (error) {
      console.error('Error updating business profile:', error);
      toast({
        title: "Error",
        description: "Failed to update business information.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmitted = () => {
    setIsFormOpen(false);
    setIsPricingOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'ready': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="pt-20 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-custom-dark-maroon" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Loading Dashboard...</h2>
            <p className="text-gray-600">Please wait while we load your information.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="pt-20 min-h-screen bg-gray-50 flex">
        {/* Left Sidebar */}
        <div className="w-80 bg-white shadow-lg border-r border-gray-200 flex flex-col">
          {/* User Profile Section */}
          <div className="p-6 border-b border-gray-200">
            <div className="text-center mb-4">
              <p className="text-lg text-custom-dark-maroon font-semibold">
                {userProfile.full_name}!
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={userProfile.profile_picture_url} alt={userProfile.full_name} />
                <AvatarFallback className="bg-custom-dark-maroon text-white text-lg">
                  {getInitials(userProfile.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{userProfile.full_name}</h2>
                <p className="text-sm text-gray-500">{userProfile.email}</p>
                <p className="text-xs text-gray-400">{userProfile.role}</p>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 p-4">
            <div className="space-y-2">
              <button
                onClick={() => setActiveSection('business')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeSection === 'business' 
                    ? 'bg-custom-dark-maroon text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Building2 className="w-5 h-5" />
                <span className="font-medium">Business Information</span>
              </button>
              
              <button
                onClick={() => setActiveSection('personal')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeSection === 'personal' 
                    ? 'bg-custom-dark-maroon text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <User className="w-5 h-5" />
                <span className="font-medium">Personal Information</span>
              </button>
              
              <button
                onClick={() => setActiveSection('documents')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeSection === 'documents' 
                    ? 'bg-custom-dark-maroon text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FileText className="w-5 h-5" />
                <span className="font-medium">Document Portal</span>
              </button>
            </div>
          </nav>

          {/* Submit Another Form Button */}
          <div className="p-4 border-t border-gray-200">
            <Button
              onClick={() => setIsFormOpen(true)}
              className="w-full bg-custom-dark-maroon hover:bg-custom-deep-maroon text-white"
            >
              <FileCheck className="w-4 h-4 mr-2" />
              Submit Another Form
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-8 overflow-y-auto">
          {/* Business Information Section */}
          {activeSection === 'business' && (
            <div className="max-w-4xl">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Business Information</h1>
                <p className="text-gray-600">Manage your business details and settings</p>
              </div>

              {businessProfile ? (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Business Details</CardTitle>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (isEditingBusiness) {
                          setBusinessForm(businessProfile);
                        }
                        setIsEditingBusiness(!isEditingBusiness);
                      }}
                    >
                      {isEditingBusiness ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                      {isEditingBusiness ? 'Cancel' : 'Edit'}
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {isEditingBusiness ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="business_name">Business Name</Label>
                          <Input
                            id="business_name"
                            value={businessForm.business_name || ''}
                            onChange={(e) => setBusinessForm(prev => ({ ...prev, business_name: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="business_type">Business Type</Label>
                          <Input
                            id="business_type"
                            value={businessForm.business_type || ''}
                            disabled
                            className="bg-gray-100"
                          />
                        </div>
                        <div>
                          <Label htmlFor="address_line1">Address Line 1</Label>
                          <Input
                            id="address_line1"
                            value={businessForm.address_line1 || ''}
                            onChange={(e) => setBusinessForm(prev => ({ ...prev, address_line1: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="address_line2">Address Line 2</Label>
                          <Input
                            id="address_line2"
                            value={businessForm.address_line2 || ''}
                            onChange={(e) => setBusinessForm(prev => ({ ...prev, address_line2: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            value={businessForm.city || ''}
                            onChange={(e) => setBusinessForm(prev => ({ ...prev, city: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="zip_code">ZIP Code</Label>
                          <Input
                            id="zip_code"
                            value={businessForm.zip_code || ''}
                            onChange={(e) => setBusinessForm(prev => ({ ...prev, zip_code: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Business Phone</Label>
                          <Input
                            id="phone"
                            value={businessForm.phone || ''}
                            onChange={(e) => setBusinessForm(prev => ({ ...prev, phone: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="owner_phone">Owner Phone</Label>
                          <Input
                            id="owner_phone"
                            value={businessForm.owner_phone || ''}
                            onChange={(e) => setBusinessForm(prev => ({ ...prev, owner_phone: e.target.value }))}
                            placeholder="Business owner's phone number"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={businessForm.email || ''}
                            onChange={(e) => setBusinessForm(prev => ({ ...prev, email: e.target.value }))}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={businessForm.description || ''}
                            onChange={(e) => setBusinessForm(prev => ({ ...prev, description: e.target.value }))}
                            rows={3}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Button 
                            onClick={handleBusinessSave} 
                            disabled={isLoading}
                            className="bg-custom-dark-maroon hover:bg-custom-deep-maroon"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            {isLoading ? 'Saving...' : 'Save Changes'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-center space-x-3">
                          <Building2 className="w-5 h-5 text-gray-400" />
                          <div>
                            <Label className="text-sm font-medium text-gray-500">Business Name</Label>
                            <p className="text-gray-900">{businessProfile.business_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Briefcase className="w-5 h-5 text-gray-400" />
                          <div>
                            <Label className="text-sm font-medium text-gray-500">Business Type</Label>
                            <p className="text-gray-900 capitalize">{businessProfile.business_type?.replace('_', ' ')}</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                          <div>
                            <Label className="text-sm font-medium text-gray-500">Address</Label>
                            <p className="text-gray-900">
                              {businessProfile.address_line1}
                              {businessProfile.address_line2 && <br />}
                              {businessProfile.address_line2}
                              <br />
                              {businessProfile.city}, {businessProfile.state} {businessProfile.zip_code}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <Phone className="w-5 h-5 text-gray-400 mt-1" />
                          <div>
                            <Label className="text-sm font-medium text-gray-500">Contact Information</Label>
                            <p className="text-gray-900">
                              Business: {businessProfile.phone}<br />
                              {businessProfile.owner_phone && (
                                <>Owner: {businessProfile.owner_phone}<br /></>
                              )}
                              Email: {businessProfile.email}
                            </p>
                          </div>
                        </div>
                        {businessProfile.description && (
                          <div className="md:col-span-2 flex items-start space-x-3">
                            <FileText className="w-5 h-5 text-gray-400 mt-1" />
                            <div>
                              <Label className="text-sm font-medium text-gray-500">Description</Label>
                              <p className="text-gray-900">{businessProfile.description}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Business Information</h3>
                      <p className="text-gray-600 mb-4">You haven't submitted any business information yet.</p>
                      <Button
                        onClick={() => setIsFormOpen(true)}
                        className="bg-custom-dark-maroon hover:bg-custom-deep-maroon"
                      >
                        <FileCheck className="w-4 h-4 mr-2" />
                        Submit Business Form
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Personal Information Section */}
          {activeSection === 'personal' && (
            <div className="max-w-4xl space-y-6">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Personal Information</h1>
                <p className="text-gray-600">Manage your personal details and team members</p>
              </div>

              {/* User Profile Information */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Your Profile</CardTitle>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (isEditingProfile) {
                        setProfileForm(userProfile);
                      }
                      setIsEditingProfile(!isEditingProfile);
                    }}
                  >
                    {isEditingProfile ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                    {isEditingProfile ? 'Cancel' : 'Edit'}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditingProfile ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="full_name">Full Name</Label>
                        <Input
                          id="full_name"
                          value={profileForm.full_name || ''}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileForm.email || ''}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={profileForm.phone || ''}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="role">Role</Label>
                        <Input
                          id="role"
                          value={profileForm.role || ''}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, role: e.target.value }))}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Button 
                          onClick={handleProfileSave}
                          disabled={isSaving}
                          className="bg-custom-dark-maroon hover:bg-custom-deep-maroon"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3">
                        <User className="w-5 h-5 text-gray-400" />
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Full Name</Label>
                          <p className="text-gray-900">{userProfile.full_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Email</Label>
                          <p className="text-gray-900">{userProfile.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Phone</Label>
                          <p className="text-gray-900">{userProfile.phone || 'Not provided'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Briefcase className="w-5 h-5 text-gray-400" />
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Role</Label>
                          <p className="text-gray-900">{userProfile.role}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Team Members Section */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Team Members ({teamMembers.length})</span>
                  </CardTitle>
                  <Button
                    onClick={handleAddTeamMember}
                    className="bg-custom-dark-maroon hover:bg-custom-deep-maroon"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Member
                  </Button>
                </CardHeader>
                <CardContent>
                  {teamMembers.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-medium text-gray-900 mb-2">No team members yet</h3>
                      <p className="text-gray-600 mb-6">Add team members to collaborate on your business projects.</p>
                      <Button
                        onClick={handleAddTeamMember}
                        className="bg-custom-dark-maroon hover:bg-custom-deep-maroon"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Team Member
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {teamMembers.map((member) => (
                        <div key={member.id} className="border rounded-lg p-6 bg-white">
                          {editingMemberId === member.id ? (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-medium text-gray-900">Edit Team Member</h4>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setMemberForms(prev => ({
                                        ...prev,
                                        [member.id]: { ...member }
                                      }));
                                      setEditingMemberId(null);
                                      setHasChanges(false);
                                    }}
                                    disabled={isSaving}
                                  >
                                    <X className="w-4 h-4 mr-1" />
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleMemberSave(member.id)}
                                    disabled={isSaving}
                                    className="bg-custom-dark-maroon hover:bg-custom-deep-maroon"
                                  >
                                    {isSaving ? (
                                      <>
                                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                        Saving...
                                      </>
                                    ) : (
                                      <>
                                        <Check className="w-4 h-4 mr-1" />
                                        Save
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor={`name-${member.id}`}>Name *</Label>
                                  <Input
                                    id={`name-${member.id}`}
                                    value={memberForms[member.id]?.name || ''}
                                    onChange={(e) => {
                                      setMemberForms(prev => ({
                                        ...prev,
                                        [member.id]: { ...prev[member.id], name: e.target.value }
                                      }));
                                      setHasChanges(true);
                                    }}
                                    placeholder="Enter full name"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`role-${member.id}`}>Role</Label>
                                  <Input
                                    id={`role-${member.id}`}
                                    value={memberForms[member.id]?.role || ''}
                                    onChange={(e) => {
                                      setMemberForms(prev => ({
                                        ...prev,
                                        [member.id]: { ...prev[member.id], role: e.target.value }
                                      }));
                                      setHasChanges(true);
                                    }}
                                    placeholder="Enter role/position"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`position-${member.id}`}>Position in Business</Label>
                                  <Input
                                    id={`position-${member.id}`}
                                    value={memberForms[member.id]?.position || ''}
                                    onChange={(e) => {
                                      setMemberForms(prev => ({
                                        ...prev,
                                        [member.id]: { ...prev[member.id], position: e.target.value }
                                      }));
                                      setHasChanges(true);
                                    }}
                                    placeholder="Enter business position"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`email-${member.id}`}>Email</Label>
                                  <Input
                                    id={`email-${member.id}`}
                                    type="email"
                                    value={memberForms[member.id]?.email || ''}
                                    onChange={(e) => {
                                      setMemberForms(prev => ({
                                        ...prev,
                                        [member.id]: { ...prev[member.id], email: e.target.value }
                                      }));
                                      setHasChanges(true);
                                    }}
                                    placeholder="Enter email address"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`phone-${member.id}`}>Phone</Label>
                                  <Input
                                    id={`phone-${member.id}`}
                                    type="tel"
                                    value={memberForms[member.id]?.phone || ''}
                                    onChange={(e) => {
                                      setMemberForms(prev => ({
                                        ...prev,
                                        [member.id]: { ...prev[member.id], phone: e.target.value }
                                      }));
                                      setHasChanges(true);
                                    }}
                                    placeholder="Enter phone number"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`status-${member.id}`}>Status</Label>
                                  <select
                                    id={`status-${member.id}`}
                                    value={memberForms[member.id]?.status || 'active'}
                                    onChange={(e) => {
                                      setMemberForms(prev => ({
                                        ...prev,
                                        [member.id]: { ...prev[member.id], status: e.target.value as 'active' | 'inactive' }
                                      }));
                                      setHasChanges(true);
                                    }}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                  >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <Avatar className="w-12 h-12">
                                  <AvatarFallback className="bg-custom-dark-maroon text-white">
                                    {getInitials(member.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h4 className="font-semibold text-gray-900 text-lg">{member.name}</h4>
                                  <p className="text-gray-600">{member.role}</p>
                                  {member.position && (
                                    <p className="text-sm text-gray-500">Position: {member.position}</p>
                                  )}
                                  <div className="flex items-center space-x-4 mt-2">
                                    {member.email && (
                                      <div className="flex items-center space-x-1">
                                        <Mail className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm text-gray-500">{member.email}</span>
                                      </div>
                                    )}
                                    {member.phone && (
                                      <div className="flex items-center space-x-1">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm text-gray-500">{member.phone}</span>
                                      </div>
                                    )}
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                                      {member.status}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingMemberId(member.id)}
                                >
                                  <Edit className="w-4 h-4 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveTeamMember(member.id)}
                                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Document Portal Section */}
          {activeSection === 'documents' && (
            <div className="max-w-4xl">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Portal</h1>
                <p className="text-gray-600">Track and download your business formation documents</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Your Documents</CardTitle>
                  <p className="text-sm text-gray-600">
                    Track the status of your business formation documents and download them when ready.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-6 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-gray-100 rounded-lg">
                            <FileText className="w-8 h-8 text-gray-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 text-lg">{doc.name}</h4>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(doc.status)}`}>
                              {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                            </span>
                          </div>
                        </div>
                        <div>
                          {doc.status === 'ready' && doc.downloadUrl ? (
                            <Button
                              className="bg-custom-dark-maroon hover:bg-custom-deep-maroon"
                              onClick={() => {
                                toast({
                                  title: "Download Started",
                                  description: `Downloading ${doc.name}...`,
                                });
                              }}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          ) : (
                            <Button variant="outline" disabled>
                              {doc.status === 'pending' ? 'Processing' : 'Not Ready'}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-8 p-6 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-3">Document Status Information</h4>
                    <ul className="text-sm text-blue-800 space-y-2">
                      <li className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span><strong>Pending:</strong> Document is being prepared by our team</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span><strong>Ready:</strong> Document is available for download</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span><strong>Completed:</strong> Document has been downloaded and processed</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
      
      {/* Form Modals */}
      <BusinessFormationForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)}
        onSubmitted={handleFormSubmitted}
      />
      
      <PricingPackages 
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
      />
      
      <Footer />
    </div>
  );
};