'use client';

import { deleteAssessment } from '@/server/assessments/actions';
import {
  Button,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
  Alert,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { showNotification } from '@mantine/notifications';
import { IconAlertTriangle, IconTrash } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { getAssessmentName } from '@/app/admin/assessments/options';

type Props = {
  children: React.ReactNode;
  assessment: {
    id: number;
    assessmentNumber: string;
    assessmentType: string;
  };
  semesterModuleId: number;
};

export default function DeleteAssessmentModal({
  children,
  assessment,
  semesterModuleId,
}: Props) {
  const [opened, { open, close }] = useDisclosure(false);
  const [confirmText, setConfirmText] = useState('');
  const queryClient = useQueryClient();

  const assessmentTypeName = getAssessmentName(assessment.assessmentType);
  const isConfirmationValid = confirmText === assessmentTypeName;

  const deleteMutation = useMutation({
    mutationFn: deleteAssessment,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['assessments', semesterModuleId],
      });
      showNotification({
        title: 'Success',
        message: 'Assessment deleted successfully',
        color: 'green',
      });
      close();
      setConfirmText('');
    },
  });

  const handleDelete = () => {
    if (isConfirmationValid) {
      deleteMutation.mutate(assessment.id);
    }
  };

  return (
    <>
      <div onClick={open}>{children}</div>

      <Modal
        opened={opened}
        onClose={close}
        title='Delete Assessment'
        size='md'
        centered
        withCloseButton
      >
        <Stack>
          <Alert
            icon={<IconAlertTriangle size='1.2rem' />}
            title='Warning'
            color='red'
            variant='outline'
          >
            You are about to delete {assessment.assessmentNumber}. This will
            permanently delete all student marks associated with this
            assessment.
          </Alert>

          <Text size='sm'>
            To confirm deletion, please type{' '}
            <Text span fw={700}>
              {assessmentTypeName}
            </Text>{' '}
            below:
          </Text>

          <TextInput
            placeholder={`Type "${assessmentTypeName}" to confirm`}
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            error={
              confirmText !== '' && !isConfirmationValid
                ? 'Text does not match'
                : null
            }
            data-autofocus
          />

          <Group justify='flex-end' mt='md'>
            <Button variant='outline' onClick={close} color='gray'>
              Cancel
            </Button>
            <Button
              variant='filled'
              color='red'
              leftSection={<IconTrash size='1rem' />}
              onClick={handleDelete}
              loading={deleteMutation.isPending}
              disabled={!isConfirmationValid}
            >
              Delete Assessment
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
