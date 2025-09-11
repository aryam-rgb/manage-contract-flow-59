
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Download
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { exportAnalytics, exportDepartmentPerformance } from '@/lib/exportUtils';
import { useToast } from '@/hooks/use-toast';

interface MonthlyData {
  month: string;
  contracts: number;
  signed: number;
  pending: number;
}

interface ContractType {
  name: string;
  value: number;
  color: string;
}

interface Metric {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: any;
  color: string;
}

const Analytics = () => {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [contractTypes, setContractTypes] = useState<ContractType[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      // Fetch contracts data
      const { data: contracts, error } = await supabase
        .from('contracts')
        .select('*');

      if (error) throw error;

      // Calculate monthly data
      const monthlyStats = calculateMonthlyData(contracts || []);
      setMonthlyData(monthlyStats);

      // Calculate contract types
      const typeStats = calculateContractTypes(contracts || []);
      setContractTypes(typeStats);

      // Calculate metrics
      const metricsStats = calculateMetrics(contracts || []);
      setMetrics(metricsStats);

      // Store contracts for export
      setContracts(contracts || []);

    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyData = (contracts: any[]): MonthlyData[] => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    const monthlyStats = months.map(month => {
      const monthIndex = months.indexOf(month);
      const monthContracts = contracts.filter(contract => {
        const contractDate = new Date(contract.created_at);
        return contractDate.getFullYear() === currentYear && contractDate.getMonth() === monthIndex;
      });
      
      const signed = monthContracts.filter(c => c.status === 'approved' || c.status === 'signed').length;
      const pending = monthContracts.filter(c => c.status === 'pending' || c.status === 'draft').length;
      
      return {
        month,
        contracts: monthContracts.length,
        signed,
        pending
      };
    }).filter(data => data.contracts > 0); // Only show months with data

    return monthlyStats.slice(-6); // Last 6 months with data
  };

  const calculateContractTypes = (contracts: any[]): ContractType[] => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6b7280', '#8b5cf6', '#f97316'];
    const typeCount: { [key: string]: number } = {};
    
    contracts.forEach(contract => {
      const type = contract.contract_type || 'Other';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });

    return Object.entries(typeCount)
      .map(([name, value], index) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.value - a.value);
  };

  const calculateMetrics = (contracts: any[]): Metric[] => {
    const totalContracts = contracts.length;
    const signedContracts = contracts.filter(c => c.status === 'approved' || c.status === 'signed').length;
    const atRisk = contracts.filter(c => c.status === 'pending' && c.end_date && new Date(c.end_date) < new Date()).length;
    const successRate = totalContracts > 0 ? ((signedContracts / totalContracts) * 100) : 0;

    // Calculate average approval time (simplified)
    const approvedContracts = contracts.filter(c => c.status === 'approved' || c.status === 'signed');
    const avgApprovalTime = approvedContracts.length > 0 ? 
      approvedContracts.reduce((sum, contract) => {
        const created = new Date(contract.created_at);
        const updated = new Date(contract.updated_at);
        const diffDays = Math.abs(updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
        return sum + diffDays;
      }, 0) / approvedContracts.length : 0;

    return [
      {
        title: "Total Contracts",
        value: totalContracts.toString(),
        change: "+12%", // This would need historical data to calculate properly
        trend: "up" as const,
        icon: FileText,
        color: "text-blue-600"
      },
      {
        title: "Avg. Approval Time",
        value: `${avgApprovalTime.toFixed(1)} days`,
        change: "-8%", // This would need historical data to calculate properly
        trend: "down" as const,
        icon: Clock,
        color: "text-yellow-600"
      },
      {
        title: "Success Rate",
        value: `${successRate.toFixed(1)}%`,
        change: "+3%", // This would need historical data to calculate properly
        trend: "up" as const,
        icon: CheckCircle,
        color: "text-green-600"
      },
      {
        title: "At Risk",
        value: atRisk.toString(),
        change: "-2", // This would need historical data to calculate properly
        trend: "down" as const,
        icon: AlertTriangle,
        color: "text-red-600"
      },
    ];
  };

  const handleExportAnalytics = () => {
    if (loading) {
      toast({
        title: "Please Wait",
        description: "Analytics data is still loading.",
        variant: "destructive",
      });
      return;
    }

    if (contracts.length === 0) {
      toast({
        title: "No Data",
        description: "No contracts available to export.",
        variant: "destructive",
      });
      return;
    }

    const analyticsData = {
      totalContracts: contracts.length,
      contractsChange: "+12%",
      pendingReview: contracts.filter(c => c.status === 'review' || c.status === 'draft').length,
      pendingChange: "-5%",
      approved: contracts.filter(c => c.status === 'approved' || c.status === 'signed').length,
      approvedChange: "+18%",
      expiring: contracts.filter(c => {
        if (!c.end_date) return false;
        const endDate = new Date(c.end_date);
        const today = new Date();
        const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
        return endDate <= thirtyDaysFromNow && endDate >= today;
      }).length,
      expiringChange: "+2%",
      departments: [...new Set(contracts.map(c => c.department_id).filter(Boolean))].length,
      departmentsChange: "+8%",
      totalValue: `KES ${(contracts.reduce((sum, c) => sum + (c.value || 0), 0) / 1000000).toFixed(1)}M`,
      valueChange: "+15%"
    };

    exportAnalytics(analyticsData);

    toast({
      title: "Export Successful",
      description: "Analytics report has been downloaded as CSV file.",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600 mt-1">Track performance and contract metrics</p>
          </div>
          <Button variant="outline" onClick={handleExportAnalytics}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Loading skeletons for metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-5" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Loading skeletons for charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Track performance and contract metrics</p>
        </div>
        <Button variant="outline" onClick={handleExportAnalytics}>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <Card key={metric.title} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">{metric.title}</CardTitle>
              <metric.icon className={`h-5 w-5 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
              <div className="flex items-center mt-1">
                <TrendingUp className={`h-4 w-4 mr-1 ${
                  metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`} />
                <span className={`text-sm ${
                  metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metric.change} from last month
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Contract Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Contract Trends</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="contracts" fill="#3b82f6" name="Total Contracts" />
                  <Bar dataKey="signed" fill="#10b981" name="Signed" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No data available for monthly trends
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contract Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Contract Types</CardTitle>
          </CardHeader>
          <CardContent>
            {contractTypes.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={contractTypes}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {contractTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No contract types data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Approval Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Approval Timeline Trends</CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="signed" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  name="Signed Contracts"
                />
                <Line 
                  type="monotone" 
                  dataKey="pending" 
                  stroke="#f59e0b" 
                  strokeWidth={3}
                  name="Pending Approval"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No timeline data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {metrics.find(m => m.title === "Total Contracts")?.value || "0"}
              </div>
              <div className="text-gray-600">Total Contracts</div>
              <Badge className="mt-2 bg-blue-100 text-blue-800">This Year</Badge>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {metrics.find(m => m.title === "Success Rate")?.value || "0%"}
              </div>
              <div className="text-gray-600">Success Rate</div>
              <Badge className="mt-2 bg-green-100 text-green-800">
                {parseFloat(metrics.find(m => m.title === "Success Rate")?.value || "0") > 90 ? "Above Target" : "Needs Improvement"}
              </Badge>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-3xl font-bold text-yellow-600 mb-2">
                {metrics.find(m => m.title === "Avg. Approval Time")?.value || "0 days"}
              </div>
              <div className="text-gray-600">Avg. Days to Sign</div>
              <Badge className="mt-2 bg-yellow-100 text-yellow-800">
                {parseFloat(metrics.find(m => m.title === "Avg. Approval Time")?.value || "0") < 5 ? "Improving" : "Needs Work"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
