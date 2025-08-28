import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, User, FileText, CheckCircle, XCircle, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface Activity {
  id: string;
  contract_id: string;
  activity_type: string;
  description: string;
  previous_value: string | null;
  new_value: string | null;
  performed_by: string;
  performed_at: string;
  metadata: any;
}

interface ContractActivitiesProps {
  contractId: string;
}

export function ContractActivities({ contractId }: ContractActivitiesProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchActivities();
  }, [contractId]);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('contract_activities')
        .select('*')
        .eq('contract_id', contractId)
        .order('performed_at', { ascending: false });

      if (error) throw error;
      setActivities(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch activities: " + error.message
      });
    } finally {
      setLoading(false);
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
      case 'rejection':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'comment':
        return <MessageCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'status_change':
        return 'bg-blue-100 text-blue-800';
      case 'assignment':
        return 'bg-purple-100 text-purple-800';
      case 'approval':
        return 'bg-green-100 text-green-800';
      case 'rejection':
        return 'bg-red-100 text-red-800';
      case 'comment':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex space-x-3">
                <div className="w-8 h-8 bg-muted rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>Recent Activities & TAT Tracking</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No activities recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    {getActivityIcon(activity.activity_type)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <Badge className={getActivityColor(activity.activity_type)}>
                      {activity.activity_type.replace('_', ' ')}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.performed_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground mt-1">{activity.description}</p>
                  {activity.previous_value && activity.new_value && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      <span className="line-through">{activity.previous_value}</span>
                      {' → '}
                      <span className="font-medium">{activity.new_value}</span>
                    </div>
                  )}
                  <div className="flex items-center mt-2 space-x-2">
                    <Avatar className="w-4 h-4">
                      <AvatarFallback className="text-xs">
                        {activity.performed_by ? 'U' : '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">
                      User ID: {activity.performed_by || 'System'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}