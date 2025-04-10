"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Shield, Globe, Clock, Lock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface UserDetailTabsProps {
  userId: string;
  activeTab: string;
}

export function UserDetailTabs({ userId, activeTab }: UserDetailTabsProps) {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user details
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/admin/users/${userId}`);

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    router.push(`/admin/users/${userId}/${value}`);
  };

  // Handle back button
  const handleBack = () => {
    router.push('/admin/users');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            className="flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Users
          </Button>

          {isLoading ? (
            <Skeleton className="h-8 w-40" data-testid="skeleton" />
          ) : (
            <h1 className="text-2xl font-bold tracking-tight">
              {user?.name || 'User Details'}
            </h1>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid grid-cols-5 w-full max-w-3xl">
          <TabsTrigger value="details" className="flex items-center gap-1">
            <User className="h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-1">
            <Shield className="h-4 w-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="sites" className="flex items-center gap-1">
            <Globe className="h-4 w-4" />
            Sites
          </TabsTrigger>
          <TabsTrigger value="activities" className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            Activities
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-1">
            <Lock className="h-4 w-4" />
            Permissions
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}

export default UserDetailTabs;
