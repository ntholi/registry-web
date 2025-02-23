'use client';

import { ActionIcon, Button, Group, Loader, Stack } from '@mantine/core';
import { IconEdit } from '@tabler/icons-react';
import { modals } from '@mantine/modals';
import { getModule, updateModule } from '@/server/modules/actions';
import ModuleEditForm from './ModuleEditForm';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { notifications } from '@mantine/notifications';

type Props = {
  moduleId: number;
};

export default function EditButton({ moduleId }: Props) {
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openEditModal = async () => {
    const loadingModalId = modals.open({
      title: 'Edit Module',
      size: 'md',
      withCloseButton: false,
      closeOnClickOutside: false,
      children: (
        <Stack h={300} align='center' justify='center'>
          <Loader size='md' />
        </Stack>
      ),
    });

    setLoading(true);
    try {
      const module = await getModule(moduleId);
      if (!module) {
        throw new Error('Module not found');
      }

      modals.closeAll();
      modals.open({
        title: 'Edit Module',
        size: 'md',
        children: (
          <div>
            <ModuleEditForm
              defaultValues={module}
              onSubmit={async (values) => {
                setIsSubmitting(true);
                try {
                  const result = await updateModule(moduleId, values);
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <ActionIcon variant='subtle' onClick={openEditModal}>
      <IconEdit size={'1rem'} />
    </ActionIcon>
  );
}
