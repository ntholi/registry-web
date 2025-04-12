'use client';

import { TextInput, Group, Text, Box } from '@mantine/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef, useEffect } from 'react';
import {
  createAssessmentMark,
  updateAssessmentMark,
} from '@/server/assessment-marks/actions';

type Props = {
  assessment: { id: number; maxMarks: number; totalMarks: number };
  studentId: number;
  existingMark?: number;
  existingMarkId?: number;
  semesterModuleId: number;
};

export default function MarksInput({
  assessment,
  studentId,
  existingMark,
  existingMarkId,
  semesterModuleId,
}: Props) {
  const [mark, setMark] = useState(existingMark?.toString() || '');
  const [isEditing, setIsEditing] = useState(!existingMark);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (existingMark !== undefined) {
      setMark(existingMark.toString());
    }
  }, [existingMark]);

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
    if (mark.trim() === '') {
      setIsEditing(false);
      setMark(existingMark?.toString() || '');
      return;
    }

    const numericMark = parseFloat(mark);

    if (isNaN(numericMark)) {
      setError('Invalid number');
      return;
    }

    const maxPossible = assessment.maxMarks || 100;

    if (numericMark < 0 || numericMark > maxPossible) {
      setError(`Mark must be between 0-${maxPossible}`);
      return;
    }

    markMutation.mutate({
      assessmentId: assessment.id,
      stdNo: studentId,
      marks: numericMark,
    });
  };

  const handleBlur = () => {
    saveMarks();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveMarks();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setMark(existingMark?.toString() || '');
    setError('');
  };

  const getMarkStatus = () => {
    if (existingMark === undefined) return null;
    const maxMarks = assessment.maxMarks || 100;
    const percentage = (existingMark / maxMarks) * 100;
    return percentage >= 50 ? 'green' : 'red';
  };

  if (!isEditing) {
    const markDisplay = existingMark !== undefined ? existingMark : '-';
    const maxMark = assessment.maxMarks || assessment.totalMarks;
    const statusColor = getMarkStatus();

    return (
      <Box
        pos='relative'
        style={{ cursor: 'pointer' }}
        onClick={() => setIsEditing(true)}
      >
        <Group gap={2} justify='center' align='end'>
          <Text
            fw={600}
            c={statusColor || undefined}
            style={{
              transition: 'all 0.2s ease',
            }}
          >
            {markDisplay}
          </Text>
          <Text size='xs' c='dimmed'>
            /{maxMark}
          </Text>
        </Group>
      </Box>
    );
  }

  return (
    <Box pos='relative'>
      <Group align='center' gap={4} justify='center'>
        <TextInput
          ref={inputRef}
          size='xs'
          value={mark}
          onChange={(e) => handleMarkChange(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          error={error}
          placeholder='Mark'
          styles={{
            input: {
              width: '90px',
              textAlign: 'center',
              fontWeight: 500,
            },
            error: {
              position: 'absolute',
              top: '100%',
              left: '0',
              whiteSpace: 'nowrap',
              zIndex: 10,
            },
          }}
        />
      </Group>
    </Box>
  );
}
