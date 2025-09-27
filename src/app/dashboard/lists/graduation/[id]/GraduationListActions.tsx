'use client';

import { Button, Group } from '@mantine/core';
import { IconExternalLink, IconRefresh } from '@tabler/icons-react';
import { graduationLists } from '@/db/schema';
import { populateGraduationList } from '@/server/lists/graduation/actions';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';

type GraduationList = typeof graduationLists.$inferSelect;

interface Props {
  graduationList: GraduationList;
}

export function GraduationListActions({ graduationList }: Props) {
  const queryClient = useQueryClient();

  const populateMutation = useMutation({
    mutationFn: () => populateGraduationList(graduationList.id),
    onSuccess: () => {
      notifications.show({
        title: 'Success',
        message: 'Graduation list populated successfully',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['graduation-lists'] });
    },
    onError: (error) => {
      const errorMessage =
        error.message || 'Failed to populate graduation list';

      // Show appropriate notification based on error type
      if (errorMessage.includes('environment variables')) {
        notifications.show({
          title: 'Configuration Error',
          message:
            'Google Sheets integration is not configured. Please contact your administrator.',
          color: 'orange',
          autoClose: 8000,
        });
      } else if (errorMessage.includes('Permission denied')) {
        notifications.show({
          title: 'Permission Error',
          message:
            'Google Sheets permission denied. Please check the service account configuration.',
          color: 'red',
          autoClose: 8000,
        });
      } else {
        notifications.show({
          title: 'Error',
          message: errorMessage,
          color: 'red',
          autoClose: 8000,
        });
      }
    },
  });

  function handleOpenSpreadsheet() {
    if (graduationList.spreadsheetUrl) {
      window.open(graduationList.spreadsheetUrl, '_blank');
    }
  }

  function handlePopulate() {
    populateMutation.mutate();
  }

  return (
    <Group mt='md'>
      <Button
        variant='filled'
        leftSection={<IconRefresh size={16} />}
        onClick={handlePopulate}
        loading={populateMutation.isPending}
      >
        {graduationList.status === 'created'
          ? 'Populate List'
          : 'Repopulate List'}
      </Button>

      {graduationList.spreadsheetUrl && (
        <Button
          variant='outline'
          leftSection={<IconExternalLink size={16} />}
          onClick={handleOpenSpreadsheet}
        >
          Open Google Sheet
        </Button>
      )}
    </Group>
  );
}
