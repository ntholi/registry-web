'use client';

import {
  TextInput,
  Group,
  Text,
  Tooltip,
  Box,
  ActionIcon,
  Transition,
  Badge,
} from '@mantine/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef, useEffect } from 'react';
import {
  createAssessmentMark,
  updateAssessmentMark,
} from '@/server/assessment-marks/actions';
import { IconPencil, IconCheck, IconX } from '@tabler/icons-react';

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
  const [isHovering, setIsHovering] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Reset displayed value if props change
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

    // Use maxMarks instead of fixed 100
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

  const cancelEdit = () => {
    setIsEditing(false);
    setMark(existingMark?.toString() || '');
    setError('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveMarks();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  // Calculate grade status
  const getMarkStatus = () => {
    if (existingMark === undefined) return null;
    const maxMarks = assessment.maxMarks || 100;
    const percentage = (existingMark / maxMarks) * 100;

    if (percentage >= 80) return { color: 'green', label: 'Excellent' };
    if (percentage >= 70) return { color: 'teal', label: 'Very Good' };
    if (percentage >= 60) return { color: 'blue', label: 'Good' };
    if (percentage >= 50) return { color: 'yellow', label: 'Pass' };
    return { color: 'red', label: 'Fail' };
  };

  const markStatus = getMarkStatus();

  if (!isEditing) {
    const markDisplay = existingMark !== undefined ? existingMark : '-';
    const maxMark = assessment.maxMarks || assessment.totalMarks;

    return (
      <Box
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        pos='relative'
        style={{ cursor: 'pointer' }}
        onClick={() => setIsEditing(true)}
      >
        <Tooltip
          label={markStatus?.label || 'Not graded'}
          position='top'
          disabled={existingMark === undefined}
        >
          <Group gap={2} justify='center'>
            <Text
              fw={600}
              c={markStatus?.color}
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
        </Tooltip>

        <Transition mounted={isHovering} transition='fade' duration={200}>
          {(styles) => (
            <ActionIcon
              variant='subtle'
              color='gray'
              radius='xl'
              size='xs'
              style={{
                ...styles,
                position: 'absolute',
                top: -8,
                right: -8,
              }}
            >
              <IconPencil size={12} />
            </ActionIcon>
          )}
        </Transition>
      </Box>
    );
  }

  return (
    <Box pos='relative'>
      <Group align='center' gap={4}>
        <TextInput
          ref={inputRef}
          size='xs'
          value={mark}
          onChange={(e) => handleMarkChange(e.target.value)}
          onKeyDown={handleKeyDown}
          error={error}
          placeholder='Mark'
          rightSection={
            <Group gap={0}>
              <ActionIcon
                color='green'
                variant='transparent'
                onClick={saveMarks}
                size='sm'
              >
                <IconCheck size={14} />
              </ActionIcon>
              <ActionIcon
                color='red'
                variant='transparent'
                onClick={cancelEdit}
                size='sm'
              >
                <IconX size={14} />
              </ActionIcon>
            </Group>
          }
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
