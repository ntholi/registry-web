'use client';
import { getStudent } from '@/server/students/actions';
import { NumberInput, NumberInputProps, Stack, Text } from '@mantine/core';
import { IconUser } from '@tabler/icons-react';
import { useState } from 'react';

export default function StdNoInput(props: NumberInputProps) {
  const { value, onChange, ...rest } = props;
  const [error, setError] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);

  function handleChange(value: number | string) {
    const str = String(value);
    setError(null);
    onChange?.(value);
    setDescription(null);

    if (str.length > 4 && !str.startsWith('9010')) {
      setError('Student number must start with 9010...');
    } else if (str.length > 9) {
      setError('Student number too long');
    } else if (str.length === 9) {
      getStudent(Number(str))
        .then((student) => {
          if (student) {
            setDescription(student.name);
          } else {
            setError('Student not found');
          }
        })
        .catch(() => {
          setError('Error retrieving student information');
        });
    }
  }

  return (
    <Stack gap={'2px'}>
      <NumberInput
        rightSection={<IconUser size='1.1rem' />}
        value={value}
        onChange={handleChange}
        label='Student Number'
        required
        {...rest}
        error={error}
      />
      <Text size='xs' c='dimmed' h={error ? 'auto' : 20}>
        {description}
      </Text>
    </Stack>
  );
}
