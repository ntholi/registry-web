'use client';

import { ActionIcon, Button, Group } from '@mantine/core';
import { IconEdit } from '@tabler/icons-react';
import { modals } from '@mantine/modals';
import { getModule, updateModule } from '@/server/modules/actions';
import ModuleEditForm from './ModuleEditForm';
import { useRouter } from 'next/navigation';
import React from 'react'

type Props = {
    moduleId: number; //TODO: Should be semesterModuleId
};

export default function EditButton({ moduleId }: Props) {
  const router = useRouter();

  const openEditModal = async () => {
    const module = await getModule(moduleId);
    if (!module) return;

    modals.open({
      title: 'Edit Module',
      size: 'md',
      children: (
        <div>
          <ModuleEditForm
            defaultValues={module}
            onSubmit={(values) => updateModule(moduleId, values)}
          />
          <Group justify="flex-end" mt="lg">
            <Button variant="light" color="gray" onClick={() => modals.closeAll()}>
              Cancel
            </Button>
            <Button type="submit" form="module-edit-form">
              Save Changes
            </Button>
          </Group>
        </div>
      ),
    });
  };

  return (
    <ActionIcon
      variant="subtle"
      onClick={openEditModal}
    >
      <IconEdit size={'1rem'} />
    </ActionIcon>
  );
}
