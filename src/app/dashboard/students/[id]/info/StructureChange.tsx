'use client';
import {
  getStudent,
  updateStudentProgramStructure,
} from '@/server/students/actions';
import { getStructuresByProgramId } from '@/server/structures/actions';
import {
  ActionIcon,
  Anchor,
  Box,
  Button,
  Group,
  Modal,
  Select,
  Text,
  Alert,
} from '@mantine/core';
import { IconEdit, IconInfoCircle } from '@tabler/icons-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';

type Props = {
  student: Awaited<ReturnType<typeof getStudent>>;
};

export default function StructureChange({ student }: Props) {
  const { data: session } = useSession();
  const [opened, setOpened] = useState(false);
  const [selectedStructureId, setSelectedStructureId] = useState<string | null>(
    null
  );
  const queryClient = useQueryClient();

  const currentProgram = student?.programs[0];
  const currentStructure = currentProgram?.structure;

  const { data: structures, isLoading: isLoadingStructures } = useQuery({
    queryKey: ['structures', 'program', currentProgram?.structure.program.id],
    queryFn: () =>
      getStructuresByProgramId(currentProgram!.structure.program.id),
    enabled: opened && !!currentProgram?.structure.program.id,
  });

  const updateStructureMutation = useMutation({
    mutationFn: async (structureId: number) => {
      if (!student?.stdNo) throw new Error('Student number not found');
      return updateStudentProgramStructure(student.stdNo, structureId);
    },
    onSuccess: () => {
      notifications.show({
        title: 'Success',
        message: 'Student structure updated successfully',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['student', student?.stdNo] });
      setOpened(false);
      setSelectedStructureId(null);
    },
    onError: (error) => {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to update student structure',
        color: 'red',
      });
    },
  });

  const handleSubmit = () => {
    if (!selectedStructureId) return;
    updateStructureMutation.mutate(parseInt(selectedStructureId));
  };

  const handleClose = () => {
    setOpened(false);
    setSelectedStructureId(null);
  };

  const structureOptions =
    structures?.map((structure) => ({
      value: structure.id.toString(),
      label: `${structure.code}${structure.desc ? ` - ${structure.desc}` : ''}`,
    })) || [];

  const isCurrentStructure =
    selectedStructureId === currentStructure?.id.toString();
  const canSubmit =
    selectedStructureId &&
    !isCurrentStructure &&
    !updateStructureMutation.isPending;

  return (
    <>
      <Modal
        opened={opened}
        onClose={handleClose}
        title={currentProgram?.structure.program.name}
        size='md'
      >
        <Box>
          <Text size='sm' mb='md'>
            <strong></strong>
          </Text>

          <Text size='sm' mb='xs' fw={500}>
            Current Structure: <strong>{currentStructure?.code}</strong>
          </Text>

          <Text size='sm' c='dimmed' mb='lg'>
            Select a new structure from the same program:
          </Text>

          <Select
            label='New Structure'
            placeholder='Select a structure'
            data={structureOptions}
            value={selectedStructureId}
            onChange={setSelectedStructureId}
            disabled={isLoadingStructures || updateStructureMutation.isPending}
            searchable
            mb='md'
          />

          {isCurrentStructure && selectedStructureId && (
            <Alert icon={<IconInfoCircle size={16} />} color='blue' mb='md'>
              This is the current structure for this student.
            </Alert>
          )}

          <Group justify='flex-end' mt='xl'>
            <Button
              variant='light'
              onClick={handleClose}
              disabled={updateStructureMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              loading={updateStructureMutation.isPending}
            >
              Update Structure
            </Button>
          </Group>
        </Box>
      </Modal>

      <Box>
        <Text size='sm' c='dimmed'>
          Structure
        </Text>
        <Group>
          <Anchor
            component={Link}
            href={`/dashboard/schools/structures/${student?.programs[0].structureId}`}
            size='sm'
            fw={500}
          >
            {student?.programs[0].structure.code}
          </Anchor>
          {['admin', 'registry'].includes(session?.user?.role ?? '') && (
            <ActionIcon
              variant='subtle'
              color='gray'
              onClick={() => setOpened(true)}
            >
              <IconEdit size={16} />
            </ActionIcon>
          )}
        </Group>
      </Box>
    </>
  );
}
