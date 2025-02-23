import { ActionIcon } from '@mantine/core';
import { IconEdit } from '@tabler/icons-react';
import Link from 'next/link';
import React from 'react'

type Props = {
    moduleId: number; //TODO: Should be semesterModuleId
};

  
export default function EditButton({moduleId}: Props) {
  return (
    <ActionIcon
    component={Link}
    href={`/admin/modules/${moduleId}/edit`}
    variant='subtle'>
        <IconEdit size={'1rem'} />
    </ActionIcon> 
  )
}
