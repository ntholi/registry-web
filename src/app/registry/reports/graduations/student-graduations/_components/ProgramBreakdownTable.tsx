import {
	Badge,
	Card,
	Paper,
	Skeleton,
	Stack,
	Table,
	Text,
	Title,
} from '@mantine/core';

interface Props {
	school?: {
		schoolName: string;
		schoolCode: string;
		totalGraduates: number;
		programs: Array<{
			programName: string;
			totalGraduates: number;
		}>;
	};
	loading?: boolean;
}

export default function ProgramBreakdownTable({ school, loading }: Props) {
	if (loading) {
		return (
			<Card withBorder p='md'>
				<Stack gap='md'>
					<Skeleton height={20} width='30%' />
					<Skeleton height={200} />
				</Stack>
			</Card>
		);
	}

	if (!school) {
		return null;
	}

	return (
		<Paper withBorder p='md'>
			<Stack gap='md'>
				<Stack gap='xs'>
					<Title order={3} size='h4'>
						{school.schoolName}
					</Title>
					<Text size='sm' c='dimmed'>
						{school.schoolCode}
					</Text>
					<Badge variant='light' color='blue' size='lg'>
						{school.totalGraduates} Graduate{school.totalGraduates !== 1 ? 's' : ''}
					</Badge>
				</Stack>

				<Table highlightOnHover>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>Program</Table.Th>
							<Table.Th ta='center'>Total Graduates</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{school.programs.length === 0 ? (
							<Table.Tr>
								<Table.Td colSpan={2}>
									<Text c='dimmed' ta='center' py='md'>
										No programs found
									</Text>
								</Table.Td>
							</Table.Tr>
						) : (
							school.programs.map((program) => (
								<Table.Tr key={program.programName}>
									<Table.Td>{program.programName}</Table.Td>
									<Table.Td ta='center'>
										<Badge variant='light'>{program.totalGraduates}</Badge>
									</Table.Td>
								</Table.Tr>
							))
						)}
					</Table.Tbody>
				</Table>
			</Stack>
		</Paper>
	);
}
