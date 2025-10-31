'use client';

import {
	Alert,
	Badge,
	Button,
	Card,
	Center,
	Checkbox,
	Group,
	HoverCard,
	Paper,
	ScrollArea,
	SimpleGrid,
	Stack,
	Table,
	Text,
	TextInput,
	ThemeIcon,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
	IconAlertCircle,
	IconExclamationCircle,
	IconInfoCircle,
	IconRefresh,
	IconUser,
	IconUsers,
} from '@tabler/icons-react';
import { useQueryState } from 'nuqs';
import { useState, useTransition } from 'react';
import Link from '@/components/Link';
import { getCurrentSemester } from '@/lib/helpers/students';
import { formatSemester } from '@/lib/utils';
import {
	determineSemesterStatus,
	getStudentSemesterModules,
} from '@/server/registration/requests/actions';
import { getStudent, getStudentRegistrationData } from '@/server/students/actions';
import { getAcademicRemarks } from '@/utils/grades';
import SemesterStatusModal from './SemesterStatusModal';

type ModuleDataResponse = Awaited<ReturnType<typeof getStudentSemesterModules>>;
type ModuleData = ModuleDataResponse['modules'];
type Student = {
	name: string;
	stdNo: number;
	semester: number;
	program: {
		structureCode: string;
		structureId: number;
		name: string;
		code: string;
	};
};

type ModuleWithStatus = {
	semesterModuleId: number;
	code: string;
	name: string;
	type: string;
	credits: number;
	status: 'Compulsory' | 'Elective' | `Repeat${number}`;
	semesterNo: number;
	prerequisites?: Array<{ id: number; code: string; name: string }>;
};

type SemesterStatusResult = Awaited<ReturnType<typeof determineSemesterStatus>>;

type FullStudentData = Awaited<ReturnType<typeof getStudentRegistrationData>>;

