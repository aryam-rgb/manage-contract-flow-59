-- Create contract activities table for tracking TAT and status changes
CREATE TABLE public.contract_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('status_change', 'assignment', 'review', 'approval', 'rejection', 'comment', 'file_upload')),
  description TEXT NOT NULL,
  previous_value TEXT,
  new_value TEXT,
  performed_by UUID NOT NULL,
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contract_activities ENABLE ROW LEVEL SECURITY;

-- Create policies for contract activities
CREATE POLICY "Users can view activities for accessible contracts" 
ON public.contract_activities 
FOR SELECT 
USING (contract_id IN (
  SELECT contracts.id
  FROM contracts
  WHERE has_role(auth.uid(), 'admin'::app_role) 
    OR contracts.assigned_to = auth.uid() 
    OR contracts.created_by = auth.uid()
));

CREATE POLICY "Users can create activities for accessible contracts" 
ON public.contract_activities 
FOR INSERT 
WITH CHECK (
  contract_id IN (
    SELECT contracts.id
    FROM contracts
    WHERE has_role(auth.uid(), 'admin'::app_role) 
      OR contracts.assigned_to = auth.uid() 
      OR contracts.created_by = auth.uid()
  ) AND performed_by = auth.uid()
);

-- Create function to automatically track contract status changes
CREATE OR REPLACE FUNCTION public.track_contract_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Track status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.contract_activities (
      contract_id,
      activity_type,
      description,
      previous_value,
      new_value,
      performed_by
    ) VALUES (
      NEW.id,
      'status_change',
      'Contract status changed from ' || COALESCE(OLD.status, 'null') || ' to ' || NEW.status,
      OLD.status,
      NEW.status,
      auth.uid()
    );
  END IF;

  -- Track assignment changes
  IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
    INSERT INTO public.contract_activities (
      contract_id,
      activity_type,
      description,
      previous_value,
      new_value,
      performed_by
    ) VALUES (
      NEW.id,
      'assignment',
      'Contract assignment changed',
      OLD.assigned_to::TEXT,
      NEW.assigned_to::TEXT,
      auth.uid()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic activity tracking
CREATE TRIGGER track_contract_changes_trigger
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.track_contract_changes();

-- Add indexes for performance
CREATE INDEX idx_contract_activities_contract_id ON public.contract_activities(contract_id);
CREATE INDEX idx_contract_activities_performed_at ON public.contract_activities(performed_at DESC);