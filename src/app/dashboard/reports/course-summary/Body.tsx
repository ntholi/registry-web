'use client';
import {
	Alert,
	Button,
	Card,
	CardSection,
	Group,
	Loader,
	Select,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useCurrentTerm } from '@/hooks/use-current-term';
import { toClassName } from '@/lib/utils';
import {
	getAssignedModuleByUserAndModule,
	getAssignedModulesByCurrentUser,
} from '@/server/assigned-modules/actions';
import { generateCourseSummaryReport } from '@/server/reports/course-summary/actions';

export default function Body() {
	const [isDownloading, setIsDownloading] = useState(false);
	const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
	const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);

	const { data: assignedModules, isLoading: modulesLoading } = useQuery({
		queryKey: ['assigned-modules-current-user'],
		queryFn: getAssignedModulesByCurrentUser,
	});

	const { data: modulePrograms, isLoading: programsLoading } = useQuery({
		queryKey: ['module-programs', selectedModuleId],
		queryFn: () => {
			if (!selectedModuleId) return Promise.resolve([]);
			const moduleIdNum = parseInt(selectedModuleId, 10);
			const selectedModule = assignedModules?.find(
				(m) => m.semesterModule?.module?.id === moduleIdNum
			);
			if (!selectedModule?.semesterModule?.module?.id) return Promise.resolve([]);
			return getAssignedModuleByUserAndModule(selectedModule.semesterModule.module.id);
		},
		enabled: !!selectedModuleId && !!assignedModules,
	});
	const { currentTerm } = useCurrentTerm();

	const moduleOptions = useMemo(() => {
		return (
			assignedModules?.map((assignment) => ({
				value: assignment.semesterModule?.module?.id?.toString() || '',
				label: `${assignment.semesterModule?.module?.code} - ${assignment.semesterModule?.module?.name}`,
			})) || []
		);
	}, [assignedModules]);

	const programOptions = useMemo(() => {
		const options: { value: string; label: string }[] = [];
		const seen = new Set<number>();

		modulePrograms?.forEach((module) => {
			const program = module.semesterModule?.semester?.structure.program;
			if (program && !seen.has(program.id)) {
				seen.add(program.id);
				options.push({
					value: program.id.toString(),
					label: toClassName(program.code || '', module.semesterModule?.semester?.name || ''),
				});
			}
		});

		return options;
	}, [modulePrograms]);

	useEffect(() => {
		setSelectedProgramId(null);
	}, []);

	const generateReportMutation = useMutation({
		mutationFn: async () => {
			if (!selectedModuleId || !selectedProgramId) {
				throw new Error('Please select a module and program');
			}

			const selectedModule = assignedModules?.find(
				(m) => m.semesterModule?.module?.id === parseInt(selectedModuleId, 10)
			);

			if (!selectedModule?.semesterModuleId) {
				throw new Error('Selected module not found');
			}

			setIsDownloading(true);
			try {
				const result = await generateCourseSummaryReport(
					Number(selectedProgramId),
					selectedModule.semesterModuleId
				);
				if (!result.success) {
					throw new Error(result.error || 'Failed to generate report');
				}
				return result.data;
			} finally {
				setIsDownloading(false);
			}
		},
		onSuccess: (base64Data) => {
			if (!base64Data) {
				throw new Error('No data received from server');
			}
			const binaryString = window.atob(base64Data);
			const bytes = new Uint8Array(binaryString.length);
			for (let i = 0; i < binaryString.length; i++) {
				bytes[i] = binaryString.charCodeAt(i);
			}
			const blob = new Blob([bytes], {
				type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			});
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;

			const selectedModule = assignedModules?.find(
				(m) => m.semesterModule?.module?.id === parseInt(selectedModuleId || '', 10)
			);
			const selectedProgram = modulePrograms?.find(
				(m) => m.semesterModule?.semester?.structure.program.id === Number(selectedProgramId)
			);

			const moduleCode = selectedModule?.semesterModule?.module?.code || 'Module';
			const programCode =
				selectedProgram?.semesterModule?.semester?.structure.program.code || 'Program';
			a.download = `${moduleCode}_${programCode}_Course_Summary_${new Date().toISOString().split('T')[0]}.docx`;
			document.body.appendChild(a);
			a.click();
			URL.revokeObjectURL(url);
			document.body.removeChild(a);
		},
		onError: (error) => {
			console.error('Error generating course summary report:', error);
			notifications.show({
				title: 'Error',
				message: `Error generating course summary report: ${error.message}`,
				color: 'red',
			});
		},
	});
	const canGenerate = !!selectedModuleId && !!selectedProgramId;
	return (
		<Stack align="center" justify="center" p="xl">
			<Alert variant="light" color="orange" title="Under Development" w="100%" maw={600} mb="md">
				This feature is currently under development. Some functionality may be limited or subject to
				change.
			</Alert>
			<Card shadow="md" radius="md" withBorder w="100%" maw={600}>
				<CardSection inheritPadding py="md">
					<Title order={3}>Course Summary Report Generation</Title>
					<Text c="dimmed" size="sm">
						Generate Course Summary reports for your assigned modules
					</Text>
				</CardSection>
				<CardSection inheritPadding>
					<Stack gap="md">
						<Text my="xs">
							Select a module from your assigned modules to generate a course summary report for{' '}
							{currentTerm?.name}.
						</Text>

						<Select
							label="Select Module"
							placeholder="Choose a module"
							data={moduleOptions}
							value={selectedModuleId}
							onChange={(value) => {
								setSelectedModuleId(value || null);
								setSelectedProgramId(null);
							}}
							disabled={modulesLoading}
							leftSection={modulesLoading ? <Loader size={16} /> : null}
							searchable
						/>

						{selectedModuleId && (
							<Select
								label="Select Program"
								placeholder="Select a program"
								data={programOptions}
								value={selectedProgramId || ''}
								onChange={(value) => setSelectedProgramId(value || null)}
								disabled={programsLoading}
								leftSection={programsLoading ? <Loader size={16} /> : null}
								searchable
								clearable
							/>
						)}
					</Stack>
				</CardSection>
				<CardSection inheritPadding py="md">
					<Group>
						<Button
							fullWidth
							onClick={() => generateReportMutation.mutate()}
							disabled={!canGenerate || generateReportMutation.isPending || isDownloading}
							leftSection={
								generateReportMutation.isPending || isDownloading ? <Loader size={16} /> : null
							}
						>
							{generateReportMutation.isPending || isDownloading
								? 'Generating Report...'
								: 'Generate Course Summary Report'}
						</Button>
					</Group>
				</CardSection>
			</Card>
		</Stack>
	);
}
