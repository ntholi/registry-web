import { Card, Text, Badge, Table, ScrollArea, Group } from '@mantine/core';
import { IconBuilding } from '@tabler/icons-react';
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
    <Card withBorder>
      <Group justify='space-between' mb='sm'>
        <Group>
          <IconBuilding size={20} />
          <div>
            <Text fw={600}>{school.schoolName}</Text>
            <Text size='sm' c='dimmed'>
              {school.schoolCode}
            </Text>
          </div>
        </Group>
        <Badge variant='light' size='sm'>
          {school.totalStudents} students
        </Badge>
      </Group>

      <ScrollArea type={isMobile ? 'scroll' : 'hover'}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th miw={isMobile ? 120 : 200}>Program</Table.Th>
              {allSemesters.map((semester) => (
                <Table.Th key={semester} ta='center' miw={80}>
                  {formatSemester(semester, 'mini')}
                </Table.Th>
              ))}
              <Table.Th ta='center' miw={60}>
                Total
              </Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {school.programs.map((program, pIndex) => (
              <Table.Tr key={pIndex}>
                <Table.Td>
                  <Text size={isMobile ? 'xs' : 'sm'} fw={500}>
                    {program.programName}
                  </Text>
                </Table.Td>
                {allSemesters.map((semester) => (
                  <Table.Td key={semester} ta='center'>
                    <Text size={isMobile ? 'xs' : 'sm'}>
                      {program.yearBreakdown[semester] || 0}
                    </Text>
                  </Table.Td>
                ))}
                <Table.Td ta='center'>
                  <Badge variant='filled' size={isMobile ? 'xs' : 'sm'}>
                    {program.totalStudents}
                  </Badge>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </Card>
  );
}
