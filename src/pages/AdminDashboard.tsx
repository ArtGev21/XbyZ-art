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
import { 
  Search, 
  Upload, 
  Download, 
  FileText, 
  Building2,
  User,
  Calendar,
  Filter
} from 'lucide-react';

interface BusinessProfile {
  id: string;
  business_name: string;
  business_type: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
  user_id: string;
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [businessProfiles, setBusinessProfiles] = useState<BusinessProfile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<BusinessProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedProfile, setSelectedProfile] = useState<BusinessProfile | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  // Check if user is admin
  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    if (user.email !== 'info@xbyzeth.com') {
      navigate('/');
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      return;
    }

    loadBusinessProfiles();
  }, [user, navigate, toast]);

  const loadBusinessProfiles = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('business_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setBusinessProfiles(data || []);
      setFilteredProfiles(data || []);
    } catch (error) {
      console.error('Error loading business profiles:', error);
      toast({
        title: "Error",
        description: "Failed to load business profiles.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter profiles based on search and status
  useEffect(() => {
    let filtered = businessProfiles;

    if (searchTerm) {
      filtered = filtered.filter(profile => 
        profile.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.business_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(profile => profile.status === statusFilter);
    }

    setFilteredProfiles(filtered);
  }, [searchTerm, statusFilter, businessProfiles]);

  const loadDocuments = async (profileId: string) => {
    // Mock documents for demonstration
    const mockDocs: Document[] = [
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
        status: 'pending',
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
    
    setDocuments(mockDocs);
  };

  const handleProfileSelect = (profile: BusinessProfile) => {
    setSelectedProfile(profile);
    loadDocuments(profile.id);
  };

  const handleDocumentUpload = async (docId: string, docName: string) => {
    setUploadingDoc(docId);
    
    // Simulate file upload process
    setTimeout(() => {
      setDocuments(prev => prev.map(doc => 
        doc.id === docId 
          ? { ...doc, status: 'ready' as const, uploaded_at: new Date().toISOString() }
          : doc
      ));
      
      setUploadingDoc(null);
      toast({
        title: "Document Uploaded",
        description: `${docName} has been uploaded and is ready for client download.`,
      });
    }, 2000);
  };

  const updateProfileStatus = async (profileId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('business_profiles')
        .update({ status: newStatus })
        .eq('id', profileId);

      if (error) throw error;

      setBusinessProfiles(prev => prev.map(profile => 
        profile.id === profileId 
          ? { ...profile, status: newStatus }
          : profile
      ));

      if (selectedProfile?.id === profileId) {
        setSelectedProfile(prev => prev ? { ...prev, status: newStatus } : null);
      }

      toast({
        title: "Status Updated",
        description: `Business profile status updated to ${newStatus}.`,
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

  const getDocStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'ready': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="pt-20 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Manage business applications and documents</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Panel - Business Profiles List */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building2 className="w-5 h-5" />
                    <span>Business Applications</span>
                  </CardTitle>
                  
                  {/* Search and Filter */}
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search businesses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
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
                  </div>
                </CardHeader>
                
                <CardContent className="max-h-96 overflow-y-auto">
                  {isLoading ? (
                    <div className="text-center py-4">Loading...</div>
                  ) : filteredProfiles.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">No businesses found</div>
                  ) : (
                    <div className="space-y-3">
                      {filteredProfiles.map((profile) => (
                        <div
                          key={profile.id}
                          onClick={() => handleProfileSelect(profile)}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedProfile?.id === profile.id 
                              ? 'border-custom-dark-maroon bg-custom-dark-maroon/5' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-900 text-sm">{profile.business_name}</h4>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(profile.status)}`}>
                              {profile.status.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 capitalize">{profile.business_type.replace('_', ' ')}</p>
                          <p className="text-xs text-gray-500">{new Date(profile.created_at).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Panel - Selected Business Details */}
            <div className="lg:col-span-2">
              {selectedProfile ? (
                <div className="space-y-6">
                  {/* Business Details */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="flex items-center space-x-2">
                        <User className="w-5 h-5" />
                        <span>{selectedProfile.business_name}</span>
                      </CardTitle>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="status-select" className="text-sm">Status:</Label>
                        <select
                          id="status-select"
                          value={selectedProfile.status}
                          onChange={(e) => updateProfileStatus(selectedProfile.id, e.target.value)}
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
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Business Type</Label>
                          <p className="text-gray-900 capitalize">{selectedProfile.business_type.replace('_', ' ')}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Email</Label>
                          <p className="text-gray-900">{selectedProfile.email}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Phone</Label>
                          <p className="text-gray-900">{selectedProfile.phone}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Submitted</Label>
                          <p className="text-gray-900">{new Date(selectedProfile.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Document Management */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <FileText className="w-5 h-5" />
                        <span>Document Management</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {documents.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center space-x-4">
                              <FileText className="w-8 h-8 text-gray-400" />
                              <div>
                                <h4 className="font-medium text-gray-900">{doc.name}</h4>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDocStatusColor(doc.status)}`}>
                                  {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                                </span>
                                {doc.uploaded_at && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                                  </p>
                                )}
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
                                  <Upload className="w-4 h-4 mr-2" />
                                  {uploadingDoc === doc.id ? 'Uploading...' : 'Upload'}
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
                                  <Download className="w-4 h-4 mr-2" />
                                  Ready
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">Document Status Guide</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                          <li><strong>Pending:</strong> Document needs to be prepared and uploaded</li>
                          <li><strong>Ready:</strong> Document is uploaded and available for client download</li>
                          <li><strong>Completed:</strong> Client has downloaded the document</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Business</h3>
                      <p className="text-gray-600">Choose a business from the list to view details and manage documents.</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};