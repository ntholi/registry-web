'use client';

import { getAllTerms } from '@/server/terms/actions';
import { useCurrentTerm } from '@/hooks/use-current-term';
import { Paper, Select, Title } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

interface TermSelectorProps {
  value: number | null;
  onChange: (value: number | null) => void;
  error?: string;
}

export default function TermSelector({
  value,
  onChange,
  error,
}: TermSelectorProps) {
  const { currentTerm } = useCurrentTerm();

  const { data: terms, isLoading: termsLoading } = useQuery({
    queryKey: ['terms'],
    queryFn: () => getAllTerms(),
  });

  useEffect(() => {
    if (currentTerm && !value) {
      onChange(currentTerm.id);
    }
  }, [currentTerm, value, onChange]);

  return (
    <Paper withBorder p='md'>
      <Title order={4} size='h5' mb='md'>
        Term Selection
      </Title>
      <Select
        label='Select Term'
        placeholder='Choose a term for registration'
        data={
          terms?.map((term) => ({
            value: term.id.toString(),
            label: `${term.name}${term.isActive ? ' (Current)' : ''}`,
          })) || []
        }
        value={value?.toString() || null}
        onChange={(val) => {
          const termId = val ? parseInt(val) : null;
          onChange(termId);
        }}
        error={error}
        required
        disabled={termsLoading}
        loading={termsLoading}
      />
    </Paper>
  );
}
