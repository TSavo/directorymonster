import React from 'react';

export default function AdminSettingsPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">System Settings</h1>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">General Settings</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Platform-wide configuration and options.</p>
        </div>
        
        <div className="px-4 py-5 sm:p-6 space-y-6">
          <div>
            <label htmlFor="site-name" className="block text-sm font-medium text-gray-700">Platform Name</label>
            <div className="mt-1">
              <input
                type="text"
                name="site-name"
                id="site-name"
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                defaultValue="DirectoryMonster"
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">This will be displayed in system emails and admin pages.</p>
          </div>
          
          <div>
            <label htmlFor="admin-email" className="block text-sm font-medium text-gray-700">Admin Email</label>
            <div className="mt-1">
              <input
                type="email"
                name="admin-email"
                id="admin-email"
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="admin@example.com"
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">System notifications will be sent to this address.</p>
          </div>
          
          <div>
            <fieldset>
              <legend className="text-sm font-medium text-gray-700">Default Settings for New Sites</legend>
              <div className="mt-2 space-y-4">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="auto-approve-listings"
                      name="auto-approve-listings"
                      type="checkbox"
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="auto-approve-listings" className="font-medium text-gray-700">Auto-approve new listings</label>
                    <p className="text-gray-500">When enabled, new listings will be automatically approved without review.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="enable-search"
                      name="enable-search"
                      type="checkbox"
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                      defaultChecked
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="enable-search" className="font-medium text-gray-700">Enable site search</label>
                    <p className="text-gray-500">When enabled, users can search for listings and categories.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="enable-analytics"
                      name="enable-analytics"
                      type="checkbox"
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                      defaultChecked
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="enable-analytics" className="font-medium text-gray-700">Enable analytics tracking</label>
                    <p className="text-gray-500">When enabled, site usage data will be collected and displayed in the dashboard.</p>
                  </div>
                </div>
              </div>
            </fieldset>
          </div>
        </div>
        
        <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
