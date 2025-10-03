'use client';

import { Button } from '@mantine/core';
import { IconFileSpreadsheet, IconRefresh } from '@tabler/icons-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  checkGoogleSheetsAccess,
  populateGraduationList,
} from '@/server/lists/graduation/actions';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';

interface PopulateButtonProps {
  listId: string;
  isPopulated: boolean;
  onSuccess?: () => void;
}

export default function PopulateButton({
  listId,
  isPopulated,
  onSuccess,
}: PopulateButtonProps) {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const { data: hasAccess, refetch: recheckAccess } = useQuery({
    queryKey: ['google-sheets-access'],
    queryFn: () => checkGoogleSheetsAccess(),
  });

  const populateMutation = useMutation({
    mutationFn: async () => {
      if (!hasAccess) {
        setIsRedirecting(true);
        const returnUrl = window.location.pathname;
        window.location.href = `/api/auth/google-sheets?state=${encodeURIComponent(returnUrl)}`;
        throw new Error('Redirecting to Google authentication');
      }

      return populateGraduationList(listId);
    },
    onSuccess: (data) => {
      notifications.show({
        title: 'Success',
        message: `Populated spreadsheet with ${data.studentCount} students`,
        color: 'green',
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      if (error.message !== 'Redirecting to Google authentication') {
        if (error.message === 'Google Sheets access not granted') {
          recheckAccess();
          setIsRedirecting(true);
          const returnUrl = window.location.pathname;
          window.location.href = `/api/auth/google-sheets?state=${encodeURIComponent(returnUrl)}`;
        } else {
          notifications.show({
            title: 'Error',
            message: error.message || 'Failed to populate graduation list',
            color: 'red',
          });
        }
      }
    },
  });

  const handleClick = () => {
    populateMutation.mutate();
  };

  return (
    <Button
      leftSection={
        isPopulated ? (
          <IconRefresh size={16} />
        ) : (
          <IconFileSpreadsheet size={16} />
        )
      }
      onClick={handleClick}
      loading={populateMutation.isPending || isRedirecting}
    >
      {isPopulated ? 'Repopulate List' : 'Populate List'}
    </Button>
  );
}
