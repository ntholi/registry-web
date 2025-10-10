import {
  Text,
  Badge,
  Table,
  ScrollArea,
  Group,
  Box,
  Stack,
  Paper,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { formatSemester } from '@/lib/utils';

interface ProgramBreakdownTableProps {
  school: {
    schoolName: string;
    schoolCode: string;
    totalStudents: number;
    programs: Array<{
      programName: string;
      schoolCode: string;
      yearBreakdown: { [year: number]: number };
      totalStudents: number;
    }>;
  };
}

export default function ProgramBreakdownTable({
  school,
}: ProgramBreakdownTableProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  const allSemesters = Array.from(
    new Set(
      school.programs.flatMap((program) =>
        Object.keys(program.yearBreakdown).map((semester) => parseInt(semester))
      )
    )
  ).sort((a, b) => a - b);

  return (
    <Paper withBorder p='md'>
      <Group justify='space-between' mb='md'>
        <Stack gap={4}>
          <Text fw={600}>{school.schoolName}</Text>
          <Text size='sm' c='dimmed'>
            {school.schoolCode}
          </Text>
        </Stack>
        <Badge variant='light'>{school.totalStudents}</Badge>
      </Group>

      <ScrollArea type={isMobile ? 'scroll' : 'auto'}>
        <Table horizontalSpacing='md' verticalSpacing='sm' striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th miw={isMobile ? 140 : 250}>Program</Table.Th>
              {allSemesters.map((semester) => (
                <Table.Th key={semester} ta='center' miw={70}>
                  {formatSemester(semester, 'mini')}
                </Table.Th>
              ))}
              <Table.Th ta='center' miw={70}>
                Total
              </Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {school.programs.map((program, pIndex) => (
              <Table.Tr key={pIndex}>
                <Table.Td>
                  <Text size='sm'>{program.programName}</Text>
                </Table.Td>
                {allSemesters.map((semester) => (
                  <Table.Td key={semester} ta='center'>
                    <Text
                      size='sm'
                      c={program.yearBreakdown[semester] ? undefined : 'dimmed'}
                    >
                      {program.yearBreakdown[semester] || '-'}
                    </Text>
                  </Table.Td>
                ))}
                <Table.Td ta='center'>
                  <Badge variant='default' size='sm'>
                    {program.totalStudents}
                  </Badge>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </Paper>
  );
}
