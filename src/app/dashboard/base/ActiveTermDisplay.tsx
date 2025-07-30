'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCurrentTerm } from '@/server/terms/actions';
import { Text } from '@mantine/core';

export default function ActiveTermDisplay() {
  const {
    data: activeTerm,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['activeTerm'],
    queryFn: async () => {
      const term = await getCurrentTerm();
      return term || null;
    },
  });

  if (isLoading)
    return (
      <Text size='sm' c='dimmed'>
        Fetching active term...
      </Text>
    );

  if (isError)
    return (
      <Text size='sm' c='red'>
        Error loading active term
      </Text>
    );

  if (!activeTerm)
    return (
      <Text size='sm' c='red'>
        No active term
      </Text>
    );

  return (
    <Text size='sm'>
      Active Term:
      <Text component='span' c='green'>
        {` ${activeTerm.name}`}
      </Text>
    </Text>
  );
}
