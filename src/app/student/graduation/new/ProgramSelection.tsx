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
        icon={<IconInfoCircle size='0.9rem' />}
        color='yellow'
        variant='light'
      >
        No eligible programs found. Contact the registry office if you believe
        this is a mistake.
      </Alert>
    );
  }

  if (programs.length === 1) {
    return (
      <Card withBorder radius='md' padding='md'>
        <Text mb='sm'>Program</Text>
        <ProgramCard program={programs[0]} />
      </Card>
    );
  }

  return (
    <Card withBorder radius='md' padding='md'>
      <Group justify='space-between' mb='xs'>
        <Text fw={600}>Choose a program</Text>
      </Group>
      <Text size='sm' c='dimmed' mb='sm'>
        Select the program you want to graduate from.
      </Text>

      <Radio.Group
        value={selectedProgramId?.toString() || ''}
        onChange={(value) => onProgramSelect(parseInt(value))}
      >
        <Stack gap='xs' pt='xs'>
          {programs.map((program) => (
            <Radio.Card
              key={program.id}
              value={program.id.toString()}
              radius='md'
              p={'sm'}
            >
              <Group wrap='nowrap' align='flex-start'>
                <Radio.Indicator />
                <Box>
                  <ProgramCard program={program} />
                </Box>
              </Group>
            </Radio.Card>
          ))}
        </Stack>
      </Radio.Group>
    </Card>
  );
}

function ProgramCard({ program }: { program: StudentProgram }) {
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

  return (
    <Box>
      <Group justify='space-between' mb={3}>
        <Text fw={500}>{program.structure.program.name}</Text>
        <Group gap='xs'>
          <Badge
            color={getStatusColor(program.status)}
            variant='light'
            size='xs'
          >
            {program.status}
          </Badge>
        </Group>
      </Group>

      <Text size='xs' c='dimmed'>
        Intake: {program.intakeDate}
      </Text>
    </Box>
  );
}
