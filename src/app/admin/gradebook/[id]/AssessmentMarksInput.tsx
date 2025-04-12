'use client';

import { TextInput, ActionIcon, Group, Text } from '@mantine/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { IconCheck, IconX } from '@tabler/icons-react';
import {
  createAssessmentMark,
  updateAssessmentMark,
} from '@/server/assessment-marks/actions';

interface AssessmentMarksInputProps {
  assessmentId: number;
  studentId: number;
  existingMark?: number;
  existingMarkId?: number;
  semesterModuleId: number;
}

export default function AssessmentMarksInput({
  assessmentId,
  studentId,
  existingMark,
  existingMarkId,
  semesterModuleId,
}: AssessmentMarksInputProps) {
  const [mark, setMark] = useState(existingMark?.toString() || '');
  const [isEditing, setIsEditing] = useState(!existingMark);
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const markMutation = useMutation({
    mutationFn: (data: {
      assessmentId: number;
      stdNo: number;
      marks: number;
    }) => {
      if (existingMarkId !== undefined) {
        return updateAssessmentMark(existingMarkId, data);
      } else {
        return createAssessmentMark(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['assessmentMarks', semesterModuleId],
      });
      setIsEditing(false);
    },
  });

  const handleMarkChange = (value: string) => {
    setMark(value);
    setError('');
  };

  const saveMarks = () => {
    const numericMark = parseFloat(mark);

    if (isNaN(numericMark)) {
      setError('Invalid number');
      return;
    }

    if (numericMark < 0 || numericMark > 100) {
      setError('Mark must be between 0-100');
      return;
    }

    markMutation.mutate({
      assessmentId,
      stdNo: studentId,
      marks: numericMark,
    });
  };

  if (!isEditing) {
    return (
      <Group
        gap='xs'
        onClick={() => setIsEditing(true)}
        style={{ cursor: 'pointer' }}
      >
        <Text size='sm'>{existingMark !== undefined ? existingMark : '-'}</Text>
      </Group>
    );
  }

  return (
    <Group gap='xs'>
      <TextInput
        size='xs'
        value={mark}
        onChange={(e) => handleMarkChange(e.target.value)}
        error={error}
        placeholder='Enter mark'
        styles={{ input: { width: '60px' } }}
      />
      <ActionIcon
        color='green'
        size='sm'
        onClick={saveMarks}
        loading={markMutation.isPending}
      >
        <IconCheck size='1rem' />
      </ActionIcon>
      <ActionIcon
        color='red'
        size='sm'
        onClick={() => {
          setIsEditing(false);
          setMark(existingMark?.toString() || '');
        }}
      >
        <IconX size='1rem' />
      </ActionIcon>
    </Group>
  );
}
