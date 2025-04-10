import { redirect } from 'next/navigation';

interface UserPageProps {
  params: {
    id: string;
  };
}

export default function UserPage({ params }: UserPageProps) {
  // Redirect to the details page
  redirect(`/admin/users/${params.id}/details`);
}
