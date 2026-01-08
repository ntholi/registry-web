import {
	Badge,
	Group,
	Paper,
	ScrollArea,
	Skeleton,
	Stack,
	Table,
	Text,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import type { ReportFocusArea } from './ReportFocusModal';

interface ProgramBreakdownTableProps {
	loading?: boolean;
	school?: {
		schoolName: string;
		schoolCode: string;
		totalGraduates: number;
		maleCount: number;
		femaleCount: number;
		averageAge?: number | null;
		averageTimeToGraduate?: number | null;
		programs: Array<{
			programName: string;
			programCode: string;
			totalGraduates: number;
			maleCount: number;
			femaleCount: number;
			averageAge?: number | null;
			averageTimeToGraduate?: number | null;
		}>;
	};
	focusAreas?: ReportFocusArea[];
}

export default function ProgramBreakdownTable({
	school,
	loading,
	focusAreas = [],
}: ProgramBreakdownTableProps) {
	const isMobile = useMediaQuery('(max-width: 768px)');

	const showAll = focusAreas.length === 0;
	const showGender = showAll || focusAreas.includes('gender');
	const showAge = showAll || focusAreas.includes('age');
	const showTimeToGraduate = showAll || focusAreas.includes('timeToGraduate');

	const columnCount =
		1 +
		(showGender ? 2 : 0) +
		(showAge ? 1 : 0) +
		(showTimeToGraduate ? 1 : 0) +
		1;

	if (loading) {
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
								{Array.from({ length: columnCount - 1 }, (_, i) => (
									<Table.Th key={`header-skeleton-${i}`} ta='center' miw={70}>
										<Skeleton height={16} width={40} />
									</Table.Th>
								))}
							</Table.Tr>
						</Table.Thead>

						<Table.Tbody>
							{Array.from({ length: rows }, (_, r) => `skeleton-row-${r}`).map(
								(rowKey) => (
									<Table.Tr key={rowKey}>
										<Table.Td>
											<Skeleton height={16} width={isMobile ? 120 : 220} />
										</Table.Td>
										{Array.from({ length: columnCount - 1 }, (_, i) => (
											<Table.Td key={`cell-skeleton-${i}`} ta='center'>
												<Skeleton height={14} width={32} />
											</Table.Td>
										))}
									</Table.Tr>
								)
							)}
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
				<Badge variant='light'>{school.totalGraduates}</Badge>
			</Group>

			<ScrollArea type={isMobile ? 'scroll' : 'auto'}>
				<Table withTableBorder>
					<Table.Thead>
						<Table.Tr>
							<Table.Th miw={isMobile ? 140 : 250}>Program</Table.Th>
							{showGender && (
								<>
									<Table.Th ta='center' miw={70}>
										Male
									</Table.Th>
									<Table.Th ta='center' miw={70}>
										Female
									</Table.Th>
								</>
							)}
							{showAge && (
								<Table.Th ta='center' miw={80}>
									Avg. Age
								</Table.Th>
							)}
							{showTimeToGraduate && (
								<Table.Th ta='center' miw={100}>
									Avg. Time
								</Table.Th>
							)}
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
								{showGender && (
									<>
										<Table.Td ta='center'>
											<Text
												size='sm'
												c={program.maleCount ? undefined : 'dimmed'}
											>
												{program.maleCount || '-'}
											</Text>
										</Table.Td>
										<Table.Td ta='center'>
											<Text
												size='sm'
												c={program.femaleCount ? undefined : 'dimmed'}
											>
												{program.femaleCount || '-'}
											</Text>
										</Table.Td>
									</>
								)}
								{showAge && (
									<Table.Td ta='center'>
										<Text
											size='sm'
											c={program.averageAge != null ? undefined : 'dimmed'}
										>
											{program.averageAge != null
												? `${program.averageAge.toFixed(1)}`
												: '-'}
										</Text>
									</Table.Td>
								)}
								{showTimeToGraduate && (
									<Table.Td ta='center'>
										<Text
											size='sm'
											c={
												program.averageTimeToGraduate != null
													? undefined
													: 'dimmed'
											}
										>
											{program.averageTimeToGraduate != null
												? `${program.averageTimeToGraduate.toFixed(1)} yrs`
												: '-'}
										</Text>
									</Table.Td>
								)}
								<Table.Td ta='center'>
									<Badge radius='xs' variant='default' w={50} size='sm'>
										{program.totalGraduates}
									</Badge>
								</Table.Td>
							</Table.Tr>
						))}
						<Table.Tr>
							<Table.Td>
								<Text size='sm' fw={600}>
									School Total
								</Text>
							</Table.Td>
							{showGender && (
								<>
									<Table.Td ta='center'>
										<Text size='sm' fw={600}>
											{school.maleCount}
										</Text>
									</Table.Td>
									<Table.Td ta='center'>
										<Text size='sm' fw={600}>
											{school.femaleCount}
										</Text>
									</Table.Td>
								</>
							)}
							{showAge && (
								<Table.Td ta='center'>
									<Text size='sm' fw={600}>
										{school.averageAge != null
											? school.averageAge.toFixed(1)
											: '-'}
									</Text>
								</Table.Td>
							)}
							{showTimeToGraduate && (
								<Table.Td ta='center'>
									<Text size='sm' fw={600}>
										{school.averageTimeToGraduate != null
											? `${school.averageTimeToGraduate.toFixed(1)} yrs`
											: '-'}
									</Text>
								</Table.Td>
							)}
							<Table.Td ta='center'>
								<Badge radius='xs' variant='filled' w={50} size='sm'>
									{school.totalGraduates}
								</Badge>
							</Table.Td>
						</Table.Tr>
					</Table.Tbody>
				</Table>
			</ScrollArea>
		</Paper>
	);
}
