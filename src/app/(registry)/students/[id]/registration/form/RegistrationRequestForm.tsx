'use client';

import {
	Alert,
	Box,
	Button,
	Group,
	LoadingOverlay,
	Stack,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconExclamationCircle, IconInfoCircle } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { StudentModuleStatus } from '@/db/schema';
import { getStudentCurrentSponsorship } from '@/server/finance/sponsors/actions';
import {
	createRegistrationWithModules,
	determineSemesterStatus,
	getStudentSemesterModules,
} from '@/server/registry/registration/requests/actions';
import { getAcademicHistory } from '@/server/registry/students/actions';
import type { Student } from '@/shared/lib/helpers/students';
import { useCurrentTerm } from '@/shared/lib/hooks/use-current-term';
import { getAcademicRemarks } from '@/shared/lib/utils/grades';
import ModuleSection from './ModuleSection';
import SemesterInfoCard from './SemesterInfoCard';
import SponsorSelector from './SponsorSelector';
import TermSelector from './TermSelector';

type Props = {
	stdNo: number;
};

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

type SemesterData = {
	semesterNo: string;
	status: 'Active' | 'Repeat';
};

type SponsorshipData = {
	sponsorId: number;
	borrowerNo?: string;
	bankName?: string;
	accountNumber?: string;
};

type FormValues = {
	modules: { moduleId: number; moduleStatus: StudentModuleStatus }[];
	sponsorship: SponsorshipData;
	selectedTermId: number | null;
};

function normalizeModuleStatus(
	status: ModuleWithStatus['status']
): StudentModuleStatus {
	if (status.startsWith('Repeat')) {
		const repeatNumber = Number.parseInt(status.replace('Repeat', ''), 10);
		if (
			Number.isInteger(repeatNumber) &&
			repeatNumber >= 1 &&
			repeatNumber <= 7
		) {
			return `Repeat${repeatNumber}` as StudentModuleStatus;
		}
		return 'Repeat1';
	}

	return 'Compulsory';
}

