
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { 
  FileText, Clock, CheckCircle, AlertCircle, TrendingUp, Users, 
  Calendar, DollarSign, Building, Award, AlertTriangle 
} from "lucide-react";

export function AdvancedDashboard() {
  const stats = [
    { title: "Total Contracts", value: "247", icon: FileText, color: "bg-blue-500", change: "+12%" },
    { title: "Pending Approval", value: "12", icon: Clock, color: "bg-yellow-500", change: "-5%" },
    { title: "Signed This Month", value: "34", icon: CheckCircle, color: "bg-green-500", change: "+18%" },
    { title: "Expiring Soon", value: "8", icon: AlertCircle, color: "bg-red-500", change: "+2%" },
    { title: "Active Vendors", value: "156", icon: Building, color: "bg-purple-500", change: "+8%" },
    { title: "Contract Value", value: "$2.4M", icon: DollarSign, color: "bg-indigo-500", change: "+15%" },
  ];

  const contractsByType = [
    { name: 'Service', value: 45, color: '#3B82F6' },
    { name: 'License', value: 32, color: '#10B981' },
    { name: 'Consultancy', value: 28, color: '#F59E0B' },
    { name: 'Supply', value: 25, color: '#EF4444' },
    { name: 'NDA', value: 18, color: '#8B5CF6' },
    { name: 'Other', value: 12, color: '#6B7280' }
  ];

  const contractsOverTime = [
    { month: 'Jan', signed: 12, pending: 8, expired: 3 },
    { month: 'Feb', signed: 15, pending: 6, expired: 2 },
    { month: 'Mar', signed: 18, pending: 10, expired: 4 },
    { month: 'Apr', signed: 22, pending: 12, expired: 1 },
    { month: 'May', signed: 28, pending: 15, expired: 5 },
    { month: 'Jun', signed: 34, pending: 12, expired: 3 }
  ];

  const departmentActivity = [
    { department: 'Legal', contracts: 45, value: 890000 },
    { department: 'IT', contracts: 38, value: 650000 },
    { department: 'Finance', contracts: 25, value: 420000 },
    { department: 'Operations', contracts: 32, value: 580000 },
    { department: 'HR', contracts: 18, value: 280000 },
    { department: 'Procurement', contracts: 28, value: 340000 }
  ];

  const upcomingEvents = [
    { id: 1, type: 'expiry', contract: 'Software License - Microsoft', date: '2024-02-15', days: 5 },
    { id: 2, type: 'review', contract: 'Service Agreement - TechCorp', date: '2024-02-18', days: 8 },
    { id: 3, type: 'renewal', contract: 'Office Lease Agreement', date: '2024-02-22', days: 12 },
    { id: 4, type: 'expiry', contract: 'Consulting Contract - ABC Ltd', date: '2024-02-25', days: 15 }
  ];

  const recentActivities = [
    { id: 1, action: 'Contract Approved', user: 'Jane Smith', contract: 'Service Agreement - XYZ Corp', time: '2 hours ago' },
    { id: 2, action: 'Contract Submitted', user: 'Mike Johnson', contract: 'NDA - Tech Solutions', time: '4 hours ago' },
    { id: 3, action: 'Review Completed', user: 'Sarah Wilson', contract: 'License Agreement - Software Inc', time: '6 hours ago' },
    { id: 4, action: 'Contract Created', user: 'David Brown', contract: 'Supply Contract - Materials Ltd', time: '1 day ago' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contract Management Dashboard</h1>
          <p className="text-gray-600 mt-1">Comprehensive overview of contract lifecycle and performance</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Review
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <FileText className="h-4 w-4 mr-2" />
            New Contract
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="flex items-center mt-1">
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                <span className="text-xs text-green-600">{stat.change}</span>
                <span className="text-xs text-gray-500 ml-1">vs last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contract Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Contracts by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={contractsByType}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {contractsByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {contractsByType.map((item) => (
                <div key={item.name} className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm text-gray-600">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contract Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Contract Activity Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={contractsOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="signed" stroke="#10B981" strokeWidth={2} />
                <Line type="monotone" dataKey="pending" stroke="#F59E0B" strokeWidth={2} />
                <Line type="monotone" dataKey="expired" stroke="#EF4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Department Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="contracts" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{event.contract}</h4>
                    <p className="text-sm text-gray-600 capitalize">{event.type} on {event.date}</p>
                  </div>
                  <Badge className={
                    event.days <= 7 ? 'bg-red-100 text-red-800' :
                    event.days <= 14 ? 'bg-orange-100 text-orange-800' :
                    'bg-yellow-100 text-yellow-800'
                  }>
                    {event.days} days
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Recent Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{activity.action}</span>
                    <span className="text-sm text-gray-500">by {activity.user}</span>
                  </div>
                  <p className="text-sm text-gray-600">{activity.contract}</p>
                </div>
                <span className="text-xs text-gray-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
