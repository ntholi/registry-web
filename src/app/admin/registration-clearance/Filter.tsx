'use client';
import React from 'react';
import { IconClock } from '@tabler/icons-react';
import { ActionIcon } from '@mantine/core';
import { parseAsBoolean, useQueryState } from 'nuqs';

export default function Filter() {
  const [showPending, setShowPending] = useQueryState(
    'pending',
    parseAsBoolean.withDefault(true)
  );

  return (
    <ActionIcon
      size={'lg'}
      variant={showPending ? 'filled' : 'default'}
      color={showPending ? 'blue' : 'gray'}
      onClick={() => setShowPending(!showPending)}
      aria-label='Toggle filter'
    >
      <IconClock size={18} />
    </ActionIcon>
  );
}
