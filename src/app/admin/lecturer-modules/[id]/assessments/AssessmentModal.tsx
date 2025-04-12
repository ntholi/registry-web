'use client';

import {
  Button,
  Grid,
  Group,
  Modal,
  NumberInput,
  Select,
  Text,
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { showNotification } from '@mantine/notifications';
import { IconCheck } from '@tabler/icons-react';
import { createInsertSchema } from 'drizzle-zod';
import { assessments } from '@/db/schema';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createAssessment,
  updateAssessment,
} from '@/server/assessments/actions';
import {
  assessmentNumberOptions,
  assessmentTypeOptions,
} from '@/app/admin/assessments/options';

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

  const schema = createInsertSchema(assessments);

  const initialValues: Partial<Assessment> = {
    semesterModuleId: moduleId,
    assessmentNumber: assessment?.assessmentNumber || 'CW1',
    assessmentType: assessment?.assessmentType || '',
    totalMarks: assessment?.totalMarks || 100,
    weight: assessment?.weight || 10,
    termId: assessment?.termId || 0,
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

      <Modal opened={opened} onClose={close} title={title} size='md' centered>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Grid>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Select
                label='Assessment Number'
                searchable
                data={assessmentNumberOptions}
                {...form.getInputProps('assessmentNumber')}
                required
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
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
            <Grid.Col span={12}>
              <Text size='xs' c='dimmed' mt='xs'>
                Note: Assessment weight is the percentage contribution to the
                final grade.
              </Text>
            </Grid.Col>
          </Grid>

          <Group justify='flex-end' mt='md'>
            <Button variant='outline' onClick={close} color='gray'>
              Cancel
            </Button>
            <Button
              type='submit'
              loading={isSubmitting}
              color={mode === 'add' ? 'green' : 'blue'}
            >
              {mode === 'add' ? 'Add Assessment' : 'Save Changes'}
            </Button>
          </Group>
        </form>
      </Modal>
    </>
  );
}
