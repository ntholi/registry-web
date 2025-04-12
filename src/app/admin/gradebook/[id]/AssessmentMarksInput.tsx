'use client';

import { TextInput, Group, Text } from '@mantine/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef, useEffect } from 'react';
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
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveMarks();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setMark(existingMark?.toString() || '');
    }
  };

  if (!isEditing) {
    return (
      <Group
        gap='xs'
        onClick={() => setIsEditing(true)}
        style={{ cursor: 'pointer' }}
        className='mark-display'
      >
        <Text size='sm' fw={500}>
          {existingMark !== undefined ? existingMark : '-'}
        </Text>
      </Group>
    );
  }

  return (
    <TextInput
      ref={inputRef}
      size='xs'
      value={mark}
      onChange={(e) => handleMarkChange(e.target.value)}
      onBlur={saveMarks}
      onKeyDown={handleKeyDown}
      error={error}
      placeholder='Enter mark'
      styles={{
        input: {
          width: '60px',
          textAlign: 'center',
          fontWeight: 500,
        },
        error: {
          position: 'absolute',
          top: '100%',
          left: '0',
          whiteSpace: 'nowrap',
        },
      }}
    />
  );
}
