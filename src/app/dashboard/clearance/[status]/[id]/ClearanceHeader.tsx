'use client';

import { useViewSelect } from '@/hooks/useViewSelect';
import { useCurrentTerm } from '@/hooks/use-current-term';
import { ActionIcon, Divider, Flex, Group, Title, Badge } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconArrowNarrowLeft } from '@tabler/icons-react';
import React from 'react';

interface Props {
  studentName: string;
  termName: string;
  versionCount?: number;
}

export default function ClearanceHeader({
  studentName,
  termName,
  versionCount,
}: Props) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [, setView] = useViewSelect();
  const { currentTerm } = useCurrentTerm();

  const isCurrentTerm = currentTerm?.name === termName;

  return (
    <>
      <Flex justify='space-between' align='center'>
        {isMobile ? (
          <Group>
            <ActionIcon variant='default' onClick={() => setView('nav')}>
              <IconArrowNarrowLeft size='1rem' />
            </ActionIcon>
            <Title order={3} fw={100} size='1rem'>
              {studentName}
            </Title>
          </Group>
        ) : (
          <Title order={3} fw={100}>
            {studentName}
          </Title>
        )}
        <Group>
          {!isCurrentTerm && (
            <Badge color={'red'} variant={'filled'}>
              {termName}
            </Badge>
          )}

          {versionCount && (
            <Badge
              color={
                versionCount === 1
                  ? 'green'
                  : versionCount <= 3
                    ? 'yellow'
                    : 'red'
              }
              variant='light'
              size='sm'
            >
              Version {versionCount}
            </Badge>
          )}
        </Group>
      </Flex>
      <Divider my={15} />
    </>
  );
}
