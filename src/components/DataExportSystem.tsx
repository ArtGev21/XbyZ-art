import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { 
  Download, 
  FileText, 
  Database, 
  Users, 
  Building2,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface ExportStats {
  businessProfiles: number;
  userProfiles: number;
  teamMembers: number;
  totalRecords: number;
}

export const DataExportSystem = () => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [exportStats, setExportStats] = useState<ExportStats | null>(null);
  const [lastExportTime, setLastExportTime] = useState<string | null>(null);

  const fetchAllData = async () => {
    try {
      // Fetch all data from Supabase tables
      const [businessProfilesResult, userProfilesResult, teamMembersResult] = await Promise.all([
        supabase.from('business_profiles').select('id,user_id,business_name,business_type,address_line1,address_line2,city,state,zip_code,phone,email,tax_id,description,status,owner_phone,created_at,updated_at').order('created_at', { ascending: false }),
        supabase.from('user_profiles').select('id,full_name,email,phone,role,profile_picture_url,created_at,updated_at').order('created_at', { ascending: false }),
        supabase.from('team_members').select('id,user_id,name,role,email,phone,position,status,created_at,updated_at').order('created_at', { ascending: false })
      ]);

      if (businessProfilesResult.error) throw businessProfilesResult.error;
      if (userProfilesResult.error) throw userProfilesResult.error;
      if (teamMembersResult.error) throw teamMembersResult.error;

      return {
        businessProfiles: businessProfilesResult.data || [],
        userProfiles: userProfilesResult.data || [],
        teamMembers: teamMembersResult.data || []
      };
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  };

  const generateCSV = (data: any[], filename: string) => {
    if (data.length === 0) return null;

    // Get headers from the first object
    const headers = Object.keys(data[0]);
    
    // Create CSV content
    const csvContent = [
      headers.join(','), // Header row
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle null/undefined values and escape commas/quotes
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          // Escape quotes and wrap in quotes if contains comma or quote
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',')
      )
    ].join('\n');

    return csvContent;
  };

  const generateJSON = (data: any) => {
    return JSON.stringify(data, null, 2);
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const data = await fetchAllData();
      
      // Generate CSV files for each table
      const businessProfilesCSV = generateCSV(data.businessProfiles, 'business_profiles.csv');
      const userProfilesCSV = generateCSV(data.userProfiles, 'user_profiles.csv');
      const teamMembersCSV = generateCSV(data.teamMembers, 'team_members.csv');

      // Download files
      if (businessProfilesCSV) {
        downloadFile(businessProfilesCSV, 'business_profiles.csv', 'text/csv');
      }
      if (userProfilesCSV) {
        downloadFile(userProfilesCSV, 'user_profiles.csv', 'text/csv');
      }
      if (teamMembersCSV) {
        downloadFile(teamMembersCSV, 'team_members.csv', 'text/csv');
      }

      // Update stats
      setExportStats({
        businessProfiles: data.businessProfiles.length,
        userProfiles: data.userProfiles.length,
        teamMembers: data.teamMembers.length,
        totalRecords: data.businessProfiles.length + data.userProfiles.length + data.teamMembers.length
      });

      setLastExportTime(new Date().toLocaleString());

      toast({
        title: "CSV Export Successful",
        description: `Exported ${data.businessProfiles.length + data.userProfiles.length + data.teamMembers.length} records across 3 tables.`,
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJSON = async () => {
    setIsExporting(true);
    try {
      const data = await fetchAllData();
      
      // Create comprehensive JSON export
      const exportData = {
        exportInfo: {
          timestamp: new Date().toISOString(),
          totalRecords: data.businessProfiles.length + data.userProfiles.length + data.teamMembers.length,
          tables: {
            business_profiles: data.businessProfiles.length,
            user_profiles: data.userProfiles.length,
            team_members: data.teamMembers.length
          }
        },
        data: {
          business_profiles: data.businessProfiles,
          user_profiles: data.userProfiles,
          team_members: data.teamMembers
        }
      };

      const jsonContent = generateJSON(exportData);
      downloadFile(jsonContent, `database_export_${new Date().toISOString().split('T')[0]}.json`, 'application/json');

      // Update stats
      setExportStats({
        businessProfiles: data.businessProfiles.length,
        userProfiles: data.userProfiles.length,
        teamMembers: data.teamMembers.length,
        totalRecords: data.businessProfiles.length + data.userProfiles.length + data.teamMembers.length
      });

      setLastExportTime(new Date().toLocaleString());

      toast({
        title: "JSON Export Successful",
        description: `Exported complete database with ${exportData.exportInfo.totalRecords} records.`,
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportIndividualTable = async (tableName: 'business_profiles' | 'user_profiles' | 'team_members') => {
    setIsExporting(true);
    try {
      let selectColumns = '';
      
      switch (tableName) {
        case 'business_profiles':
          selectColumns = 'id,user_id,business_name,business_type,address_line1,address_line2,city,state,zip_code,phone,email,tax_id,description,status,owner_phone,created_at,updated_at';
          break;
        case 'user_profiles':
          selectColumns = 'id,full_name,email,phone,role,profile_picture_url,created_at,updated_at';
          break;
        case 'team_members':
          selectColumns = 'id,user_id,name,role,email,phone,position,status,created_at,updated_at';
          break;
      }

      const { data, error } = await supabase
        .from(tableName)
        .select(selectColumns)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          title: "No Data",
          description: `No records found in ${tableName} table.`,
          variant: "destructive",
        });
        return;
      }

      // Generate both CSV and JSON for individual table
      const csvContent = generateCSV(data, `${tableName}.csv`);
      const jsonContent = generateJSON({
        table: tableName,
        exportTime: new Date().toISOString(),
        recordCount: data.length,
        data: data
      });

      if (csvContent) {
        downloadFile(csvContent, `${tableName}.csv`, 'text/csv');
      }
      downloadFile(jsonContent, `${tableName}.json`, 'application/json');

      toast({
        title: "Table Export Successful",
        description: `Exported ${data.length} records from ${tableName} table.`,
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: `Failed to export ${tableName} table.`,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="w-5 h-5" />
            <span>Database Export System</span>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Export data from Supabase tables to CSV or JSON format
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Export Stats */}
          {exportStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-center">
                <Building2 className="w-6 h-6 text-green-600 mx-auto mb-1" />
                <p className="text-sm font-medium text-green-800">Business Profiles</p>
                <p className="text-lg font-bold text-green-900">{exportStats.businessProfiles}</p>
              </div>
              <div className="text-center">
                <Users className="w-6 h-6 text-green-600 mx-auto mb-1" />
                <p className="text-sm font-medium text-green-800">User Profiles</p>
                <p className="text-lg font-bold text-green-900">{exportStats.userProfiles}</p>
              </div>
              <div className="text-center">
                <Users className="w-6 h-6 text-green-600 mx-auto mb-1" />
                <p className="text-sm font-medium text-green-800">Team Members</p>
                <p className="text-lg font-bold text-green-900">{exportStats.teamMembers}</p>
              </div>
              <div className="text-center">
                <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
                <p className="text-sm font-medium text-green-800">Total Records</p>
                <p className="text-lg font-bold text-green-900">{exportStats.totalRecords}</p>
              </div>
            </div>
          )}

          {lastExportTime && (
            <div className="flex items-center space-x-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              <span>Last export: {lastExportTime}</span>
            </div>
          )}

          {/* Full Database Export */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Full Database Export</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={handleExportCSV}
                disabled={isExporting}
                className="bg-custom-dark-maroon hover:bg-custom-deep-maroon h-12"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export All Tables (CSV)
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleExportJSON}
                disabled={isExporting}
                variant="outline"
                className="h-12"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Export All Tables (JSON)
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Individual Table Export */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Individual Table Export</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="text-center space-y-3">
                  <Building2 className="w-8 h-8 text-blue-600 mx-auto" />
                  <div>
                    <h4 className="font-medium text-gray-900">Business Profiles</h4>
                    <p className="text-sm text-gray-600">Company information & applications</p>
                  </div>
                  <Button
                    onClick={() => handleExportIndividualTable('business_profiles')}
                    disabled={isExporting}
                    size="sm"
                    className="w-full"
                  >
                    {isExporting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-1" />
                        Export
                      </>
                    )}
                  </Button>
                </div>
              </Card>

              <Card className="p-4">
                <div className="text-center space-y-3">
                  <Users className="w-8 h-8 text-green-600 mx-auto" />
                  <div>
                    <h4 className="font-medium text-gray-900">User Profiles</h4>
                    <p className="text-sm text-gray-600">User account information</p>
                  </div>
                  <Button
                    onClick={() => handleExportIndividualTable('user_profiles')}
                    disabled={isExporting}
                    size="sm"
                    className="w-full"
                  >
                    {isExporting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-1" />
                        Export
                      </>
                    )}
                  </Button>
                </div>
              </Card>

              <Card className="p-4">
                <div className="text-center space-y-3">
                  <Users className="w-8 h-8 text-purple-600 mx-auto" />
                  <div>
                    <h4 className="font-medium text-gray-900">Team Members</h4>
                    <p className="text-sm text-gray-600">Team member details</p>
                  </div>
                  <Button
                    onClick={() => handleExportIndividualTable('team_members')}
                    disabled={isExporting}
                    size="sm"
                    className="w-full"
                  >
                    {isExporting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-1" />
                        Export
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </div>
          </div>

          {/* Export Information */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 text-blue-600" />
              Export Information
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <strong>CSV Format:</strong> Separate files for each table, compatible with Excel and Google Sheets</li>
              <li>• <strong>JSON Format:</strong> Complete database structure with metadata, ideal for backups</li>
              <li>• <strong>Individual Tables:</strong> Export specific tables in both CSV and JSON formats</li>
              <li>• <strong>Data Includes:</strong> All fields from business_profiles, user_profiles, and team_members tables</li>
              <li>• <strong>File Names:</strong> Automatically timestamped for easy organization</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};