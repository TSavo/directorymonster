"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, Eye, AlertCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { RoleScope } from '@/types/role';

interface PermissionTemplate {
  id: string;
  name: string;
  description: string;
  permissions: Record<string, string[]>;
  category: string;
  scope: RoleScope;
  siteId?: string;
}

interface PermissionTemplateSelectorProps {
  onSelectTemplate: (template: PermissionTemplate) => void;
  scope: RoleScope;
  siteId?: string;
}

export function PermissionTemplateSelector({
  onSelectTemplate,
  scope,
  siteId
}: PermissionTemplateSelectorProps) {
  const [templates, setTemplates] = useState<PermissionTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState<PermissionTemplate | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Build query parameters
        const params = new URLSearchParams();
        params.append('scope', scope);
        if (scope === 'site' && siteId) {
          params.append('siteId', siteId);
        }

        const response = await fetch(`/api/admin/roles/wizard/templates?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch templates');
        }

        const data = await response.json();
        setTemplates(data.templates || []);
      } catch (error) {
        setError('Failed to load permission templates');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, [scope, siteId]);

  const handleSelectTemplate = () => {
    const template = templates.find(t => t.id === selectedTemplateId);
    if (template) {
      onSelectTemplate(template);
    }
  };

  const handlePreviewTemplate = (template: PermissionTemplate) => {
    setPreviewTemplate(template);
    setIsPreviewOpen(true);
  };

  // Get unique categories from templates
  const categories = ['all', ...new Set(templates.map(t => t.category))];

  // Filter templates by category and search query
  const filteredTemplates = templates.filter(template => {
    const matchesCategory = activeCategory === 'all' || template.category === activeCategory;
    const matchesSearch = searchQuery === '' ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/10 p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-destructive">{error}</h3>
          </div>
        </div>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-10 border rounded-md bg-muted/20">
        <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-sm font-semibold">No templates available</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          There are no permission templates available for this scope.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          {categories.map(category => (
            <Button
              key={category}
              variant={activeCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(category)}
              className="capitalize"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      <RadioGroup value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map(template => (
            <Card
              key={template.id}
              className={`cursor-pointer transition-all ${
                selectedTemplateId === template.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedTemplateId(template.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <RadioGroupItem
                    value={template.id}
                    id={`template-${template.id}`}
                    className="mt-1"
                  />
                  <CardTitle className="text-lg ml-2 flex-1">{template.name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreviewTemplate(template);
                    }}
                    data-testid="preview-button"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Includes permissions for:</span>
                  <ul className="mt-1 list-disc list-inside">
                    {Object.keys(template.permissions).slice(0, 3).map(resource => (
                      <li key={resource} className="capitalize">{resource}</li>
                    ))}
                    {Object.keys(template.permissions).length > 3 && (
                      <li>+{Object.keys(template.permissions).length - 3} more</li>
                    )}
                  </ul>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTemplateId(template.id);
                    handleSelectTemplate();
                  }}
                >
                  Use Template
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </RadioGroup>

      {selectedTemplateId && (
        <div className="flex justify-end">
          <Button onClick={handleSelectTemplate}>
            Apply Template
          </Button>
        </div>
      )}

      {/* Template Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name}</DialogTitle>
            <DialogDescription>{previewTemplate?.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="capitalize">
                {previewTemplate?.category}
              </Badge>
              <Badge variant="secondary">
                {previewTemplate?.scope === 'tenant' ? 'Tenant-wide' : 'Site-specific'}
              </Badge>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Included Permissions:</h4>
              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  {previewTemplate && Object.entries(previewTemplate.permissions).map(([resource, actions]) => (
                    <div key={resource} className="space-y-2">
                      <h5 className="font-medium capitalize">{resource}</h5>
                      <div className="flex flex-wrap gap-2">
                        {actions.map(action => (
                          <Badge key={action} variant="outline">
                            {action}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button
              onClick={() => {
                if (previewTemplate) {
                  setSelectedTemplateId(previewTemplate.id);
                  onSelectTemplate(previewTemplate);
                  setIsPreviewOpen(false);
                }
              }}
            >
              Use This Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
