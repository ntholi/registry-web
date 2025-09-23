'use client';

import React from 'react';
import { studentPrograms, structures, programs } from '@/db/schema';
import {
  Box,
  Card,
  Group,
  Radio,
  Stack,
  Text,
  Title,
  Badge,
  Alert,
} from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';

type StudentProgram = typeof studentPrograms.$inferSelect & {
  structure: typeof structures.$inferSelect & {
    program: typeof programs.$inferSelect;
  };
  semesters: Array<{
    term: string;
  }>;
};

interface ProgramSelectionProps {
  programs: StudentProgram[];
  selectedProgramId: number | null;
  onProgramSelect: (programId: number) => void;
}

export default function ProgramSelection({
  programs,
  selectedProgramId,
  onProgramSelect,
}: ProgramSelectionProps) {
  // Auto-select the only program if there's only one and none is selected
  React.useEffect(() => {
    if (programs.length === 1 && !selectedProgramId) {
      onProgramSelect(programs[0].id);
    }
  }, [programs, selectedProgramId, onProgramSelect]);

  if (!programs || programs.length === 0) {
    return (
      <Alert
        icon={<IconInfoCircle size='1rem' />}
        title='No Eligible Programs Found'
        color='red'
      >
        You don&apos;t have any programs with &quot;Active&quot; or
        &quot;Completed&quot; status that are eligible for graduation. Please
        contact the registry office for assistance.
      </Alert>
    );
  }

  if (programs.length === 1) {
    return (
      <Card withBorder shadow='sm' radius='md' padding='lg'>
        <Title order={4} mb='md'>
          Your Program
        </Title>
        <ProgramCard program={programs[0]} />
        <Text size='sm' c='dimmed' mt='sm'>
          This is your only eligible program for graduation.
        </Text>
      </Card>
    );
  }

  return (
    <Card withBorder shadow='sm' radius='md' padding='lg'>
      <Title order={4} mb='md'>
        Select Program to Graduate From
      </Title>

      <Alert
        icon={<IconInfoCircle size='1rem' />}
        title='Multiple Programs Found'
        color='blue'
        mb='md'
      >
        You have multiple programs. Please select the program you want to
        graduate from. Programs with &quot;Completed&quot; status and recent
        graduation terms are prioritized.
      </Alert>

      <Radio.Group
        value={selectedProgramId?.toString() || ''}
        onChange={(value) => onProgramSelect(parseInt(value))}
      >
        <Stack gap='md'>
          {programs.map((program) => (
            <Radio
              key={program.id}
              value={program.id.toString()}
              label={<ProgramCard program={program} />}
            />
          ))}
        </Stack>
      </Radio.Group>
    </Card>
  );
}

function ProgramCard({ program }: { program: StudentProgram }) {
  const hasGraduationTerms = program.semesters.some((semester) =>
    ['2025-02', '2024-07', '2024-02'].includes(semester.term)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'green';
      case 'Active':
        return 'blue';
      default:
        return 'gray';
    }
  };

  const getPriorityBadge = () => {
    if (program.status === 'Completed' && hasGraduationTerms) {
      return (
        <Badge color='green' variant='light' size='xs'>
          Recommended
        </Badge>
      );
    }
    return null;
  };

  return (
    <Box>
      <Group justify='space-between' mb='xs'>
        <Text fw={500}>{program.structure.program.name}</Text>
        <Group gap='xs'>
          {getPriorityBadge()}
          <Badge
            color={getStatusColor(program.status)}
            variant='light'
            size='xs'
          >
            {program.status}
          </Badge>
        </Group>
      </Group>

      <Group gap='md'>
        <Box>
          <Text size='xs' c='dimmed'>
            Program Code
          </Text>
          <Text size='sm'>{program.structure.program.code}</Text>
        </Box>
        <Box>
          <Text size='xs' c='dimmed'>
            Level
          </Text>
          <Text size='sm' tt='capitalize'>
            {program.structure.program.level}
          </Text>
        </Box>
        <Box>
          <Text size='xs' c='dimmed'>
            Structure
          </Text>
          <Text size='sm'>{program.structure.code}</Text>
        </Box>
      </Group>

      {program.status === 'Completed' && hasGraduationTerms && (
        <Text size='xs' c='green' mt='xs'>
          ✓ Has recent graduation terms (2024-02, 2024-07, 2025-02)
        </Text>
      )}
    </Box>
  );
}
