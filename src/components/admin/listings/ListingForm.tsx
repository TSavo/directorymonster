"use client";

import React from 'react';
import { Listing, ListingFormData } from './types';
import { ListingFormContainer } from './ListingFormContainer';

interface ListingFormProps {
  initialData?: Partial<ListingFormData>;
  onSubmit: (data: ListingFormData) => Promise<void>;
  onCancel?: () => void;
  listing?: Listing;
  siteSlug?: string;
}

export function ListingForm(props: ListingFormProps) {
  return <ListingFormContainer {...props} />;
}

export default ListingForm;
