
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  FileText, 
  Plus, 
  Eye,
  Copy,
  Edit
} from "lucide-react";

const Templates = () => {
  const templates = [
    {
      id: 1,
      name: "Employment Contract",
      description: "Standard employment agreement template with customizable terms",
      category: "HR",
      lastModified: "2024-01-10",
      usageCount: 45,
      isPublic: true
    },
    {
      id: 2,
      name: "Non-Disclosure Agreement",
      description: "Comprehensive NDA template for protecting confidential information",
      category: "Legal",
      lastModified: "2024-01-08",
      usageCount: 32,
      isPublic: true
    },
    {
      id: 3,
      name: "Service Agreement",
      description: "Professional services contract template with milestone tracking",
      category: "Services",
      lastModified: "2024-01-05",
      usageCount: 28,
      isPublic: false
    },
    {
      id: 4,
      name: "Software License Agreement",
      description: "Software licensing terms and conditions template",
      category: "Technology",
      lastModified: "2024-01-03",
      usageCount: 15,
      isPublic: true
    },
  ];

  const categories = ["All", "HR", "Legal", "Services", "Technology"];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contract Templates</h1>
          <p className="text-gray-600 mt-1">Create and manage reusable contract templates</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Search and Categories */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search templates..."
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {categories.map((category) => (
                <Button key={category} variant="outline" size="sm">
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <Badge variant="outline">{template.category}</Badge>
                </div>
                {template.isPublic && (
                  <Badge className="bg-green-100 text-green-800">Public</Badge>
                )}
              </div>
              <CardTitle className="text-lg">{template.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4">{template.description}</p>
              
              <div className="space-y-2 text-sm text-gray-500 mb-4">
                <div className="flex justify-between">
                  <span>Last modified:</span>
                  <span>{template.lastModified}</span>
                </div>
                <div className="flex justify-between">
                  <span>Used:</span>
                  <span>{template.usageCount} times</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Copy className="h-4 w-4 mr-1" />
                  Use
                </Button>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create New Template Card */}
      <Card className="border-dashed border-2 border-gray-300 hover:border-blue-400 transition-colors">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Plus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Create New Template</h3>
            <p className="text-gray-600 mb-4">Start with a blank template or import from an existing contract</p>
            <div className="flex justify-center space-x-3">
              <Button variant="outline">Import from Contract</Button>
              <Button className="bg-blue-600 hover:bg-blue-700">Start from Scratch</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Templates;
