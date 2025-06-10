import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Building2, 
  User, 
  FileText, 
  Download, 
  Edit, 
  Save, 
  X,
  Users,
  Trash2
} from 'lucide-react';

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
  
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isEditingBusiness, setIsEditingBusiness] = useState(false);
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [businessForm, setBusinessForm] = useState<any>({});
  const [personalForm, setPersonalForm] = useState<any>({});
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

    // Load dashboard data from localStorage
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
        toast({
          title: "Error",
          description: "Failed to load dashboard data.",
          variant: "destructive",
        });
      }
    } else {
      // Redirect to home if no data found
      navigate('/');
    }
  }, [user, navigate, toast]);

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

      // Update local state
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
    // Update local storage for personal info (not stored in database for privacy)
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
    
    // Update localStorage
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
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (!dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Loading Dashboard...</h2>
          <p className="text-gray-600">Please wait while we load your information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b h-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src="/Logo-cropped.png" alt="XByzeth Logo" className="h-12 w-auto" />
              <h1 className="ml-4 text-xl font-semibold text-gray-900">Client Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.email}</span>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to your dashboard, {dashboardData.businessProfile.business_name}!
          </h2>
          <p className="text-gray-600">
            Selected Package: <span className="font-semibold text-custom-dark-maroon">{dashboardData.selectedPackage}</span>
          </p>
        </div>

        {/* Main Content */}
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

              {/* Team Members */}
              {members.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="w-5 h-5" />
                      <span>Team Members</span>
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
                              // In a real app, this would trigger a secure download
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
  );
};