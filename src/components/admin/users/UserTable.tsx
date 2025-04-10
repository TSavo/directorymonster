'use client';

import React from 'react';
import { UserTable as NewUserTable } from './table/UserTable';

/**
 * UserTable Component
 *
 * This component displays a table of users with actions to add, edit, and delete users.
 * It has been refactored to use a container/presentation pattern with multiple specialized components,
 * each with their own concerns and hooks.
 */
export function UserTable() {
  return <NewUserTable />;
}

export default UserTable;
