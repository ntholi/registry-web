'use client';

import {
  getModule,
  updateModule,
  getModulePrerequisites,
} from '@/server/modules/actions';
import { ActionIcon, Button, Group } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconEdit } from '@tabler/icons-react';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import ModuleEditForm from './ModuleEditForm';

type Props = {
  moduleId: number;
  structureId: number;
};

export default function EditButton({ moduleId, structureId }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const openEditModal = async () => {
    try {
      const [mod, prerequisites] = await Promise.all([
        getModule(moduleId),
        getModulePrerequisites(moduleId),
      ]);

      if (!mod) {
        throw new Error('Module not found');
      }

      modals.closeAll();
      modals.open({
        title: 'Edit Module Visibility & Prerequisites',
        size: 'md',
        children: (
          <div>
            <ModuleEditForm
              defaultValues={{
                ...mod,
                prerequisiteCodes: prerequisites.map((p) => p.code),
              }}
              onSubmit={async (values) => {
                setIsSubmitting(true);
                try {
                  const result = await updateModule(moduleId, values);
                  await Promise.all([
                    queryClient.invalidateQueries({
                      queryKey: ['modulePrerequisites', moduleId],
                    }),
                    queryClient.invalidateQueries({
                      queryKey: ['structure', structureId],
                    }),
                  ]);
                  return result;
                } finally {
                  setIsSubmitting(false);
                }
              }}
            />
            <Group justify='flex-end' mt='lg'>
              <Button
                variant='light'
                color='gray'
                onClick={() => modals.closeAll()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                form='module-edit-form'
                loading={isSubmitting}
              >
                Save Changes
              </Button>
            </Group>
          </div>
        ),
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message:
          error instanceof Error ? error.message : 'Failed to load module',
        color: 'red',
      });
      modals.closeAll();
    }
  };

  return (
    <ActionIcon variant='subtle' onClick={openEditModal}>
      <IconEdit size={'1rem'} />
    </ActionIcon>
  );
}
