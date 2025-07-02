'use client';

import UserInput from '@/components/UserInput';
import { users } from '@/db/schema';
import { updateStudentUserId } from '@/server/students/actions';
import {
  ActionIcon,
  Button,
  Group,
  Modal,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconEdit } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

type User = typeof users.$inferSelect;

interface EditStudentUserModalProps {
  studentStdNo: number;
  currentUser: User | null;
}

export default function EditStudentUserModal({
  studentStdNo,
  currentUser,
}: EditStudentUserModalProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(currentUser);
  const queryClient = useQueryClient();

  const updateUserMutation = useMutation({
    mutationFn: async (userId: string | null) => {
      return updateStudentUserId(studentStdNo, userId);
    },
    onSuccess: () => {
      notifications.show({
        message: 'Student user updated successfully',
        color: 'green',
      });
      queryClient.invalidateQueries({
        queryKey: ['student', studentStdNo],
      });
      close();
    },
    onError: (error) => {
      notifications.show({
        message: `Failed to update student user: ${error.message}`,
        color: 'red',
      });
    },
  });

  const handleSave = () => {
    updateUserMutation.mutate(selectedUser?.id || null);
  };

  return (
    <>
      <Tooltip label='Edit User'>
        <ActionIcon variant='subtle' color='blue' onClick={open}>
          <IconEdit size={16} />
        </ActionIcon>
      </Tooltip>

      <Modal
        opened={opened}
        onClose={close}
        title='Edit Student User'
        size='md'
      >
        <Stack gap='md'>
          <Text size='sm' c='dimmed'>
            Select a user to associate with this student.
          </Text>

          <UserInput
            label='User'
            placeholder='Search for users...'
            value={selectedUser}
            onChange={setSelectedUser}
          />

          {currentUser && (
            <Group gap='xs'>
              <Text size='sm' c='dimmed'>
                Current user:
              </Text>
              <Text size='sm' fw={500}>
                {currentUser.name || currentUser.email}
              </Text>
            </Group>
          )}

          <Group justify='flex-end' gap='sm'>
            <Button variant='default' onClick={close}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              loading={updateUserMutation.isPending}
              disabled={selectedUser?.id === currentUser?.id}
            >
              Save
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