export default function RegistrationRequestForm({
	stdNo,
}: Omit<Props, 'opened' | 'onClose'>) {
	const { currentTerm } = useCurrentTerm();
	const queryClient = useQueryClient();
	const [selectedModules, setSelectedModules] = useState<Set<number>>(
		new Set()
	);
	const [availableModules, setAvailableModules] = useState<ModuleWithStatus[]>(
		[]
	);
	const [semesterData, setSemesterData] = useState<SemesterData | null>(null);
	const sponsorshipAutoFilled = useRef(false);

	const [debouncedSelectedModules] = useDebouncedValue(selectedModules, 300);

	const form = useForm<FormValues>({
		initialValues: {
			modules: [],
			sponsorship: {
				sponsorId: 0,
				borrowerNo: '',
				bankName: undefined,
				accountNumber: '',
			},
			selectedTermId: currentTerm?.id || null,
		},
		validate: {
			modules: (value) =>
				value.length === 0 ? 'Please select at least one module' : null,
			selectedTermId: (value) =>
				value === null ? 'Please select a term' : null,
			sponsorship: {
				sponsorId: (value) => (value === 0 ? 'Please select a sponsor' : null),
				borrowerNo: (_value, _values) => {
					// Validation will be handled by SponsorSelector component
					return null;
				},
			},
		},
	});

	const { data: student, isLoading: studentLoading } = useQuery({
		queryKey: ['student', stdNo],
		queryFn: () => getAcademicHistory(stdNo),
		enabled: !!stdNo,
	});

	const { data: sponsorshipData, isLoading: sponsorshipLoading } = useQuery({
		queryKey: ['studentSponsorship', stdNo],
		queryFn: () => getStudentCurrentSponsorship(stdNo),
		enabled: !!stdNo,
	});

	const activeProgram = student?.programs?.find((p) => p.status === 'Active');
	const structureId = activeProgram?.structureId;

	const { data: moduleData, isLoading: modulesLoading } = useQuery({
		queryKey: ['studentSemesterModules', stdNo],
		queryFn: async () => {
			if (!student) return null;

			const remarks = getAcademicRemarks(student.programs);
			const result = await getStudentSemesterModules(
				student as unknown as Student,
				remarks
			);

			if (result.error?.includes('Remain in Semester')) {
				const modifiedRemarks = {
					...remarks,
					status: 'Proceed' as const,
				};

				const overrideResult = await getStudentSemesterModules(
					student as unknown as Student,
					modifiedRemarks
				);

				return {
					...overrideResult,
					warning: result.error,
				} as typeof overrideResult & { warning: string };
			}

			return result;
		},
		enabled: !!student,
	});

	const selectedModuleData = useMemo(
		() =>
			availableModules.filter((m) =>
				debouncedSelectedModules.has(m.semesterModuleId)
			),
		[availableModules, debouncedSelectedModules]
	);

	const { data: semesterStatus, isLoading: semesterStatusLoading } = useQuery({
		queryKey: ['semesterStatus', Array.from(debouncedSelectedModules)],
		queryFn: async () => {
			if (
				debouncedSelectedModules.size === 0 ||
				!student ||
				selectedModuleData.length === 0
			)
				return null;

			return determineSemesterStatus(selectedModuleData, student as never);
		},
		enabled:
			debouncedSelectedModules.size > 0 &&
			!!student &&
			selectedModuleData.length > 0,
	});

	const createMutation = useMutation({
		mutationFn: async (data: FormValues) => {
			if (!data.selectedTermId || !semesterData) {
				throw new Error('Missing required data');
			}

			return createRegistrationWithModules({
				stdNo,
				termId: data.selectedTermId,
				sponsorId: data.sponsorship.sponsorId,
				modules: data.modules,
				semesterNumber: semesterData.semesterNo,
				semesterStatus: semesterData.status,
				borrowerNo: data.sponsorship.borrowerNo,
				bankName: data.sponsorship.bankName,
				accountNumber: data.sponsorship.accountNumber,
			});
		},
		onSuccess: () => {
			notifications.show({
				title: 'Success',
				message: 'Registration request created successfully',
				color: 'green',
			});
			queryClient.invalidateQueries({
				queryKey: ['registrationRequests', stdNo],
			});
			handleReset();
		},
		onError: (error) => {
			notifications.show({
				title: 'Error',
				message: error.message || 'Failed to create registration request',
				color: 'red',
				icon: <IconExclamationCircle size={16} />,
			});
		},
	});

	useEffect(() => {
		if (moduleData?.modules) {
			setAvailableModules(moduleData.modules);
		}
	}, [moduleData]);

	useEffect(() => {
		if (semesterStatus) {
			setSemesterData(semesterStatus);
		}
	}, [semesterStatus]);

	useEffect(() => {
		if (sponsorshipData && !sponsorshipAutoFilled.current) {
			form.setFieldValue('sponsorship', {
				sponsorId: sponsorshipData.sponsorId,
				borrowerNo: sponsorshipData.borrowerNo || '',
				bankName: sponsorshipData.bankName || undefined,
				accountNumber: sponsorshipData.accountNumber || '',
			});
			sponsorshipAutoFilled.current = true;
		}
	}, [sponsorshipData, form]);

	const handleModuleToggle = (semesterModuleId: number) => {
		const newSelected = new Set(selectedModules);
		if (newSelected.has(semesterModuleId)) {
			newSelected.delete(semesterModuleId);
		} else {
			newSelected.add(semesterModuleId);
		}
		setSelectedModules(newSelected);

		const selectedModulesList = availableModules
			.filter((m) => newSelected.has(m.semesterModuleId))
			.map((m) => ({
				moduleId: m.semesterModuleId,
				moduleStatus: normalizeModuleStatus(m.status),
			}));

		form.setFieldValue('modules', selectedModulesList);
	};

	const handleSubmit = (values: FormValues) => {
		createMutation.mutate(values);
	};

	const handleReset = () => {
		form.reset();
		setSelectedModules(new Set());
		setAvailableModules([]);
		setSemesterData(null);
		sponsorshipAutoFilled.current = false;
	};

	const isLoading = studentLoading || modulesLoading || sponsorshipLoading;
	const hasError = moduleData?.error;
	const hasWarning = (moduleData as { warning?: string })?.warning;
	const isProcessingSelection = selectedModules !== debouncedSelectedModules;

	return (
		<Box pos='relative' mih='80vh'>
			<LoadingOverlay visible={isLoading} />

			<form onSubmit={form.onSubmit(handleSubmit)}>
				<Stack gap='lg'>
					{hasError && (
						<Alert color='red' icon={<IconInfoCircle size={16} />}>
							{hasError}
						</Alert>
					)}

					{hasWarning && (
						<Alert color='yellow' icon={<IconInfoCircle size={16} />}>
							{hasWarning}
						</Alert>
					)}

					<TermSelector
						value={form.values.selectedTermId}
						onChange={(value) => form.setFieldValue('selectedTermId', value)}
						error={form.errors.selectedTermId as string}
					/>

					{!hasError && (
						<>
							<ModuleSection
								availableModules={availableModules}
								setAvailableModules={setAvailableModules}
								selectedModules={selectedModules}
								onModuleToggle={handleModuleToggle}
								onModulesChange={(modules) =>
									form.setFieldValue('modules', modules)
								}
								structureId={structureId}
								student={student}
								error={form.errors.modules as string}
							/>

							<SemesterInfoCard
								semesterData={semesterData}
								selectedModules={selectedModules}
								onSemesterChange={setSemesterData}
								isLoading={semesterStatusLoading || isProcessingSelection}
							/>

							<SponsorSelector
								value={form.values.sponsorship}
								onChange={(value) => form.setFieldValue('sponsorship', value)}
								errors={{
									sponsorId: form.errors['sponsorship.sponsorId'] as string,
									borrowerNo: form.errors['sponsorship.borrowerNo'] as string,
								}}
							/>
						</>
					)}

					<Group justify='flex-end'>
						<Button variant='outline' onClick={handleReset}>
							Reset
						</Button>
						<Button
							type='submit'
							loading={createMutation.isPending}
							disabled={
								selectedModules.size === 0 ||
								!semesterData ||
								!form.values.selectedTermId
							}
						>
							Create Registration Request
						</Button>
					</Group>
				</Stack>
			</form>
		</Box>
	);
}
