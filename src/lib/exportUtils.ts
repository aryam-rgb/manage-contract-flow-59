import { Contract } from '@/hooks/useContracts';

export interface ExportOptions {
  filename?: string;
  format?: 'csv' | 'excel';
  includeHeaders?: boolean;
}

// Convert data to CSV format
export const convertToCSV = (data: any[], headers: string[]): string => {
  const csvHeaders = headers.join(',');
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      // Handle values that might contain commas, quotes, or newlines
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value || '';
    }).join(',')
  );
  
  return [csvHeaders, ...csvRows].join('\n');
};

// Download file
export const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Export contracts to CSV
export const exportContracts = (contracts: Contract[], options: ExportOptions = {}) => {
  const {
    filename = `contracts_export_${new Date().toISOString().split('T')[0]}.csv`,
    format = 'csv',
    includeHeaders = true
  } = options;

  const headers = [
    'id',
    'title',
    'contract_type',
    'status',
    'priority',
    'created_by',
    'assigned_to',
    'department_id',
    'unit_id',
    'description',
    'start_date',
    'end_date',
    'value',
    'created_at',
    'updated_at'
  ];

  const exportData = contracts.map(contract => ({
    id: contract.id,
    title: contract.title,
    contract_type: contract.contract_type,
    status: contract.status,
    priority: contract.priority,
    created_by: contract.created_by,
    assigned_to: contract.assigned_to || 'N/A',
    department_id: contract.department_id || 'N/A',
    unit_id: contract.unit_id || 'N/A',
    description: contract.description || 'N/A',
    start_date: contract.start_date ? new Date(contract.start_date).toLocaleDateString() : 'N/A',
    end_date: contract.end_date ? new Date(contract.end_date).toLocaleDateString() : 'N/A',
    value: contract.value ? `KES ${contract.value.toLocaleString()}` : 'N/A',
    created_at: new Date(contract.created_at).toLocaleDateString(),
    updated_at: new Date(contract.updated_at).toLocaleDateString()
  }));

  if (format === 'csv') {
    const csvContent = convertToCSV(exportData, headers);
    downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
  }
};

// Export analytics data
export const exportAnalytics = (analyticsData: any, options: ExportOptions = {}) => {
  const {
    filename = `analytics_report_${new Date().toISOString().split('T')[0]}.csv`,
    format = 'csv'
  } = options;

  const headers = ['metric', 'value', 'change', 'period'];
  
  const exportData = [
    { metric: 'Total Contracts', value: analyticsData.totalContracts, change: analyticsData.contractsChange, period: 'Current' },
    { metric: 'Pending Review', value: analyticsData.pendingReview, change: analyticsData.pendingChange, period: 'Current' },
    { metric: 'Approved/Signed', value: analyticsData.approved, change: analyticsData.approvedChange, period: 'Current' },
    { metric: 'Expiring Soon', value: analyticsData.expiring, change: analyticsData.expiringChange, period: 'Current' },
    { metric: 'Active Departments', value: analyticsData.departments, change: analyticsData.departmentsChange, period: 'Current' },
    { metric: 'Total Value', value: analyticsData.totalValue, change: analyticsData.valueChange, period: 'Current' }
  ];

  if (format === 'csv') {
    const csvContent = convertToCSV(exportData, headers);
    downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
  }
};

// Export department performance data
export const exportDepartmentPerformance = (departmentData: any[], options: ExportOptions = {}) => {
  const {
    filename = `department_performance_${new Date().toISOString().split('T')[0]}.csv`,
    format = 'csv'
  } = options;

  const headers = ['department', 'contracts', 'value', 'avg_contract_value'];
  
  const exportData = departmentData.map(dept => ({
    department: dept.department,
    contracts: dept.contracts,
    value: `KES ${dept.value.toLocaleString()}`,
    avg_contract_value: `KES ${(dept.value / dept.contracts).toLocaleString()}`
  }));

  if (format === 'csv') {
    const csvContent = convertToCSV(exportData, headers);
    downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
  }
};

// Generate PDF content for individual contracts
export const generateContractPDF = (contract: Contract): string => {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Contract Report - ${contract.title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { border-bottom: 2px solid #007bff; padding-bottom: 10px; margin-bottom: 20px; }
        .title { color: #007bff; font-size: 24px; margin: 0; }
        .subtitle { color: #666; margin: 5px 0 0 0; }
        .section { margin: 20px 0; }
        .section-title { font-size: 18px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 10px 0; }
        .info-item { margin: 8px 0; }
        .label { font-weight: bold; color: #555; }
        .value { margin-left: 10px; }
        .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
        .status-review { background: #fff3cd; color: #856404; }
        .status-approved { background: #d4edda; color: #155724; }
        .status-signed { background: #d1ecf1; color: #0c5460; }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="title">${contract.title}</h1>
        <p class="subtitle">Contract Report - Generated on ${new Date().toLocaleDateString()}</p>
    </div>
    
    <div class="section">
        <h2 class="section-title">Contract Details</h2>
        <div class="info-grid">
            <div class="info-item">
                <span class="label">Contract ID:</span>
                <span class="value">${contract.id}</span>
            </div>
            <div class="info-item">
                <span class="label">Type:</span>
                <span class="value">${contract.contract_type}</span>
            </div>
            <div class="info-item">
                <span class="label">Status:</span>
                <span class="value status status-${contract.status}">${contract.status.toUpperCase()}</span>
            </div>
            <div class="info-item">
                <span class="label">Priority:</span>
                <span class="value">${contract.priority}</span>
            </div>
            <div class="info-item">
                <span class="label">Start Date:</span>
                <span class="value">${contract.start_date ? new Date(contract.start_date).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="label">End Date:</span>
                <span class="value">${contract.end_date ? new Date(contract.end_date).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="label">Value:</span>
                <span class="value">${contract.value ? `KES ${contract.value.toLocaleString()}` : 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="label">Created:</span>
                <span class="value">${new Date(contract.created_at).toLocaleDateString()}</span>
            </div>
        </div>
    </div>
    
    ${contract.description ? `
    <div class="section">
        <h2 class="section-title">Description</h2>
        <p>${contract.description}</p>
    </div>
    ` : ''}
    
    <div class="section">
        <h2 class="section-title">Tracking Information</h2>
        <div class="info-item">
            <span class="label">Created By:</span>
            <span class="value">${contract.created_by}</span>
        </div>
        <div class="info-item">
            <span class="label">Assigned To:</span>
            <span class="value">${contract.assigned_to || 'Unassigned'}</span>
        </div>
        <div class="info-item">
            <span class="label">Last Updated:</span>
            <span class="value">${new Date(contract.updated_at).toLocaleDateString()}</span>
        </div>
    </div>
</body>
</html>
  `;
};

// Download contract as PDF (HTML version)
export const downloadContractPDF = (contract: Contract) => {
  const htmlContent = generateContractPDF(contract);
  const filename = `contract_${contract.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.html`;
  downloadFile(htmlContent, filename, 'text/html;charset=utf-8;');
};