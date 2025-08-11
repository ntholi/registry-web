'use client';

import React from 'react';
import {
  Group,
  TextInput,
  Select,
  Button,
  Stack,
  Card,
  Flex,
  Box,
  CloseButton,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconSearch,
  IconFilter,
  IconFilterX,
  IconAdjustments,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { findAllSponsors } from '@/server/sponsors/actions';
import { getAllPrograms } from '@/server/schools/actions';

interface SponsoredStudentsHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedSponsor: string | null;
  onSponsorChange: (value: string | null) => void;
  selectedProgram: string | null;
  onProgramChange: (value: string | null) => void;
  selectedConfirmation: string | null;
  onConfirmationChange: (value: string | null) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export default function SponsoredStudentsHeader({
  searchQuery,
  onSearchChange,
  selectedSponsor,
  onSponsorChange,
  selectedProgram,
  onProgramChange,
  selectedConfirmation,
  onConfirmationChange,
  onClearFilters,
  hasActiveFilters,
}: SponsoredStudentsHeaderProps) {
  const { data: sponsors, isLoading: isLoadingSponsors } = useQuery({
    queryKey: ['sponsors-for-filter'],
    queryFn: () => findAllSponsors(1, '').then((response) => response.items),
  });

  const { data: programs, isLoading: isLoadingPrograms } = useQuery({
    queryKey: ['programs-for-filter'],
    queryFn: () => getAllPrograms(),
  });

  const sponsorOptions =
    sponsors?.map((sponsor) => ({
      value: sponsor.id.toString(),
      label: sponsor.name,
    })) || [];

  const programOptions =
    programs?.map((program) => ({
      value: program.id.toString(),
      label: `${program.code} - ${program.name}`,
    })) || [];

  return (
    <Card withBorder shadow='sm' p='lg'>
      <Stack gap='lg'>
        <Flex
          direction={{ base: 'column', sm: 'row' }}
          gap='md'
          align={{ base: 'stretch', sm: 'flex-end' }}
        >
          <Box flex={1}>
            <TextInput
              size='md'
              placeholder='Search students, sponsors, accounts...'
              value={searchQuery}
              onChange={(event) => onSearchChange(event.currentTarget.value)}
              leftSection={<IconSearch size='1.1rem' stroke={1.5} />}
              rightSection={
                searchQuery ? (
                  <CloseButton
                    onClick={() => onSearchChange('')}
                    variant='subtle'
                    size='sm'
                  />
                ) : null
              }
              styles={{
                input: {
                  fontSize: '14px',
                  '&:focus': {
                    borderColor: 'var(--mantine-color-blue-6)',
                  },
                },
              }}
            />
          </Box>
        </Flex>

        <Flex
          direction={{ base: 'column', md: 'row' }}
          gap='md'
          align={{ base: 'stretch', md: 'flex-start' }}
        >
          <Group gap='xs' align='center' style={{ flexShrink: 0 }}>
            <IconAdjustments size='1rem' stroke={1.5} />
            <Box component='span' fw={500} fz='sm' c='dimmed'>
              Filters
            </Box>
          </Group>

          <Flex flex={1} direction={{ base: 'column', sm: 'row' }} gap='md'>
            <Box flex={1} miw={200}>
              <Select
                placeholder='All Sponsors'
                data={sponsorOptions}
                value={selectedSponsor}
                onChange={onSponsorChange}
                clearable
                searchable
                disabled={isLoadingSponsors}
                leftSection={<IconFilter size='0.9rem' stroke={1.5} />}
                comboboxProps={{
                  withinPortal: true,
                }}
                styles={{
                  input: {
                    fontSize: '14px',
                  },
                }}
              />
            </Box>

            <Box flex={1} miw={200}>
              <Select
                placeholder='All Programs'
                data={programOptions}
                value={selectedProgram}
                onChange={onProgramChange}
                clearable
                searchable
                disabled={isLoadingPrograms}
                leftSection={<IconFilter size='0.9rem' stroke={1.5} />}
                comboboxProps={{
                  withinPortal: true,
                }}
                styles={{
                  input: {
                    fontSize: '14px',
                  },
                }}
              />
            </Box>

            <Box flex={1} miw={200}>
              <Select
                placeholder='All Confirmations'
                data={[
                  { value: 'confirmed', label: 'Confirmed' },
                  { value: 'pending', label: 'Pending' },
                ]}
                value={selectedConfirmation}
                onChange={onConfirmationChange}
                clearable
                leftSection={<IconFilter size='0.9rem' stroke={1.5} />}
                comboboxProps={{
                  withinPortal: true,
                }}
                styles={{
                  input: {
                    fontSize: '14px',
                  },
                }}
              />
            </Box>
          </Flex>
        </Flex>
      </Stack>
    </Card>
  );
}
