'use client';

import {
	Badge,
	Card,
	Center,
	Group,
	Modal,
	Paper,
	ScrollArea,
	Stack,
	Table,
	Text,
	Title,
	useMantineColorScheme,
} from '@mantine/core';
import { formatSemester } from '@/lib/utils';

type SemesterStatusResult = {
	semesterNo: number;
	status: 'Active' | 'Repeat';
};

type SelectedModule = {
	semesterModuleId: number;
	code: string;
	name: string;
	type: string;
	credits: number;
	status: 'Compulsory' | 'Elective' | `Repeat${number}`;
	semesterNo: number;
	prerequisites?: Array<{ id: number; code: string; name: string }>;
};

type Props = {
	opened: boolean;
	onClose: () => void;
	result: SemesterStatusResult | null;
	selectedModules: SelectedModule[];
};

export default function SemesterStatusModal({
	opened,
	onClose,
	result,
	selectedModules,
}: Props) {
	const { colorScheme } = useMantineColorScheme();

	if (!result) return null;

	const getStatusColor = (status: string) => {
		return status === 'Active' ? 'green' : 'orange';
	};

	const totalCredits = selectedModules.reduce(
		(sum, module) => sum + module.credits,
		0
	);

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title='Semester Calculator'
			size='lg'
			padding='lg'
		>
			<Stack gap='xl'>
				<Paper
					withBorder
					p='xl'
					style={(theme) => ({
						borderWidth: 1,
						backgroundColor:
							colorScheme === 'dark'
								? theme.colors.dark[7]
								: theme.colors.gray[0],
						borderColor:
							colorScheme === 'dark'
								? theme.colors.dark[4]
								: theme.colors.gray[3],
					})}
				>
					<Center>
						<Stack align='center' gap='md'>
							<Stack align='center' gap='xs'>
								<Title
									order={2}
									size='h2'
									fw={600}
									c={getStatusColor(result.status)}
								>
									{formatSemester(result.semesterNo)}
								</Title>
								<Badge
									color={getStatusColor(result.status)}
									variant='filled'
									radius='sm'
								>
									{result.status}
								</Badge>
							</Stack>
						</Stack>
					</Center>
				</Paper>

				<Group grow>
					<Paper
						withBorder
						p='md'
						radius='md'
						ta='center'
						style={(theme) => ({
							backgroundColor:
								colorScheme === 'dark' ? theme.colors.dark[6] : theme.white,
							borderColor:
								colorScheme === 'dark'
									? theme.colors.dark[4]
									: theme.colors.gray[3],
						})}
					>
						<Text size='xs' c='dimmed' mb={4} tt='uppercase' fw={500}>
							Selected Modules
						</Text>
						<Text fw={600} size='xl'>
							{selectedModules.length}
						</Text>
					</Paper>
					<Paper
						withBorder
						p='md'
						radius='md'
						ta='center'
						style={(theme) => ({
							backgroundColor:
								colorScheme === 'dark' ? theme.colors.dark[6] : theme.white,
							borderColor:
								colorScheme === 'dark'
									? theme.colors.dark[4]
									: theme.colors.gray[3],
						})}
					>
						<Text size='xs' c='dimmed' mb={4} tt='uppercase' fw={500}>
							Total Credits
						</Text>
						<Text fw={600} size='xl'>
							{totalCredits}
						</Text>
					</Paper>
				</Group>

				{selectedModules.length > 0 && (
					<Card
						withBorder
						p='md'
						radius='md'
						style={(theme) => ({
							backgroundColor:
								colorScheme === 'dark' ? theme.colors.dark[6] : theme.white,
							borderColor:
								colorScheme === 'dark'
									? theme.colors.dark[4]
									: theme.colors.gray[3],
						})}
					>
						<Text fw={500} size='md' mb='md' c='dimmed'>
							Enrolled Modules
						</Text>

						<ScrollArea.Autosize mah={350}>
							<Table striped highlightOnHover>
								<Table.Thead>
									<Table.Tr>
										<Table.Th>Code</Table.Th>
										<Table.Th>Module Name</Table.Th>
										<Table.Th>Status</Table.Th>
									</Table.Tr>
								</Table.Thead>
								<Table.Tbody>
									{selectedModules.map((module, index) => (
										<Table.Tr key={`${module.semesterModuleId}-${index}`}>
											<Table.Td>
												<Text fw={500} size='sm'>
													{module.code}
												</Text>
											</Table.Td>
											<Table.Td>
												<Text size='sm'>{module.name}</Text>
											</Table.Td>
											<Table.Td>
												<Badge
													color={getModuleStatusColor(module.status)}
													variant='light'
													size='sm'
												>
													{module.status}
												</Badge>
											</Table.Td>
										</Table.Tr>
									))}
								</Table.Tbody>
							</Table>
						</ScrollArea.Autosize>
					</Card>
				)}
			</Stack>
		</Modal>
	);
}

function getModuleStatusColor(status: string) {
	if (status === 'Compulsory') return 'blue';
	if (status === 'Elective') return 'green';
	if (status.startsWith('Repeat')) return 'orange';
	return 'gray';
}
