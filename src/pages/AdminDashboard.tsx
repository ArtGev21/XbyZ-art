import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { DataExportSystem } from '@/components/DataExportSystem';
import { 
  Search, 
  Upload, 
  Download, 
  FileText, 
  Building2,
  User,
  Calendar,
  Filter,
  RefreshCw,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileUp,
  Check,
  Database,
  Users,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  ChevronRight
} from 'lucide-react';

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

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  created_at: string;
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
}

interface ApplicationData {
  businessProfile: BusinessProfile;
  userProfile: UserProfile | null;
  teamMembers: TeamMember[];
}

interface Document {
  id: string;
  business_profile_id: string;
  name: string;
  status: 'pending' | 'ready' | 'completed';
  type: string;
  file_url?: string;
  uploaded_at?: string;
}

export const AdminDashboard = () => {
  const { user, logout, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<ApplicationData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [businessTypeFilter, setBusinessTypeFilter] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState<ApplicationData | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [mainActiveTab, setMainActiveTab] = useState('applications');

  // Check if user is admin
  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate('/');
      return;
    }

    if (!isAdmin) {
      navigate('/');
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      return;
    }

    loadApplications();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('admin_applications')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'applications' },
        () => loadApplications()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, isAdmin, loading, navigate, toast]);

  const loadApplications = async () => {
    setIsLoadingApplications(true);
    try {
      // First, get all business profiles
      const { data: applications, error: applicationsError } = await supabase
        .from('business_profiles')
        .select('id,user_id,business_name,business_type,address_line1,address_line2,city,state,zip_code,phone,email,tax_id,description,status,owner_phone,created_at,updated_at')
        .order('created_at', { ascending: false });

      if (applicationsError) throw applicationsError;

      if (!applications || applications.length === 0) {
        setApplications([]);
        setFilteredApplications([]);
        toast({
          title: "No Applications",
          description: "No business applications found in the database.",
        });
        return;
      }

      // Get unique user IDs from business profiles
      const userIds = [...new Set(applications.map(bp => bp.user_id))];

      // Fetch user profiles for these user IDs
      const { data: userProfiles, error: userError } = await supabase
        .from('user_profiles')
        .select('id,full_name,email,phone,role,created_at')
        .in('id', userIds);

      if (userError) console.error('Error loading user profiles:', userError);

      // Fetch team members for these user IDs
      const { data: teamMembers, error: teamError } = await supabase
        .from('team_members')
        .select('id,user_id,name,role,email,phone,position,status,created_at')
        .in('user_id', userIds);

      if (teamError) console.error('Error loading team members:', teamError);

      // Combine the data
      const applicationsData: ApplicationData[] = applications.map(businessProfile => {
        const userProfile = userProfiles?.find(up => up.id === businessProfile.user_id) || null;
        const userTeamMembers = teamMembers?.filter(tm => tm.user_id === businessProfile.user_id) || [];

        return {
          businessProfile,
          userProfile,
          teamMembers: userTeamMembers
        };
      });

      console.log('Loaded applications with connected data:', applicationsData);
      setApplications(applicationsData);
      setFilteredApplications(applicationsData);
      
      toast({
        title: "Applications Loaded",
        description: `Found ${applicationsData.length} business application(s) with connected data.`,
      });

    } catch (error) {
      console.error('Error loading applications:', error);
      toast({
        title: "Error",
        description: "Failed to load applications.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingApplications(false);
    }
  };

  // Enhanced search and filtering
  useEffect(() => {
    let filtered = applications;

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(app => {
        const bp = app.businessProfile;
        const up = app.userProfile;
        
        return (
          bp.business_name.toLowerCase().includes(searchLower) ||
          bp.email.toLowerCase().includes(searchLower) ||
          bp.business_type.toLowerCase().includes(searchLower) ||
          bp.phone.includes(searchTerm) ||
          bp.city.toLowerCase().includes(searchLower) ||
          bp.zip_code.includes(searchTerm) ||
          (bp.description && bp.description.toLowerCase().includes(searchLower)) ||
          (bp.tax_id && bp.tax_id.includes(searchTerm)) ||
          (bp.owner_phone && bp.owner_phone.includes(searchTerm)) ||
          (up && up.full_name.toLowerCase().includes(searchLower)) ||
          (up && up.email.toLowerCase().includes(searchLower)) ||
          app.teamMembers.some(tm => 
            tm.name.toLowerCase().includes(searchLower) ||
            tm.email.toLowerCase().includes(searchLower) ||
            (tm.position && tm.position.toLowerCase().includes(searchLower))
          )
        );
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.businessProfile.status === statusFilter);
    }

    // Business type filter
    if (businessTypeFilter !== 'all') {
      filtered = filtered.filter(app => app.businessProfile.business_type === businessTypeFilter);
    }

    setFilteredApplications(filtered);
    
    // Auto-select first result if searching and results found
    if (searchTerm && filtered.length > 0 && !selectedApplication) {
      handleApplicationSelect(filtered[0]);
    }
  }, [searchTerm, statusFilter, businessTypeFilter, applications]);

  const loadDocuments = async (profileId: string, businessType: string) => {
    // Enhanced mock documents based on business type
    let mockDocs: Document[] = [];

    if (businessType === 'llc') {
      mockDocs = [
        {
          id: '1',
          business_profile_id: profileId,
          name: 'Articles of Organization',
          status: 'pending',
          type: 'formation'
        },
        {
          id: '2',
          business_profile_id: profileId,
          name: 'Operating Agreement',
          status: 'pending',
          type: 'agreement'
        },
        {
          id: '3',
          business_profile_id: profileId,
          name: 'Tax ID (EIN) Certificate',
          status: 'ready',
          type: 'tax'
        },
        {
          id: '4',
          business_profile_id: profileId,
          name: 'Compliance Calendar',
          status: 'ready',
          type: 'compliance'
        }
      ];
    } else if (businessType === 'corporation') {
      mockDocs = [
        {
          id: '1',
          business_profile_id: profileId,
          name: 'Articles of Incorporation',
          status: 'pending',
          type: 'formation'
        },
        {
          id: '2',
          business_profile_id: profileId,
          name: 'Corporate Bylaws',
          status: 'pending',
          type: 'agreement'
        },
        {
          id: '3',
          business_profile_id: profileId,
          name: 'Tax ID (EIN) Certificate',
          status: 'ready',
          type: 'tax'
        },
        {
          id: '4',
          business_profile_id: profileId,
          name: 'Stock Certificates',
          status: 'pending',
          type: 'stock'
        }
      ];
    } else {
      mockDocs = [
        {
          id: '1',
          business_profile_id: profileId,
          name: 'Business Registration',
          status: 'pending',
          type: 'formation'
        },
        {
          id: '2',
          business_profile_id: profileId,
          name: 'Tax ID (EIN) Certificate',
          status: 'ready',
          type: 'tax'
        },
        {
          id: '3',
          business_profile_id: profileId,
          name: 'Compliance Calendar',
          status: 'ready',
          type: 'compliance'
        }
      ];
    }
    
    setDocuments(mockDocs);
  };

  const handleApplicationSelect = async (application: ApplicationData) => {
    setSelectedApplication(application);
    setIsLoadingDetails(true);
    setActiveTab('overview');
    
    try {
      await loadDocuments(application.businessProfile.id, application.businessProfile.business_type);
      
      toast({
        title: "Application Loaded",
        description: `Viewing details for ${application.businessProfile.business_name}`,
      });
    } catch (error) {
      console.error('Error loading application details:', error);
      toast({
        title: "Error",
        description: "Failed to load some application details.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleDocumentUpload = async (docId: string, docName: string) => {
    setUploadingDoc(docId);
    
    // Create a file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
    fileInput.multiple = false;
    
    fileInput.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) {
        setUploadingDoc(null);
        return;
      }

      try {
        // Simulate file upload process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Update document status
        setDocuments(prev => prev.map(doc => 
          doc.id === docId 
            ? { 
                ...doc, 
                status: 'ready' as const, 
                uploaded_at: new Date().toISOString(),
                file_url: `uploads/${file.name}` 
              }
            : doc
        ));
        
        toast({
          title: "Document Uploaded Successfully",
          description: `${docName} has been uploaded and is now ready for client download.`,
        });
      } catch (error) {
        console.error('Upload error:', error);
        toast({
          title: "Upload Failed",
          description: "Failed to upload document. Please try again.",
          variant: "destructive",
        });
      } finally {
        setUploadingDoc(null);
      }
    };
    
    fileInput.click();
  };

  const updateApplicationStatus = async (profileId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('business_profiles')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', profileId);

      if (error) throw error;

      // Update local state
      setApplications(prev => prev.map(app => 
        app.businessProfile.id === profileId 
          ? { 
              ...app, 
              businessProfile: { 
                ...app.businessProfile, 
                status: newStatus, 
                updated_at: new Date().toISOString() 
              }
            }
          : app
      ));

      if (selectedApplication?.businessProfile.id === profileId) {
        setSelectedApplication(prev => prev ? { 
          ...prev, 
          businessProfile: {
            ...prev.businessProfile,
            status: newStatus, 
            updated_at: new Date().toISOString() 
          }
        } : null);
      }

      toast({
        title: "Status Updated",
        description: `Application status updated to ${newStatus.replace('_', ' ')}.`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update status.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'text-gray-600 bg-gray-100';
      case 'submitted': return 'text-blue-600 bg-blue-100';
      case 'in_review': return 'text-yellow-600 bg-yellow-100';
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Edit className="w-4 h-4" />;
      case 'submitted': return <Clock className="w-4 h-4" />;
      case 'in_review': return <AlertCircle className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getDocStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'ready': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatBusinessType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="pt-20 min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h2>
            <p className="text-gray-600">Verifying access permissions...</p>
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
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
                <p className="text-gray-600">Manage business applications, documents, and export data</p>
                <div className="mt-2 text-sm text-gray-500">
                  Logged in as: <span className="font-medium">{user?.email}</span>
                </div>
              </div>
              <Button
                onClick={loadApplications}
                disabled={isLoadingApplications}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingApplications ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Applications</p>
                      <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Review</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {applications.filter(app => app.businessProfile.status === 'submitted' || app.businessProfile.status === 'in_review').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Approved</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {applications.filter(app => app.businessProfile.status === 'approved').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Rejected</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {applications.filter(app => app.businessProfile.status === 'rejected').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Tabs */}
          <Tabs value={mainActiveTab} onValueChange={setMainActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="applications" className="flex items-center space-x-2">
                <Building2 className="w-4 h-4" />
                <span>Applications Management</span>
              </TabsTrigger>
              <TabsTrigger value="export" className="flex items-center space-x-2">
                <Database className="w-4 h-4" />
                <span>Data Export</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="applications">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Panel - Applications Table */}
                <div className="lg:col-span-1">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Building2 className="w-5 h-5" />
                        <span>Applications ({filteredApplications.length})</span>
                      </CardTitle>
                      
                      {/* Search and Filter */}
                      <div className="space-y-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            placeholder="Search applications..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center space-x-2">
                            <Filter className="w-4 h-4 text-gray-400" />
                            <select
                              value={statusFilter}
                              onChange={(e) => setStatusFilter(e.target.value)}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                              <option value="all">All Status</option>
                              <option value="draft">Draft</option>
                              <option value="submitted">Submitted</option>
                              <option value="in_review">In Review</option>
                              <option value="approved">Approved</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          </div>
                          
                          <select
                            value={businessTypeFilter}
                            onChange={(e) => setBusinessTypeFilter(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="all">All Types</option>
                            <option value="llc">LLC</option>
                            <option value="corporation">Corporation</option>
                            <option value="partnership">Partnership</option>
                            <option value="sole_proprietorship">Sole Proprietorship</option>
                          </select>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="max-h-96 overflow-y-auto">
                      {isLoadingApplications ? (
                        <div className="text-center py-4">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-custom-dark-maroon" />
                          <p>Loading applications...</p>
                        </div>
                      ) : filteredApplications.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">
                          {applications.length === 0 ? (
                            <div>
                              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                              <p className="font-medium">No applications found</p>
                              <p className="text-sm">No business applications have been submitted yet.</p>
                            </div>
                          ) : (
                            <div>
                              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                              <p className="font-medium">No matches found</p>
                              <p className="text-sm">Try adjusting your search or filters.</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {filteredApplications.map((application) => (
                            <div
                              key={application.businessProfile.id}
                              onClick={() => handleApplicationSelect(application)}
                              className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                                selectedApplication?.businessProfile.id === application.businessProfile.id 
                                  ? 'border-custom-dark-maroon bg-custom-dark-maroon/5 shadow-md' 
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                  {/* Business Name - Large and prominent */}
                                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                    {application.businessProfile.business_name}
                                  </h3>
                                  {/* Business Type - Small and gray */}
                                  <p className="text-sm text-gray-500 capitalize mb-2">
                                    {formatBusinessType(application.businessProfile.business_type)}
                                  </p>
                                </div>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.businessProfile.status)}`}>
                                  {getStatusIcon(application.businessProfile.status)}
                                  <span className="ml-1">{application.businessProfile.status.replace('_', ' ')}</span>
                                </span>
                              </div>
                              
                              <div className="space-y-1">
                                {/* Owner Info */}
                                {application.userProfile && (
                                  <div className="flex items-center text-sm text-gray-600">
                                    <User className="w-4 h-4 mr-2" />
                                    <span>{application.userProfile.full_name}</span>
                                  </div>
                                )}
                                
                                {/* Contact Info */}
                                <div className="flex items-center text-sm text-gray-600">
                                  <Mail className="w-4 h-4 mr-2" />
                                  <span>{application.businessProfile.email}</span>
                                </div>
                                
                                {/* Phone Info */}
                                <div className="flex items-center text-sm text-gray-600">
                                  <Phone className="w-4 h-4 mr-2" />
                                  <span>
                                    {application.businessProfile.phone}
                                    {application.businessProfile.owner_phone && 
                                      ` • Owner: ${application.businessProfile.owner_phone}`
                                    }
                                  </span>
                                </div>
                                
                                {/* Location */}
                                <div className="flex items-center text-sm text-gray-600">
                                  <MapPin className="w-4 h-4 mr-2" />
                                  <span>{application.businessProfile.city}, {application.businessProfile.state}</span>
                                </div>
                                
                                {/* Team Members Count */}
                                {application.teamMembers.length > 0 && (
                                  <div className="flex items-center text-sm text-gray-600">
                                    <Users className="w-4 h-4 mr-2" />
                                    <span>{application.teamMembers.length} team member{application.teamMembers.length !== 1 ? 's' : ''}</span>
                                  </div>
                                )}
                                
                                {/* Date */}
                                <div className="flex items-center text-xs text-gray-400 mt-2">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  <span>Created {new Date(application.businessProfile.created_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Right Panel - Selected Application Details */}
                <div className="lg:col-span-2">
                  {selectedApplication ? (
                    <div className="space-y-6">
                      {/* Application Header */}
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center space-x-2">
                              <Building2 className="w-5 h-5" />
                              <span>{selectedApplication.businessProfile.business_name}</span>
                            </CardTitle>
                            <p className="text-sm text-gray-600 mt-1">
                              {formatBusinessType(selectedApplication.businessProfile.business_type)} • Created {new Date(selectedApplication.businessProfile.created_at).toLocaleDateString()}
                            </p>
                            {selectedApplication.userProfile && (
                              <p className="text-sm text-gray-500">
                                Owner: {selectedApplication.userProfile.full_name}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Label htmlFor="status-select" className="text-sm">Status:</Label>
                            <select
                              id="status-select"
                              value={selectedApplication.businessProfile.status}
                              onChange={(e) => updateApplicationStatus(selectedApplication.businessProfile.id, e.target.value)}
                              className="flex h-8 rounded-md border border-input bg-background px-2 py-1 text-sm"
                            >
                              <option value="draft">Draft</option>
                              <option value="submitted">Submitted</option>
                              <option value="in_review">In Review</option>
                              <option value="approved">Approved</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          </div>
                        </CardHeader>
                      </Card>

                      {/* Tabs for different sections */}
                      <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-4">
                          <TabsTrigger value="overview">Business</TabsTrigger>
                          <TabsTrigger value="owner">Owner</TabsTrigger>
                          <TabsTrigger value="team">Team ({selectedApplication.teamMembers.length})</TabsTrigger>
                          <TabsTrigger value="documents">Documents</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-4">
                          <Card>
                            <CardHeader>
                              <CardTitle>Business Information</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium text-gray-500">Business Name</Label>
                                  <p className="text-gray-900">{selectedApplication.businessProfile.business_name}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-500">Business Type</Label>
                                  <p className="text-gray-900">{formatBusinessType(selectedApplication.businessProfile.business_type)}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-500">Email</Label>
                                  <p className="text-gray-900">{selectedApplication.businessProfile.email}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-500">Business Phone</Label>
                                  <p className="text-gray-900">{selectedApplication.businessProfile.phone}</p>
                                </div>
                                {selectedApplication.businessProfile.owner_phone && (
                                  <div>
                                    <Label className="text-sm font-medium text-gray-500">Owner Phone</Label>
                                    <p className="text-gray-900">{selectedApplication.businessProfile.owner_phone}</p>
                                  </div>
                                )}
                                <div className="md:col-span-2">
                                  <Label className="text-sm font-medium text-gray-500">Address</Label>
                                  <p className="text-gray-900">
                                    {selectedApplication.businessProfile.address_line1}
                                    {selectedApplication.businessProfile.address_line2 && <>, {selectedApplication.businessProfile.address_line2}</>}
                                    <br />
                                    {selectedApplication.businessProfile.city}, {selectedApplication.businessProfile.state} {selectedApplication.businessProfile.zip_code}
                                  </p>
                                </div>
                                {selectedApplication.businessProfile.tax_id && (
                                  <div>
                                    <Label className="text-sm font-medium text-gray-500">Tax ID</Label>
                                    <p className="text-gray-900">{selectedApplication.businessProfile.tax_id}</p>
                                  </div>
                                )}
                                {selectedApplication.businessProfile.description && (
                                  <div className="md:col-span-2">
                                    <Label className="text-sm font-medium text-gray-500">Description</Label>
                                    <p className="text-gray-900">{selectedApplication.businessProfile.description}</p>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </TabsContent>

                        <TabsContent value="owner" className="space-y-4">
                          <Card>
                            <CardHeader>
                              <CardTitle>Owner Information</CardTitle>
                            </CardHeader>
                            <CardContent>
                              {selectedApplication.userProfile ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm font-medium text-gray-500">Full Name</Label>
                                    <p className="text-gray-900">{selectedApplication.userProfile.full_name}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium text-gray-500">Email</Label>
                                    <p className="text-gray-900">{selectedApplication.userProfile.email}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium text-gray-500">Phone</Label>
                                    <p className="text-gray-900">{selectedApplication.userProfile.phone || 'Not provided'}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium text-gray-500">Role</Label>
                                    <p className="text-gray-900">{selectedApplication.userProfile.role}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium text-gray-500">Account Created</Label>
                                    <p className="text-gray-900">{new Date(selectedApplication.userProfile.created_at).toLocaleDateString()}</p>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center py-8 text-gray-500">
                                  <User className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                  <p>No owner profile information available</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </TabsContent>

                        <TabsContent value="team" className="space-y-4">
                          <Card>
                            <CardHeader>
                              <CardTitle>Team Members ({selectedApplication.teamMembers.length})</CardTitle>
                            </CardHeader>
                            <CardContent>
                              {selectedApplication.teamMembers.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                  <p>No team members added</p>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  {selectedApplication.teamMembers.map((member) => (
                                    <div key={member.id} className="p-4 border rounded-lg">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <h4 className="font-medium text-gray-900">{member.name}</h4>
                                          <p className="text-sm text-gray-600">{member.role}</p>
                                          {member.position && (
                                            <p className="text-sm text-gray-500">Position: {member.position}</p>
                                          )}
                                          {member.email && (
                                            <p className="text-sm text-gray-500">{member.email}</p>
                                          )}
                                          {member.phone && (
                                            <p className="text-sm text-gray-500">{member.phone}</p>
                                          )}
                                        </div>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                          member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                          {member.status}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </TabsContent>

                        <TabsContent value="documents" className="space-y-4">
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center space-x-2">
                                <FileText className="w-5 h-5" />
                                <span>Document Management</span>
                              </CardTitle>
                              <p className="text-sm text-gray-600">
                                Upload and manage documents for {selectedApplication.businessProfile.business_name}
                              </p>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                {documents.map((doc) => (
                                  <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center space-x-4">
                                      <div className="p-2 bg-gray-100 rounded-lg">
                                        <FileText className="w-6 h-6 text-gray-600" />
                                      </div>
                                      <div>
                                        <h4 className="font-medium text-gray-900">{doc.name}</h4>
                                        <div className="flex items-center space-x-2 mt-1">
                                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDocStatusColor(doc.status)}`}>
                                            {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                                          </span>
                                          {doc.uploaded_at && (
                                            <span className="text-xs text-gray-500">
                                              Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      {doc.status === 'pending' ? (
                                        <Button
                                          size="sm"
                                          onClick={() => handleDocumentUpload(doc.id, doc.name)}
                                          disabled={uploadingDoc === doc.id}
                                          className="bg-custom-dark-maroon hover:bg-custom-deep-maroon"
                                        >
                                          {uploadingDoc === doc.id ? (
                                            <>
                                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                              Uploading...
                                            </>
                                          ) : (
                                            <>
                                              <FileUp className="w-4 h-4 mr-2" />
                                              Upload File
                                            </>
                                          )}
                                        </Button>
                                      ) : (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            toast({
                                              title: "Document Ready",
                                              description: `${doc.name} is available for client download.`,
                                            });
                                          }}
                                        >
                                          <Check className="w-4 h-4 mr-2" />
                                          Ready for Download
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              
                              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                                <h4 className="font-medium text-blue-900 mb-2">Document Upload Instructions</h4>
                                <ul className="text-sm text-blue-800 space-y-1">
                                  <li>• <strong>Pending:</strong> Click "Upload File" to select and upload the document</li>
                                  <li>• <strong>Ready:</strong> Document is uploaded and available for client download</li>
                                  <li>• <strong>Completed:</strong> Client has downloaded the document</li>
                                  <li>• <strong>Supported formats:</strong> PDF, DOC, DOCX, JPG, JPEG, PNG</li>
                                </ul>
                              </div>
                            </CardContent>
                          </Card>
                        </TabsContent>
                      </Tabs>
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="flex items-center justify-center h-64">
                        <div className="text-center">
                          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Application</h3>
                          <p className="text-gray-600">Choose a business application from the list to view details and manage documents.</p>
                          {applications.length > 0 && (
                            <p className="text-sm text-gray-500 mt-2">
                              Found {applications.length} application(s) with connected data.
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="export">
              <DataExportSystem />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};