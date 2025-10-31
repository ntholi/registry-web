import { Badge, Group, Paper, ScrollArea, Skeleton, Stack, Table, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { formatSemester } from '@/lib/utils';

interface ProgramBreakdownTableProps {
	loading?: boolean;
	school?: {
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

export default function ProgramBreakdownTable({ school, loading }: ProgramBreakdownTableProps) {
	const isMobile = useMediaQuery('(max-width: 768px)');

	const allSemesters = school
		? Array.from(
				new Set(
					school.programs.flatMap((program) =>
						Object.keys(program.yearBreakdown).map((semester) => parseInt(semester, 10))
					)
				)
			).sort((a, b) => a - b)
		: [];

	const placeholderColumnCount = 6;

	if (loading) {
		const cols = allSemesters.length || placeholderColumnCount;
		const rows = 4;

		return (
			<Paper withBorder p='md'>
				<Group justify='space-between' mb='md'>
					<Stack gap={4}>
						<Skeleton height={18} width={180} />
						<Skeleton height={14} width={120} />
					</Stack>
					<Skeleton height={28} width={48} radius='sm' />
				</Group>

				<ScrollArea type={isMobile ? 'scroll' : 'auto'}>
					<Table withTableBorder>
						<Table.Thead>
							<Table.Tr>
								<Table.Th miw={isMobile ? 140 : 250}>
									<Skeleton height={18} width={isMobile ? 100 : 160} />
								</Table.Th>
								{Array.from({ length: cols }, (_, i) => `skeleton-header-col-${i}`).map((key) => (
									<Table.Th key={key} ta='center' miw={70}>
										<Skeleton height={16} width={40} />
									</Table.Th>
								))}
								<Table.Th ta='center' miw={70}>
									<Skeleton height={16} width={40} />
								</Table.Th>
							</Table.Tr>
						</Table.Thead>

						<Table.Tbody>
							{Array.from({ length: rows }, (_, r) => `skeleton-row-${r}`).map((rowKey) => (
								<Table.Tr key={rowKey}>
									<Table.Td>
										<Skeleton height={16} width={isMobile ? 120 : 220} />
									</Table.Td>
									{Array.from({ length: cols }, (_, c) => `${rowKey}-col-${c}`).map((cellKey) => (
										<Table.Td key={cellKey} ta='center'>
											<Skeleton height={14} width={32} />
										</Table.Td>
									))}
									<Table.Td ta='center'>
										<Skeleton height={20} width={48} />
									</Table.Td>
								</Table.Tr>
							))}
						</Table.Tbody>
					</Table>
				</ScrollArea>
			</Paper>
		);
	}

	if (!school) return null;

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
				<Table withTableBorder>
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
						{school.programs.map((program) => (
							<Table.Tr key={program.programName}>
								<Table.Td>
									<Text size='sm'>{program.programName}</Text>
								</Table.Td>
								{allSemesters.map((semester) => (
									<Table.Td key={semester} ta='center'>
										<Text size='sm' c={program.yearBreakdown[semester] ? undefined : 'dimmed'}>
											{program.yearBreakdown[semester] || '-'}
										</Text>
									</Table.Td>
								))}
								<Table.Td ta='center'>
									<Badge radius={'xs'} variant='default' w={50} size='sm'>
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
