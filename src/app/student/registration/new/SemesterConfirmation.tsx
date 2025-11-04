import {
	Alert,
	Badge,
	Card,
	Group,
	LoadingOverlay,
	Paper,
	SimpleGrid,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import type { StudentModuleStatus } from '@/db/schema';
import { formatSemester } from '@/lib/utils';

type ModuleWithStatus = {
	semesterModuleId: number;
	code: string;
	name: string;
	type: string;
	credits: number;
	status: 'Compulsory' | 'Elective' | `Repeat${number}`;
	semesterNo: string;
	prerequisites?: Array<{ id: number; code: string; name: string }>;
};

type SelectedModule = {
	moduleId: number;
	moduleStatus: StudentModuleStatus;
};

interface SemesterConfirmationProps {
	semesterData: {
		semesterNo: string;
		status: 'Active' | 'Repeat';
	} | null;
	selectedModules: SelectedModule[];
	availableModules: ModuleWithStatus[];
	loading: boolean;
}

export default function SemesterConfirmation({
	semesterData,
	selectedModules,
	availableModules,
	loading,
}: SemesterConfirmationProps) {
	if (loading) {
		return (
			<div style={{ position: 'relative', minHeight: 200 }}>
				<LoadingOverlay visible />
			</div>
		);
	}

	if (!semesterData) {
		return (
			<Alert icon={<IconInfoCircle size={16} />} color='orange'>
				Semester information is being calculated based on your selected
				modules...
			</Alert>
		);
	}

	const getSelectedModuleDetails = () => {
		return selectedModules
			.map((selected) => {
				const moduleDetail = availableModules.find(
					(module) => module.semesterModuleId === selected.moduleId
				);
				return moduleDetail
					? { ...moduleDetail, selectedStatus: selected.moduleStatus }
					: null;
			})
			.filter(Boolean);
	};

	const selectedModuleDetails = getSelectedModuleDetails();
	const totalCredits = selectedModuleDetails.reduce(
		(sum, module) => sum + (module?.credits || 0),
		0
	);

	return (
		<Stack gap='lg'>
			<Paper withBorder p='lg'>
				<Stack gap='md'>
					<Group justify='space-between' align='center'>
						<Title order={3} size={'h3'}>
							{formatSemester(semesterData.semesterNo)}
						</Title>
					</Group>

					<SimpleGrid cols={3} spacing='md'>
						<div>
							<Text size='sm' c='dimmed'>
								Credits
							</Text>
							<Text fw={700}>{totalCredits}</Text>
						</div>
						<div>
							<Text size='sm' c='dimmed'>
								Modules
							</Text>
							<Text fw={700}>{selectedModules.length}</Text>
						</div>
						<div>
							<Text size='sm' c='dimmed'>
								Status
							</Text>
							<Text fw={700}>{semesterData.status}</Text>
						</div>
					</SimpleGrid>

					{semesterData.status === 'Repeat' && (
						<Alert
							icon={<IconInfoCircle size={16} />}
							color='orange'
							variant='light'
						>
							You are repeating this semester and retaking some modules.
						</Alert>
					)}
				</Stack>
			</Paper>

			<div>
				<Title order={4} mb='md'>
					Selected Modules
				</Title>

				<SimpleGrid cols={{ base: 1, sm: 2 }} spacing='sm'>
					{selectedModuleDetails.map(
						(module) =>
							module && (
								<Card key={module.semesterModuleId} withBorder p='md'>
									<Group justify='space-between' mb='xs'>
										<Text fw={600}>{module.code}</Text>
										<Badge size='xs' color='gray'>
											{module.status}
										</Badge>
									</Group>
									<Text size='sm' mb='xs'>
										{module.name}
									</Text>
								</Card>
							)
					)}
				</SimpleGrid>
			</div>

			<Alert icon={<IconInfoCircle size={16} />} color='blue'>
				Please review the information above carefully. It is your responsibility
				to ensure all details are correct before proceeding.
			</Alert>
		</Stack>
	);
}
