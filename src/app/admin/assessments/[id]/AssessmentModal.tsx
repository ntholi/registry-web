'use client';

import { assessmentNumberEnum, assessments } from '@/db/schema';
import {
  createAssessment,
  updateAssessment,
} from '@/server/assessments/actions';
import { getModule } from '@/server/modules/actions';
import { Button, Group, Modal, NumberInput, Select } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useQueryClient } from '@tanstack/react-query';
import { createInsertSchema } from 'drizzle-zod';
import { zodResolver } from '@mantine/form';
import { useCallback } from 'react';
import { ASSESSMENT_TYPES, COURSE_WORK_OPTIONS } from './assessments';

type AssessmentNumberType = (typeof assessmentNumberEnum)[number];
type Assessment = NonNullable<
  Awaited<ReturnType<typeof getModule>>
>['assessments'][number];

const schema = createInsertSchema(assessments);

interface Props {
  moduleId: number;
  assessment?: Assessment;
  opened: boolean;
  onClose: () => void;
}

export default function AssessmentModal({
  moduleId,
  assessment,
  opened,
  onClose,
}: Props) {
  const queryClient = useQueryClient();
  const isEditing = !!assessment;

  const form = useForm({
    initialValues: {
      assessmentNumber:
        assessment?.assessmentNumber || ('' as AssessmentNumberType),
      assessmentType: assessment?.assessmentType || '',
      totalMarks: assessment?.totalMarks || 100,
      weight: assessment?.weight || 0,
    },
    validate: zodResolver(
      schema.pick({
        assessmentNumber: true,
        assessmentType: true,
        totalMarks: true,
        weight: true,
      }),
    ),
  });

  const handleSubmit = useCallback(
    async (values: typeof form.values) => {
      try {
        if (isEditing && assessment) {
          await updateAssessment(assessment.id, {
            ...values,
            assessmentNumber: values.assessmentNumber as AssessmentNumberType,
            moduleId,
            termId: assessment.termId,
          });
          notifications.show({
            title: 'Success',
            message: 'Assessment updated successfully',
            color: 'green',
          });
        } else {
          await createAssessment({
            ...values,
            assessmentNumber: values.assessmentNumber as AssessmentNumberType,
            moduleId,
            termId: 0,
          });
          notifications.show({
            title: 'Success',
            message: 'Assessment created successfully',
            color: 'green',
          });
        }

        queryClient.invalidateQueries({
          queryKey: ['module', moduleId],
        });

        queryClient.invalidateQueries({
          queryKey: ['modules'],
        });

        form.reset();
        onClose();
      } catch (error) {
        notifications.show({
          title: 'Error',
          message: 'An error occurred while saving the assessment',
          color: 'red',
        });
      }
    },
    [assessment, form, isEditing, moduleId, onClose, queryClient],
  );

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEditing ? 'Edit Assessment' : 'Add Assessment'}
      size='md'
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Select
          label='Assessment Number'
          placeholder='Select assessment number'
          searchable
          clearable
          data={COURSE_WORK_OPTIONS}
          required
          mb='md'
          {...form.getInputProps('assessmentNumber')}
        />
        <Select
          label='Assessment Type'
          placeholder='Search or select an assessment type'
          searchable
          clearable
          data={ASSESSMENT_TYPES}
          {...form.getInputProps('assessmentType')}
          required
          mb='md'
        />
        <NumberInput
          label='Total Marks'
          placeholder='Total marks for this assessment'
          required
          mb='md'
          min={1}
          {...form.getInputProps('totalMarks')}
        />
        <NumberInput
          label='Weight (%)'
          placeholder='Weight of this assessment'
          required
          mb='md'
          min={0}
          max={100}
          {...form.getInputProps('weight')}
        />
        <Group justify='flex-end' mt='md'>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button type='submit'>{isEditing ? 'Update' : 'Create'}</Button>
        </Group>
      </form>
    </Modal>
  );
}
