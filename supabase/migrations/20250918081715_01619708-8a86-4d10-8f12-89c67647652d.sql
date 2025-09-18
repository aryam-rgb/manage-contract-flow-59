-- Fix security issue: Add search_path to track_contract_changes function
CREATE OR REPLACE FUNCTION public.track_contract_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
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
$function$;