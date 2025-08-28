
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, AlertCircle, FileText, User, Calendar } from "lucide-react";

interface WorkflowStep {
  id: string;
  title: string;
  status: 'completed' | 'current' | 'pending';
  actor: string;
  date?: string;
  comments?: string;
}

interface WorkflowStatusProps {
  contractId: string;
  currentStep: number;
  steps: WorkflowStep[];
  onAction?: (action: string) => void;
}

export function WorkflowStatus({ contractId, currentStep, steps, onAction }: WorkflowStatusProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'current':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'current':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'pending':
        return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="mr-2 h-5 w-5" />
          Contract Workflow - {contractId}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                {getStatusIcon(step.status)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">{step.title}</h4>
                  {getStatusBadge(step.status)}
                </div>
                <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <User className="mr-1 h-4 w-4" />
                    {step.actor}
                  </div>
                  {step.date && (
                    <div className="flex items-center">
                      <Calendar className="mr-1 h-4 w-4" />
                      {step.date}
                    </div>
                  )}
                </div>
                {step.comments && (
                  <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    {step.comments}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {currentStep < steps.length - 1 && (
          <div className="mt-6 flex space-x-3">
            <Button onClick={() => onAction?.('approve')} className="bg-green-600 hover:bg-green-700">
              Approve & Continue
            </Button>
            <Button onClick={() => onAction?.('return')} variant="outline">
              Return for Changes
            </Button>
            <Button onClick={() => onAction?.('reject')} variant="destructive">
              Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
