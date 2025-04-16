'use client';

import {
  assessmentNumberOptions,
  assessmentTypeOptions,
} from '@/app/admin/assessments/options';
import { assessments } from '@/db/schema';
import {
  createAssessment,
  updateAssessment,
} from '@/server/assessments/actions';
import { Button, Grid, Group, Modal, NumberInput, Select } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { showNotification } from '@mantine/notifications';
import { IconCheck } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createInsertSchema } from 'drizzle-zod';

type Assessment = typeof assessments.$inferInsert;

type Props = {
  children: React.ReactNode;
  moduleId: number;
  assessment?: Assessment;
  mode: 'add' | 'edit';
};

export default function AssessmentModal({
  children,
  moduleId,
  assessment,
  mode,
}: Props) {
  const [opened, { open, close }] = useDisclosure(false);
  const queryClient = useQueryClient();

  const schema = createInsertSchema(assessments).omit({ termId: true });

  const initialValues: Partial<Assessment> = {
    semesterModuleId: moduleId,
    assessmentNumber: assessment?.assessmentNumber,
    assessmentType: assessment?.assessmentType,
    totalMarks: assessment?.totalMarks,
    weight: assessment?.weight,
    termId: assessment?.termId,
  };

  const form = useForm({
    initialValues,
    validate: zodResolver(schema),
  });

  const createMutation = useMutation({
    mutationFn: createAssessment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments', moduleId] });
      showNotification({
        title: 'Success',
        message: 'Assessment created successfully',
        color: 'green',
        icon: <IconCheck size='1rem' />,
      });
      close();
      form.reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Assessment }) =>
      updateAssessment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments', moduleId] });
      showNotification({
        title: 'Success',
        message: 'Assessment updated successfully',
        color: 'green',
        icon: <IconCheck size='1rem' />,
      });
      close();
    },
  });

  const handleSubmit = (values: Partial<Assessment>) => {
    if (mode === 'add') {
      createMutation.mutate(values as Assessment);
    } else if (mode === 'edit' && assessment?.id) {
      updateMutation.mutate({
        id: assessment.id,
        data: values as Assessment,
      });
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const title = mode === 'add' ? 'Add Assessment' : 'Edit Assessment';

  return (
    <>
      <div onClick={open}>{children}</div>

      <Modal opened={opened} onClose={close} title={title} size={550} centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Grid gutter={'lg'}>
            <Grid.Col span={{ base: 12 }}>
              <Select
                label='Assessment Number'
                searchable
                data={assessmentNumberOptions}
                {...form.getInputProps('assessmentNumber')}
                required
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12 }}>
              <Select
                label='Assessment Type'
                searchable
                data={assessmentTypeOptions}
                {...form.getInputProps('assessmentType')}
                required
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <NumberInput
                label='Total Marks'
                {...form.getInputProps('totalMarks')}
                min={1}
                required
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <NumberInput
                label='Weight (%)'
                {...form.getInputProps('weight')}
                min={1}
                max={100}
                required
              />
            </Grid.Col>
          </Grid>

          <Group justify='flex-end' mt='xl'>
            <Button variant='outline' onClick={close} color='gray'>
              Cancel
            </Button>
            <Button
              type='submit'
              loading={isSubmitting}
              color={mode === 'add' ? 'blue' : 'green'}
            >
              {mode === 'add' ? 'Create Assessment' : 'Save Changes'}
            </Button>
          </Group>
        </form>
      </Modal>
    </>
  );
}
