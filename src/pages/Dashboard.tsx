import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
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
  Camera,
  Phone,
  Mail,
  Briefcase,
  Check,
  Loader2
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
  status: 'active' | 'inactive';
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
    name: string;
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
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState<Partial<UserProfile>>({});
  const [memberForms, setMemberForms] = useState<Record<string, Partial<TeamMember>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Legacy dashboard state
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isEditingBusiness, setIsEditingBusiness] = useState(false);
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [businessForm, setBusinessForm] = useState<any>({});
  const [personalForm, setPersonalForm] = useState<any>({});
  const [members, setMembers] = useState<any[]>([]);

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
    loadTeamMembers();
    loadLegacyDashboardData();
    
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
      teamSubscription.unsubscribe();
    };
  }, [user, navigate]);

  const loadUserProfile = async () => {
    if (!user) return;

    try {
      // First check if profile exists
      let { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
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
          .select()
          .single();

        if (createError) throw createError;
        profile = createdProfile;
      } else if (error) {
        throw error;
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

  const loadTeamMembers = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

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

  const loadLegacyDashboardData = () => {
    // Load legacy dashboard data from localStorage
    const storedData = localStorage.getItem('dashboardData');
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        setDashboardData(data);
        setBusinessForm(data.businessProfile);
        setPersonalForm(data.ownerInfo);
        setMembers(data.members || []);
      } catch (error) {
        console.error('Error parsing dashboard data:', error);
      }
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
      status: 'active' as const
    };

    try {
      const { data, error } = await supabase
        .from('team_members')
        .insert([newMember])
        .select()
        .single();

      if (error) throw error;

      setEditingMemberId(data.id);
      setMemberForms(prev => ({
        ...prev,
        [data.id]: { ...data }
      }));

      toast({
        title: "Success",
        description: "New team member added!",
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
    if (!dashboardData?.businessProfile?.id) return;

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
          updated_at: new Date().toISOString()
        })
        .eq('id', dashboardData.businessProfile.id);

      if (error) throw error;

      setDashboardData(prev => prev ? {
        ...prev,
        businessProfile: { ...prev.businessProfile, ...businessForm }
      } : null);

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

  const handlePersonalSave = () => {
    const updatedData = {
      ...dashboardData,
      ownerInfo: personalForm
    };
    localStorage.setItem('dashboardData', JSON.stringify(updatedData));
    setDashboardData(updatedData as DashboardData);
    setIsEditingPersonal(false);
    
    toast({
      title: "Success",
      description: "Personal information updated successfully!",
    });
  };

  const handleRemoveMember = (memberId: string) => {
    const updatedMembers = members.filter(member => member.id !== memberId);
    setMembers(updatedMembers);
    
    const updatedData = {
      ...dashboardData,
      members: updatedMembers
    };
    localStorage.setItem('dashboardData', JSON.stringify(updatedData));
    setDashboardData(updatedData as DashboardData);
    
    toast({
      title: "Success",
      description: "Team member removed successfully!",
    });
  };

  const handleLogout = async () => {
    await logout();
    localStorage.removeItem('dashboardData');
    navigate('/');
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

  if (!userProfile || !dashboardData) {
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
      
      <div className="pt-20 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Personalized Welcome Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-6">
              <Avatar className="w-16 h-16">
                <AvatarImage src={userProfile.profile_picture_url} alt={userProfile.full_name} />
                <AvatarFallback className="bg-custom-dark-maroon text-white text-lg">
                  {getInitials(userProfile.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Welcome to your dashboard, {userProfile.full_name}!
                </h1>
                <p className="text-gray-600 mt-1">
                  {userProfile.role} • {dashboardData.selectedPackage}
                </p>
              </div>
            </div>

            {/* Profile Information Card */}
            <Card className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Profile Information</span>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  {hasChanges && (
                    <span className="text-sm text-amber-600 flex items-center">
                      <Edit className="w-4 h-4 mr-1" />
                      Unsaved changes
                    </span>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (isEditingProfile) {
                        setProfileForm(userProfile);
                        setHasChanges(false);
                      }
                      setIsEditingProfile(!isEditingProfile);
                    }}
                    disabled={isSaving}
                  >
                    {isEditingProfile ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                    {isEditingProfile ? 'Cancel' : 'Edit'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isEditingProfile ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="full_name">Full Name *</Label>
                        <Input
                          id="full_name"
                          value={profileForm.full_name || ''}
                          onChange={(e) => {
                            setProfileForm(prev => ({ ...prev, full_name: e.target.value }));
                            setHasChanges(true);
                          }}
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileForm.email || ''}
                          onChange={(e) => {
                            setProfileForm(prev => ({ ...prev, email: e.target.value }));
                            setHasChanges(true);
                          }}
                          placeholder="Enter your email"
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={profileForm.phone || ''}
                          onChange={(e) => {
                            setProfileForm(prev => ({ ...prev, phone: e.target.value }));
                            setHasChanges(true);
                          }}
                          placeholder="Enter your phone number"
                        />
                      </div>
                      <div>
                        <Label htmlFor="role">Role/Position</Label>
                        <Input
                          id="role"
                          value={profileForm.role || ''}
                          onChange={(e) => {
                            setProfileForm(prev => ({ ...prev, role: e.target.value }));
                            setHasChanges(true);
                          }}
                          placeholder="Enter your role"
                        />
                      </div>
                    </div>
                    <div className="md:col-span-2 flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setProfileForm(userProfile);
                          setIsEditingProfile(false);
                          setHasChanges(false);
                        }}
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleProfileSave}
                        disabled={isSaving || !hasChanges}
                        className="bg-custom-dark-maroon hover:bg-custom-deep-maroon"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
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
                          <Label className="text-sm font-medium text-gray-500">Email Address</Label>
                          <p className="text-gray-900">{userProfile.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Phone Number</Label>
                          <p className="text-gray-900">{userProfile.phone || 'Not provided'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Briefcase className="w-5 h-5 text-gray-400" />
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Role/Position</Label>
                          <p className="text-gray-900">{userProfile.role}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Team Members Section */}
            <Card className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Team Members</span>
                </CardTitle>
                <Button
                  onClick={handleAddTeamMember}
                  className="bg-custom-dark-maroon hover:bg-custom-deep-maroon"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Add Member
                </Button>
              </CardHeader>
              <CardContent>
                {teamMembers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No team members yet</h3>
                    <p className="text-gray-600 mb-4">Add team members to collaborate on your business.</p>
                    <Button
                      onClick={handleAddTeamMember}
                      className="bg-custom-dark-maroon hover:bg-custom-deep-maroon"
                    >
                      Add Your First Team Member
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {teamMembers.map((member) => (
                      <div key={member.id} className="border rounded-lg p-4">
                        {editingMemberId === member.id ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                                placeholder="Enter name"
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
                                placeholder="Enter role"
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
                                placeholder="Enter email"
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
                                placeholder="Enter phone"
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
                            <div className="flex items-end space-x-2">
                              <Button
                                variant="outline"
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
                                Cancel
                              </Button>
                              <Button
                                onClick={() => handleMemberSave(member.id)}
                                disabled={isSaving}
                                className="bg-custom-dark-maroon hover:bg-custom-deep-maroon"
                              >
                                {isSaving ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-4 h-4 mr-2" />
                                    Save
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <Avatar className="w-10 h-10">
                                <AvatarFallback className="bg-gray-200 text-gray-600">
                                  {getInitials(member.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="font-medium text-gray-900">{member.name}</h4>
                                <p className="text-sm text-gray-600">{member.role}</p>
                                <div className="flex items-center space-x-4 mt-1">
                                  {member.email && (
                                    <span className="text-xs text-gray-500">{member.email}</span>
                                  )}
                                  {member.phone && (
                                    <span className="text-xs text-gray-500">{member.phone}</span>
                                  )}
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
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
                                <Edit className="w-4 h-4" />
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveTeamMember(member.id)}
                                className="text-red-600 hover:text-red-800"
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

          {/* Main Content Tabs */}
          <Tabs defaultValue="business" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="business" className="flex items-center space-x-2">
                <Building2 className="w-4 h-4" />
                <span>Business Information</span>
              </TabsTrigger>
              <TabsTrigger value="personal" className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Personal Information</span>
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Document Portal</span>
              </TabsTrigger>
            </TabsList>

            {/* Business Information Tab */}
            <TabsContent value="business">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Business Information</CardTitle>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (isEditingBusiness) {
                        setBusinessForm(dashboardData.businessProfile);
                      }
                      setIsEditingBusiness(!isEditingBusiness);
                    }}
                  >
                    {isEditingBusiness ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                    {isEditingBusiness ? 'Cancel' : 'Edit'}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditingBusiness ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={businessForm.phone || ''}
                          onChange={(e) => setBusinessForm(prev => ({ ...prev, phone: e.target.value }))}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Business Name</Label>
                        <p className="text-gray-900">{dashboardData.businessProfile.business_name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Business Type</Label>
                        <p className="text-gray-900 capitalize">{dashboardData.businessProfile.business_type?.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Address</Label>
                        <p className="text-gray-900">
                          {dashboardData.businessProfile.address_line1}
                          {dashboardData.businessProfile.address_line2 && <br />}
                          {dashboardData.businessProfile.address_line2}
                          <br />
                          {dashboardData.businessProfile.city}, {dashboardData.businessProfile.state} {dashboardData.businessProfile.zip_code}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Contact Information</Label>
                        <p className="text-gray-900">
                          Phone: {dashboardData.businessProfile.phone}<br />
                          Email: {dashboardData.businessProfile.email}
                        </p>
                      </div>
                      {dashboardData.businessProfile.description && (
                        <div className="md:col-span-2">
                          <Label className="text-sm font-medium text-gray-500">Description</Label>
                          <p className="text-gray-900">{dashboardData.businessProfile.description}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Personal Information Tab */}
            <TabsContent value="personal">
              <div className="space-y-6">
                {/* Owner Information */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Owner Information</CardTitle>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (isEditingPersonal) {
                          setPersonalForm(dashboardData.ownerInfo);
                        }
                        setIsEditingPersonal(!isEditingPersonal);
                      }}
                    >
                      {isEditingPersonal ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                      {isEditingPersonal ? 'Cancel' : 'Edit'}
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isEditingPersonal ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="owner_name">Full Name</Label>
                          <Input
                            id="owner_name"
                            value={personalForm.name || ''}
                            onChange={(e) => setPersonalForm(prev => ({ ...prev, name: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="owner_email">Email</Label>
                          <Input
                            id="owner_email"
                            type="email"
                            value={personalForm.email || ''}
                            onChange={(e) => setPersonalForm(prev => ({ ...prev, email: e.target.value }))}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="owner_address">Address</Label>
                          <Textarea
                            id="owner_address"
                            value={personalForm.address || ''}
                            onChange={(e) => setPersonalForm(prev => ({ ...prev, address: e.target.value }))}
                            rows={2}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Button 
                            onClick={handlePersonalSave}
                            className="bg-custom-dark-maroon hover:bg-custom-deep-maroon"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Full Name</Label>
                          <p className="text-gray-900">{dashboardData.ownerInfo.name}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Email</Label>
                          <p className="text-gray-900">{dashboardData.ownerInfo.email}</p>
                        </div>
                        <div className="md:col-span-2">
                          <Label className="text-sm font-medium text-gray-500">Address</Label>
                          <p className="text-gray-900">{dashboardData.ownerInfo.address}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Legacy Team Members */}
                {members.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Users className="w-5 h-5" />
                        <span>Legacy Team Members</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {members.map((member) => (
                          <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{member.name}</h4>
                              <p className="text-sm text-gray-600">{member.email}</p>
                              {member.phone && <p className="text-sm text-gray-600">{member.phone}</p>}
                              {member.address && <p className="text-sm text-gray-600">{member.address}</p>}
                            </div>
                            <Button
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
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Document Portal Tab */}
            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle>Document Portal</CardTitle>
                  <p className="text-sm text-gray-600">
                    Track the status of your business formation documents and download them when ready.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <FileText className="w-8 h-8 text-gray-400" />
                          <div>
                            <h4 className="font-medium text-gray-900">{doc.name}</h4>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                              {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                            </span>
                          </div>
                        </div>
                        <div>
                          {doc.status === 'ready' && doc.downloadUrl ? (
                            <Button
                              variant="outline"
                              size="sm"
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
                            <Button variant="outline" size="sm" disabled>
                              {doc.status === 'pending' ? 'Processing' : 'Not Ready'}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Document Status Information</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li><strong>Pending:</strong> Document is being prepared</li>
                      <li><strong>Ready:</strong> Document is available for download</li>
                      <li><strong>Completed:</strong> Document has been downloaded and processed</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};