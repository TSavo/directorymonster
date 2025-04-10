"use client";

import React from 'react';
import { useRoleForm, UseRoleFormProps } from './hooks/useRoleForm';
import { RoleFormPresentation } from './RoleFormPresentation';

export type RoleFormContainerProps = UseRoleFormProps;

export function RoleFormContainer(props: RoleFormContainerProps) {
  const hookResult = useRoleForm(props);
  
  return (
    <RoleFormPresentation
      {...hookResult}
      siteOptions={props.siteOptions}
      onCancel={props.onCancel}
    />
  );
}
