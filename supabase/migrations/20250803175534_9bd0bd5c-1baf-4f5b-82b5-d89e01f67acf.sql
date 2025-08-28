-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create departments table
CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create units table (belongs to departments)
CREATE TABLE public.units (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(department_id, name)
);

-- Create app roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'user');

-- Create user roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create contracts table
CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'rejected', 'active', 'expired')),
  contract_type TEXT NOT NULL DEFAULT 'service' CHECK (contract_type IN ('service', 'employment', 'vendor', 'nda', 'partnership')),
  department_id UUID REFERENCES public.departments(id),
  unit_id UUID REFERENCES public.units(id),
  assigned_to UUID REFERENCES auth.users(id),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  value DECIMAL(15,2),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contract workflow steps table
CREATE TABLE public.contract_workflow_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  step_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
  assigned_to UUID REFERENCES auth.users(id),
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  step_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_workflow_steps ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role 
      WHEN 'admin' THEN 1
      WHEN 'manager' THEN 2
      WHEN 'user' THEN 3
    END
  LIMIT 1
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- RLS Policies for departments
CREATE POLICY "Everyone can view departments"
ON public.departments
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage departments"
ON public.departments
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for units
CREATE POLICY "Everyone can view units"
ON public.units
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage units"
ON public.units
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles
CREATE POLICY "Admins can view all user roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for contracts
CREATE POLICY "Users can view contracts in their department or assigned to them"
ON public.contracts
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR
  assigned_to = auth.uid() OR
  created_by = auth.uid() OR
  department_id IN (
    SELECT d.id FROM public.departments d
    JOIN public.profiles p ON p.id = auth.uid()
  )
);

CREATE POLICY "Users can create contracts"
ON public.contracts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins and creators can update contracts"
ON public.contracts
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR
  created_by = auth.uid() OR
  assigned_to = auth.uid()
);

CREATE POLICY "Admins can delete contracts"
ON public.contracts
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for workflow steps
CREATE POLICY "Users can view workflow steps for accessible contracts"
ON public.contract_workflow_steps
FOR SELECT
TO authenticated
USING (
  contract_id IN (
    SELECT id FROM public.contracts
    WHERE public.has_role(auth.uid(), 'admin') OR
          assigned_to = auth.uid() OR
          created_by = auth.uid()
  )
);

CREATE POLICY "Users can manage workflow steps for accessible contracts"
ON public.contract_workflow_steps
FOR ALL
TO authenticated
USING (
  contract_id IN (
    SELECT id FROM public.contracts
    WHERE public.has_role(auth.uid(), 'admin') OR
          assigned_to = auth.uid() OR
          created_by = auth.uid()
  )
)
WITH CHECK (
  contract_id IN (
    SELECT id FROM public.contracts
    WHERE public.has_role(auth.uid(), 'admin') OR
          assigned_to = auth.uid() OR
          created_by = auth.uid()
  )
);

-- Create function to automatically create user profile and assign default role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'username', new.email),
    COALESCE(new.raw_user_meta_data ->> 'full_name', new.email)
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  RETURN new;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_units_updated_at
  BEFORE UPDATE ON public.units
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workflow_steps_updated_at
  BEFORE UPDATE ON public.contract_workflow_steps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample departments
INSERT INTO public.departments (name, description) VALUES
('Human Resources', 'Manages employee relations, recruitment, and policies'),
('Legal', 'Handles legal matters, compliance, and contract reviews'),
('Finance', 'Manages financial operations, budgets, and audits'),
('IT', 'Information technology services and infrastructure'),
('Operations', 'Day-to-day business operations and logistics');

-- Insert sample units for departments
INSERT INTO public.units (department_id, name, description)
SELECT d.id, u.name, u.description
FROM public.departments d
CROSS JOIN (
  VALUES 
    ('Recruitment', 'Talent acquisition and hiring'),
    ('Employee Relations', 'Employee support and conflict resolution'),
    ('Compliance', 'Legal compliance and risk management'),
    ('Contract Review', 'Contract analysis and approval'),
    ('Accounting', 'Financial record keeping and reporting'),
    ('Budget Planning', 'Financial planning and budget management'),
    ('Infrastructure', 'IT systems and network management'),
    ('Security', 'Information security and data protection'),
    ('Process Management', 'Business process optimization'),
    ('Quality Assurance', 'Quality control and standards')
) AS u(name, description)
WHERE (d.name = 'Human Resources' AND u.name IN ('Recruitment', 'Employee Relations'))
   OR (d.name = 'Legal' AND u.name IN ('Compliance', 'Contract Review'))
   OR (d.name = 'Finance' AND u.name IN ('Accounting', 'Budget Planning'))
   OR (d.name = 'IT' AND u.name IN ('Infrastructure', 'Security'))
   OR (d.name = 'Operations' AND u.name IN ('Process Management', 'Quality Assurance'));