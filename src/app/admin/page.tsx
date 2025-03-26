import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: 'Manage your directory sites and SEO settings',
}

export default function AdminDashboard() {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded p-4">
          <h2 className="text-xl font-semibold mb-3">Your Directory Sites</h2>
          <p className="text-gray-500">No sites created yet.</p>
          <button className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">
            Create New SEO Site
          </button>
        </div>
        <div className="border rounded p-4">
          <h2 className="text-xl font-semibold mb-3">Platform Stats</h2>
          <div className="space-y-2">
            <p>Total Sites: 0</p>
            <p>Total Listings: 0</p>
            <p>Total Backlinks: 0</p>
          </div>
        </div>
      </div>
    </main>
  )
}