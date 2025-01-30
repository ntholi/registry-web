import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getActiveTerm } from '@/server/terms/actions';
import { Text } from '@mantine/core';

export default function ActiveTermDisplay() {
  const { data: activeTerm, isLoading } = useQuery({
    queryKey: ['activeTerm'],
    queryFn: () => getActiveTerm(),
  });

  if (isLoading) return <Text size='sm'>Fetching active term...</Text>;

  return (
    <Text size='sm' mt='xs'>
      Active Term: {activeTerm ? activeTerm.name : 'No active term'}
    </Text>
  );
}