export default function RegistrationSimulator() {
	const [stdNo, setStdNo] = useQueryState('stdNo', {
		defaultValue: '',
	});
	const [student, setStudent] = useState<Student | null>(null);
	const [fullStudentData, setFullStudentData] = useState<FullStudentData | null>(null);
	const [modules, setModules] = useState<ModuleData | null>(null);
	const [selectedModules, setSelectedModules] = useState<Set<number>>(new Set());
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();
	const [isAnalyzing, startAnalyzing] = useTransition();
	const [semesterStatusResult, setSemesterStatusResult] = useState<SemesterStatusResult | null>(
		null
	);
	const [modalOpened, setModalOpened] = useState(false);

	const handleSubmit = () => {
		if (!stdNo.trim()) {
			notifications.show({
				title: 'Validation Error',
				message: 'Please enter a student number',
				color: 'red',
				icon: <IconExclamationCircle size={16} />,
			});
			return;
		}

		setError(null);
		setStudent(null);
		setModules(null);
		setSelectedModules(new Set());
		setSemesterStatusResult(null);

		startTransition(async () => {
			try {
				const lookup = await getStudent(Number(stdNo));
				if (!lookup) {
					setError('Student not found');
					notifications.show({
						title: 'Student Not Found',
						message: `No student found with number ${stdNo}`,
						color: 'red',
						icon: <IconExclamationCircle size={16} />,
					});
					return;
				}

				const studentData = await getStudentRegistrationData(lookup.stdNo);
				if (!studentData) {
					setError('Student data not available');
					return;
				}

				setFullStudentData(studentData);

				const remarks = getAcademicRemarks(studentData.programs);
				const moduleDataResponse = await getStudentSemesterModules(studentData, remarks);

				// Check if there's an error in the response
				if (moduleDataResponse.error) {
					setError(moduleDataResponse.error);
					notifications.show({
						title: 'Simulation Error',
						message: moduleDataResponse.error,
						color: 'red',
						icon: <IconExclamationCircle size={16} />,
					});
					return;
				}

				const activeProgram = studentData.programs.find((p) => p.status === 'Active');
				if (activeProgram) {
					setStudent({
						name: lookup.name,
						stdNo: lookup.stdNo,
						semester: lookup.sem,
						program: {
							structureCode: activeProgram.structure.code,
							structureId: activeProgram.structure.id,
							name: activeProgram.structure.program.name,
							code: activeProgram.structure.code,
						},
					});
				}

				setModules(moduleDataResponse.modules);
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
				setError(errorMessage);
				notifications.show({
					title: 'Simulation Error',
					message: errorMessage,
					color: 'red',
					icon: <IconExclamationCircle size={16} />,
				});
			}
		});
	};

	const handleKeyPress = (event: React.KeyboardEvent) => {
		if (event.key === 'Enter' && !isPending) {
			handleSubmit();
		}
	};

	const handleModuleSelect = (moduleId: number, checked: boolean) => {
		const newSelected = new Set(selectedModules);

		if (checked) {
			if (newSelected.size >= 8) {
				notifications.show({
					title: 'Module Limit Exceeded',
					message: 'You cannot select more than 8 modules',
					color: 'red',
					icon: <IconExclamationCircle size={16} />,
				});
				return;
			}
			newSelected.add(moduleId);
		} else {
			newSelected.delete(moduleId);
		}
		setSelectedModules(newSelected);
	};

	const handleSelectAll = (checked: boolean) => {
		if (checked && modules) {
			if (modules.length > 8) {
				notifications.show({
					title: 'Module Limit Exceeded',
					message: 'Cannot select all modules. Maximum of 8 modules allowed.',
					color: 'red',
					icon: <IconExclamationCircle size={16} />,
				});
				return;
			}
			setSelectedModules(new Set(modules.map((m) => m.semesterModuleId)));
		} else {
			setSelectedModules(new Set());
		}
	};

	const handleDetermineSemester = () => {
		if (!modules || !fullStudentData || selectedModules.size === 0) {
			notifications.show({
				title: 'Selection Required',
				message: 'Please select at least one module to determine semester',
				color: 'orange',
				icon: <IconAlertCircle size={16} />,
			});
			return;
		}

		if (selectedModules.size > 8) {
			notifications.show({
				title: 'Too Many Modules',
				message: 'Please select a maximum of 8 modules',
				color: 'red',
				icon: <IconExclamationCircle size={16} />,
			});
			return;
		}

		startAnalyzing(async () => {
			try {
				const selectedModuleData: ModuleWithStatus[] = modules
					.filter((m) => selectedModules.has(m.semesterModuleId))
					.map((m) => ({
						semesterModuleId: m.semesterModuleId,
						code: m.code,
						name: m.name,
						type: m.type,
						credits: m.credits,
						status: m.status,
						semesterNo: m.semesterNo,
						prerequisites: m.prerequisites,
					}));

				const result = await determineSemesterStatus(selectedModuleData, fullStudentData);
				setSemesterStatusResult(result);
				setModalOpened(true);
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
				notifications.show({
					title: 'Analysis Error',
					message: errorMessage,
					color: 'red',
					icon: <IconExclamationCircle size={16} />,
				});
			}
		});
	};

	const allSelected = modules ? selectedModules.size === modules.length : false;
	const indeterminate = selectedModules.size > 0 && !allSelected;

	return (
		<Stack gap="lg">
			<Paper withBorder p="md" radius="md">
				<Stack gap="md">
					<Group gap="md" align="flex-end">
						<TextInput
							placeholder="Enter student number"
							value={stdNo}
							onChange={(e) => setStdNo(e.target.value)}
							onKeyPress={handleKeyPress}
							leftSection={<IconUsers size={16} />}
							flex={1}
							maxLength={10}
						/>
						<Button
							onClick={handleSubmit}
							loading={isPending}
							leftSection={<IconRefresh size={16} />}
							disabled={!stdNo.trim()}
						>
							{isPending ? 'Simulating...' : 'Simulate'}
						</Button>
					</Group>
				</Stack>
			</Paper>

			{isPending && (
				<Card withBorder radius="md" p={65}>
					<Center>
						<Stack gap="md" align="center">
							<Text size="sm" c="dimmed">
								Simulation student registration...
							</Text>
						</Stack>
					</Center>
				</Card>
			)}

			{error && !isPending && (
				<Alert
					icon={<IconAlertCircle size={16} />}
					title="Simulation Error"
					color="red"
					variant="light"
				>
					{error}
				</Alert>
			)}

			{student && !isPending && (
				<Card withBorder radius="md" p="lg">
					<Stack gap="md">
						<Group gap="xs" align="center">
							<ThemeIcon size="sm" radius="sm" variant="light" color="teal">
								<IconUser size={14} />
							</ThemeIcon>
							<Text fw={500} size="sm">
								Student Information
							</Text>
						</Group>

						<SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
							<Paper withBorder p="sm" radius="sm">
								<Text size="xs" c="dimmed" mb={4}>
									Name
								</Text>
								<Text fw={500} size="sm">
									{student.name}
								</Text>
							</Paper>
							<Paper withBorder p="sm" radius="sm">
								<Text size="xs" c="dimmed" mb={4}>
									Student Number
								</Text>
								<Link size="sm" c="default" href={`/dashboard/students/${student.stdNo}`}>
									{student.stdNo}
								</Link>
							</Paper>
							<Paper withBorder p="sm" radius="sm">
								<Text size="xs" c="dimmed" mb={4}>
									Current Semester
								</Text>
								<Text fw={500} size="sm">
									{formatSemester(getCurrentSemester(fullStudentData)?.semesterNumber)}
								</Text>
							</Paper>
							<Paper withBorder p="sm" radius="sm">
								<Text size="xs" c="dimmed" mb={4}>
									{student.program.name}
								</Text>
								<Link
									size="sm"
									c="default"
									href={`/dashboard/schools/structures/${student.program.structureId}`}
								>
									{student.program.code}
								</Link>
							</Paper>
						</SimpleGrid>
					</Stack>
				</Card>
			)}

			{modules && modules.length > 0 && !isPending && (
				<Card withBorder radius="md" p="lg">
					<Stack gap="lg">
						<Group justify="space-between" align="center">
							<Group gap="md" align="center">
								<Checkbox
									label="Select All"
									checked={allSelected}
									indeterminate={indeterminate}
									onChange={(event) => handleSelectAll(event.currentTarget.checked)}
									disabled={modules.length > 8}
								/>
								<Badge color="blue" variant="light" size="sm">
									{modules.length} Modules
								</Badge>
							</Group>
							<Button
								onClick={handleDetermineSemester}
								loading={isAnalyzing}
								variant="outline"
								disabled={selectedModules.size === 0 || selectedModules.size > 8}
								size="xs"
							>
								{isAnalyzing ? 'Determining...' : 'Determine Semester'}
							</Button>
						</Group>

						<ModuleTable
							modules={modules}
							selectedModules={selectedModules}
							onModuleSelect={handleModuleSelect}
						/>
					</Stack>
				</Card>
			)}

			{modules && modules.length === 0 && !isPending && !error && (
				<Alert
					icon={<IconInfoCircle size={16} />}
					title="No Modules Found"
					color="blue"
					variant="light"
				>
					No eligible modules found for this student. This could mean the student has completed all
					required modules or there are no modules available for their current semester.
				</Alert>
			)}

			<SemesterStatusModal
				opened={modalOpened}
				onClose={() => setModalOpened(false)}
				result={semesterStatusResult}
				selectedModules={modules?.filter((m) => selectedModules.has(m.semesterModuleId)) || []}
			/>
		</Stack>
	);
}

