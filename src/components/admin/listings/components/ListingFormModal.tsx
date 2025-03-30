"use client";

import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Listing, ListingFormData } from '../types';
import { ListingForm } from '../ListingForm';

interface ListingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ListingFormData) => Promise<void>;
  initialData?: Partial<ListingFormData>;
  listing?: Listing;
  siteSlug?: string;
  title?: string;
}

export function ListingFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  listing,
  siteSlug,
  title
}: ListingFormModalProps) {
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose} data-testid="listing-form-modal">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
                <div>
                  <div className="mt-3 text-center sm:mt-5">
                    <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900 text-left">
                      {title || (listing ? 'Edit Listing' : 'Create New Listing')}
                    </Dialog.Title>
                    <div className="mt-4">
                      <ListingForm
                        initialData={initialData}
                        onSubmit={async (data) => {
                          await onSubmit(data);
                          onClose();
                        }}
                        onCancel={onClose}
                        listing={listing}
                        siteSlug={siteSlug}
                      />
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

export default ListingFormModal;
