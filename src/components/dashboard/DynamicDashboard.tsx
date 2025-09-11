import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { 
  FileText, Clock, CheckCircle, AlertCircle, TrendingUp, Users, 
  Calendar, DollarSign, Building, Award, AlertTriangle, User, MessageCircle, Activity, Download 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';
import { exportDepartmentPerformance } from "@/lib/exportUtils";

interface ContractStats {
  total: number;
  pending: number;
  approved: number;
  expiring: number;
  totalValue: number;
  byType: Array<{name: string, value: number, color: string}>;
  byDepartment: Array<{department: string, contracts: number, value: number}>;
}

interface RecentActivity {
  id: string;
  activity_type: string;
  description: string;
  performed_at: string;
  performed_by: string;
  contract_id: string;
}

export function DynamicDashboard() {
  const [stats, setStats] = useState<ContractStats>({
    total: 0,
    pending: 0,
    approved: 0,
    expiring: 0,
    totalValue: 0,
    byType: [],
    byDepartment: []
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardStats();
    fetchRecentActivities();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch all contracts with related data
      const { data: contracts, error } = await supabase
        .from('contracts')
        .select(`
          *,
          departments (
            name
          )
        `);

      if (error) throw error;

      if (contracts) {
        // Calculate basic stats
        const total = contracts.length;
        const pending = contracts.filter(c => c.status === 'review' || c.status === 'draft').length;
        const approved = contracts.filter(c => c.status === 'approved' || c.status === 'signed').length;
        
        // Calculate expiring contracts (within 30 days)
        const today = new Date();
        const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
        const expiring = contracts.filter(c => {
          if (!c.end_date) return false;
          const endDate = new Date(c.end_date);
          return endDate <= thirtyDaysFromNow && endDate >= today;
        }).length;

        // Calculate total value
        const totalValue = contracts.reduce((sum, c) => sum + (c.value || 0), 0);

        // Group by type
        const typeGroups = contracts.reduce((acc, contract) => {
          const type = contract.contract_type || 'other';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const typeColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#6B7280'];
        const byType = Object.entries(typeGroups).map(([name, value], index) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
          color: typeColors[index % typeColors.length]
        }));

        // Group by department
        const deptGroups = contracts.reduce((acc, contract) => {
          const dept = contract.departments?.name || 'Unassigned';
          if (!acc[dept]) {
            acc[dept] = { contracts: 0, value: 0 };
          }
          acc[dept].contracts += 1;
          acc[dept].value += contract.value || 0;
          return acc;
        }, {} as Record<string, {contracts: number, value: number}>);

        const byDepartment = Object.entries(deptGroups).map(([department, data]) => ({
          department,
          contracts: data.contracts,
          value: data.value
        }));

        setStats({
          total,
          pending,
          approved,
          expiring,
          totalValue,
          byType,
          byDepartment
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch dashboard data: " + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('contract_activities')
        .select('*')
        .order('performed_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentActivities(data || []);
    } catch (error: any) {
      console.error('Failed to fetch recent activities:', error.message);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'status_change':
        return <CheckCircle className="h-4 w-4" />;
      case 'assignment':
        return <User className="h-4 w-4" />;
      case 'review':
        return <FileText className="h-4 w-4" />;
      case 'approval':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'comment':
        return <MessageCircle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const dashboardStats = [
    { title: "Total Contracts", value: stats.total.toString(), icon: FileText, color: "bg-primary/90", change: "+12%" },
    { title: "Pending Review", value: stats.pending.toString(), icon: Clock, color: "bg-orange-500/90", change: "-5%" },
    { title: "Approved/Signed", value: stats.approved.toString(), icon: CheckCircle, color: "bg-green-500/90", change: "+18%" },
    { title: "Expiring Soon", value: stats.expiring.toString(), icon: AlertCircle, color: "bg-destructive/90", change: "+2%" },
    { title: "Active Departments", value: stats.byDepartment.length.toString(), icon: Building, color: "bg-purple-500/90", change: "+8%" },
    { title: "Total Value", value: `KES ${(stats.totalValue / 1000000).toFixed(1)}M`, icon: DollarSign, color: "bg-indigo-500/90", change: "+15%" },
  ];

  const handleScheduleReview = () => {
    navigate('/schedule-review');
  };

  const handleNewContract = () => {
    navigate('/create-contract');
  };

  const handleExportDashboard = () => {
    if (stats.byDepartment.length === 0) {
      toast({
        title: "No Data",
        description: "No department data available to export.",
        variant: "destructive",
      });
      return;
    }

    exportDepartmentPerformance(stats.byDepartment);

    toast({
      title: "Export Successful",
      description: "Dashboard report has been downloaded as CSV file.",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contract Management Dashboard</h1>
          <p className="text-muted-foreground mt-1">Comprehensive overview of contract lifecycle and performance</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handleScheduleReview}>
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Review
          </Button>
          <Button variant="outline" onClick={handleExportDashboard}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={handleNewContract}>
            <FileText className="h-4 w-4 mr-2" />
            New Contract
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dashboardStats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-lg transition-all duration-200 hover:scale-105 border-l-4 border-l-primary/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                    <span className="text-xs text-green-600 font-medium">{stat.change}</span>
                    <span className="text-xs text-muted-foreground ml-1">vs last month</span>
                  </div>
                </div>
                <div className={`p-3 rounded-xl ${stat.color} shadow-lg`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contract Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Contracts by Type</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.byType.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.byType}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {stats.byType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {stats.byType.map((item) => (
                    <div key={item.name} className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm text-muted-foreground">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No contract data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Department Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Department Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.byDepartment.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.byDepartment}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="contracts" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No department data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Recent Activities</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivities.length > 0 ? (
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        {getActivityIcon(activity.activity_type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{activity.description}</p>
                      <div className="flex items-center mt-2 space-x-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(activity.performed_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No recent activities</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}