function ModuleTable({
	modules,
	selectedModules,
	onModuleSelect,
}: {
	modules: ModuleData;
	selectedModules: Set<number>;
	onModuleSelect: (moduleId: number, checked: boolean) => void;
}) {
	if (modules.length === 0) {
		return (
			<Text size="sm" c="dimmed" ta="center" py="md">
				No modules found
			</Text>
		);
	}

	return (
		<ScrollArea>
			<Table striped highlightOnHover>
				<Table.Thead>
					<Table.Tr>
						<Table.Th>Select</Table.Th>
						<Table.Th>Code</Table.Th>
						<Table.Th>Module Name</Table.Th>
						<Table.Th>Type</Table.Th>
						<Table.Th>Credits</Table.Th>
						<Table.Th>Status</Table.Th>
						<Table.Th>Semester</Table.Th>
						<Table.Th>Prerequisites</Table.Th>
					</Table.Tr>
				</Table.Thead>
				<Table.Tbody>
					{modules.map((module, index) => (
						<Table.Tr key={`${module.semesterModuleId}-${index}`}>
							<Table.Td>
								<Checkbox
									checked={selectedModules.has(module.semesterModuleId)}
									onChange={(event) =>
										onModuleSelect(module.semesterModuleId, event.currentTarget.checked)
									}
									disabled={
										!selectedModules.has(module.semesterModuleId) && selectedModules.size >= 8
									}
								/>
							</Table.Td>
							<Table.Td>
								<Text fw={500} size="sm">
									{module.code}
								</Text>
							</Table.Td>
							<Table.Td>
								<Text size="sm">{module.name}</Text>
							</Table.Td>
							<Table.Td>
								<Text size="sm">{module.type}</Text>
							</Table.Td>
							<Table.Td>
								<Text size="sm" fw={500}>
									{module.credits}
								</Text>
							</Table.Td>
							<Table.Td>
								<Badge color={getStatusColor(module.status)} variant="light" size="sm">
									{module.status}
								</Badge>
							</Table.Td>
							<Table.Td>
								<Text size="sm" fw={500}>
									{formatSemester(module.semesterNo, 'short')}
								</Text>
							</Table.Td>
							<Table.Td>
								{module.prerequisites && module.prerequisites.length > 0 ? (
									<HoverCard width={300} position="top" withArrow shadow="md">
										<HoverCard.Target>
											<Text size="sm" style={{ cursor: 'pointer' }}>
												{module.prerequisites.map((p) => p.name).join(', ')}
											</Text>
										</HoverCard.Target>
										<HoverCard.Dropdown>
											{module.prerequisites.map((p, idx) => (
												<Text key={idx} size="sm">
													{p.name} ({p.code})
												</Text>
											))}
										</HoverCard.Dropdown>
									</HoverCard>
								) : (
									<Text size="sm">-</Text>
								)}
							</Table.Td>
						</Table.Tr>
					))}
				</Table.Tbody>
			</Table>
		</ScrollArea>
	);
}

function getStatusColor(status: string) {
	if (status === 'Compulsory') return 'blue';
	if (status === 'Elective') return 'green';
	if (status.startsWith('Repeat')) return 'orange';
	return 'gray';
}
