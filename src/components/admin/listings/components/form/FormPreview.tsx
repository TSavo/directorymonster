import React from 'react';
import { Listing } from '@/components/admin/listings/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';

interface FormPreviewProps {
  listing: Partial<Listing>;
  onEdit: (step: number) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

const FormPreview: React.FC<FormPreviewProps> = ({
  listing,
  onEdit,
  onSubmit,
  isSubmitting
}) => {
  if (!listing) return null;

  const {
    title,
    description,
    category,
    images,
    price,
    salePrice,
    backlinkUrl,
    backlinkText,
    status
  } = listing;

  return (
    <div className="space-y-6" data-testid="listing-preview">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Preview Your Listing</h2>
        <div className="flex items-center space-x-2">
          <Badge variant={status === 'active' ? 'success' : 'secondary'}>
            {status || 'Draft'}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{title || 'Untitled Listing'}</CardTitle>
          <CardDescription>
            Category: {category?.name || 'Uncategorized'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Images */}
          {images && images.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Images</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((image, idx) => (
                  <div key={idx} className="relative aspect-square rounded-md overflow-hidden border">
                    <Image
                      src={typeof image === 'string' ? image : URL.createObjectURL(image)}
                      alt={`Listing image ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onEdit(3)}
                className="mt-2"
              >
                Edit Images
              </Button>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Description</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onEdit(1)}
              >
                Edit Details
              </Button>
            </div>
            <div className="prose prose-sm max-w-none">
              {description || 'No description provided.'}
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Pricing</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onEdit(4)}
              >
                Edit Pricing
              </Button>
            </div>
            <div className="flex flex-col space-y-1">
              {price ? (
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Price:</span>
                  <span>{formatCurrency(price)}</span>
                </div>
              ) : null}

              {salePrice ? (
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Sale Price:</span>
                  <span>{formatCurrency(salePrice)}</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Backlink */}
          {(backlinkUrl || backlinkText) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Backlink Information</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onEdit(5)}
                >
                  Edit Backlink
                </Button>
              </div>
              <div className="flex flex-col space-y-1">
                {backlinkText && (
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Link Text:</span>
                    <span>{backlinkText}</span>
                  </div>
                )}
                {backlinkUrl && (
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">URL:</span>
                    <a 
                      href={backlinkUrl}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline truncate max-w-xs"
                    >
                      {backlinkUrl}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4 mt-8">
        <Button 
          variant="outline" 
          onClick={() => onEdit(0)}
        >
          Back to Editing
        </Button>
        <Button 
          onClick={onSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Listing'}
        </Button>
      </div>
    </div>
  );
};

export default FormPreview;