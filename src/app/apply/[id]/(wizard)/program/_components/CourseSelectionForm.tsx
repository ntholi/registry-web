'use client';

import type { ProgramLevel } from '@academic/_database';
import { createOrUpdateApplication } from '@admissions/applications';
import { useApplicant } from '@apply/_lib/useApplicant';
import {
	Box,
	Divider,
	Paper,
	SegmentedControl,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
	ThemeIcon,
	Title,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconSchool } from '@tabler/icons-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import {
	parseAsInteger,
	parseAsString,
	parseAsStringLiteral,
	useQueryState,
	useQueryStates,
} from 'nuqs';
import { useMemo, useState } from 'react';
import CoursesFilters from '@/app/apply/courses/_components/CoursesFilters';
import WizardNavigation from '../../_components/WizardNavigation';
import { getActiveIntake, getEligiblePrograms } from '../_server/actions';
import CourseCard from './CourseCard';

type EligibleProgram = {
	id: number;
	name: string;
	code: string;
	level: ProgramLevel;
	schoolId: number;
	school: {
		id: number;
		code: string;
		name: string;
		shortName: string | null;
	};
};

type Props = {
	applicationId: string;
};

export default function CourseSelectionForm({ applicationId }: Props) {
	const router = useRouter();
	const [choiceType, setChoiceType] = useQueryState(
		'choice',
		parseAsStringLiteral(['first', 'second']).withDefault('first')
	);

	const [filters] = useQueryStates({
		schoolId: parseAsInteger,
		level: parseAsString,
	});

	const {
		applicant,
		currentApplication,
		isSuccess: appLoaded,
		refetch,
	} = useApplicant();
	const applicantId = applicant?.id ?? '';

	const { data: eligiblePrograms = [], isLoading: loadingPrograms } = useQuery({
		queryKey: ['eligible-programs', applicantId],
		queryFn: () => getEligiblePrograms(applicantId),
		enabled: !!applicantId,
	});

	const { data: activeIntake, isLoading: loadingIntake } = useQuery({
		queryKey: ['active-intake'],
		queryFn: getActiveIntake,
	});

	const [firstChoice, setFirstChoice] = useState<string | null>(null);
	const [secondChoice, setSecondChoice] = useState<string | null>(null);
	const [initialized, setInitialized] = useState(false);

	if (appLoaded && !initialized) {
		if (currentApplication?.firstChoiceProgramId) {
			setFirstChoice(String(currentApplication.firstChoiceProgramId));
		}
		if (currentApplication?.secondChoiceProgramId) {
			setSecondChoice(String(currentApplication.secondChoiceProgramId));
		}
		setInitialized(true);
	}

	const filteredPrograms = useMemo(() => {
		let result = eligiblePrograms as EligibleProgram[];
		if (filters.schoolId) {
			result = result.filter((p) => p.schoolId === filters.schoolId);
		}
		if (filters.level) {
			result = result.filter((p) => p.level === filters.level);
		}
		return result;
	}, [eligiblePrograms, filters.schoolId, filters.level]);

	const schools = useMemo(() => {
		const map = new Map<
			number,
			{ id: number; shortName: string | null; name: string; code: string }
		>();
		for (const p of eligiblePrograms as EligibleProgram[]) {
			if (!map.has(p.school.id)) {
				map.set(p.school.id, {
					id: p.school.id,
					shortName: p.school.shortName,
					name: p.school.name,
					code: p.school.code,
				});
			}
		}
		return Array.from(map.values()).sort((a, b) =>
			a.name.localeCompare(b.name)
		);
	}, [eligiblePrograms]);

	const levels = useMemo(() => {
		const set = new Set<ProgramLevel>();
		for (const p of eligiblePrograms as EligibleProgram[]) {
			set.add(p.level);
		}
		return Array.from(set);
	}, [eligiblePrograms]);

	const firstChoiceProgram = useMemo(
		() =>
			(eligiblePrograms as EligibleProgram[]).find(
				(p) => String(p.id) === firstChoice
			),
		[eligiblePrograms, firstChoice]
	);

	const submitMutation = useMutation({
		mutationFn: async () => {
			if (!firstChoice || !activeIntake?.id) {
				throw new Error('Please select a course and ensure intake is active');
			}
			return createOrUpdateApplication({
				applicantId,
				intakePeriodId: activeIntake.id,
				firstChoiceProgramId: Number(firstChoice),
				secondChoiceProgramId: secondChoice ? Number(secondChoice) : undefined,
				status: 'draft',
			});
		},
		onSuccess: (application) => {
			refetch();
			notifications.show({
				title: 'Courses selected',
				message: 'Your course choices have been saved',
				color: 'green',
			});
			router.push(`/apply/${application.id}/personal-info`);
		},
		onError: (error) => {
			notifications.show({
				title: 'Error',
				message: error.message,
				color: 'red',
			});
		},
	});

	function handleContinue() {
		if (choiceType === 'first') {
			if (eligiblePrograms.length > 1) {
				setChoiceType('second');
				return;
			}
			submitMutation.mutate();
			return;
		}

		if (!secondChoice) {
			modals.openConfirmModal({
				title: 'No Second Choice Selected',
				children: (
					<Text size='sm'>
						You have not selected a second choice program. Are you sure you want
						to continue without one?
					</Text>
				),
				labels: { confirm: 'Continue Without', cancel: 'Select One' },
				onConfirm: () => submitMutation.mutate(),
			});
			return;
		}
		submitMutation.mutate();
	}

	function handleSecondChoiceToggle(program: EligibleProgram, sel: boolean) {
		const hasMultipleSchools = schools.length > 1;
		if (
			sel &&
			hasMultipleSchools &&
			firstChoiceProgram?.schoolId === program.schoolId
		) {
			modals.openConfirmModal({
				title: 'Same School Warning',
				children: (
					<Text size='sm'>
						We recommend selecting a second choice from a different school to
						increase your admission chances. Your first choice is already from{' '}
						<strong>{firstChoiceProgram.school.name}</strong>. Are you sure you
						want to continue with this selection?
					</Text>
				),
				labels: { confirm: 'Select Anyway', cancel: 'Choose Different' },
				confirmProps: { color: 'yellow' },
				onConfirm: () => setSecondChoice(String(program.id)),
			});
			return;
		}
		setSecondChoice(sel ? String(program.id) : null);
	}

	const isLoading = !applicantId || loadingPrograms || loadingIntake;
	const canContinue = firstChoice && activeIntake?.id;

	return (
		<Paper withBorder radius='md' p='lg'>
			<Stack gap='lg'>
				<Stack gap='xs'>
					<Title order={3}>Choose a Courses</Title>
					<Text c='dimmed' size='sm'>
						Choose your course based on your qualifications
					</Text>
				</Stack>

				{!activeIntake && !loadingIntake && (
					<Paper withBorder radius='md' p='md' bg='yellow.0'>
						<Text c='yellow.8' size='sm'>
							No active intake period found. Please check back later.
						</Text>
					</Paper>
				)}

				{isLoading && (
					<Stack gap='sm'>
						<Skeleton h={40} />
						<SimpleGrid cols={{ base: 1, md: 2 }} spacing='sm'>
							{[1, 2, 3, 4].map((i) => (
								<Skeleton key={i} h={100} />
							))}
						</SimpleGrid>
					</Stack>
				)}

				{eligiblePrograms.length === 0 && !isLoading && (
					<Paper withBorder radius='md' p='lg' ta='center'>
						<Stack gap='sm' align='center'>
							<ThemeIcon size='xl' variant='light' color='gray'>
								<IconSchool size={28} />
							</ThemeIcon>
							<Text c='dimmed'>
								No eligible courses found based on your qualifications
							</Text>
						</Stack>
					</Paper>
				)}

				{eligiblePrograms.length > 0 && !isLoading && (
					<Stack gap='md'>
						{(schools.length > 1 || levels.length > 1) && (
							<Box>
								<CoursesFilters schools={schools} levels={levels} />
								<Divider my={2} />
							</Box>
						)}

						{eligiblePrograms.length > 1 && (
							<SegmentedControl
								color='teal'
								value={choiceType}
								onChange={(val) => setChoiceType(val as 'first' | 'second')}
								data={[
									{ label: 'First Choice', value: 'first' },
									{ label: 'Second Choice', value: 'second' },
								]}
							/>
						)}

						<SimpleGrid cols={{ base: 1, md: 2 }} spacing='sm'>
							{filteredPrograms.map((program) => (
								<CourseCard
									key={program.id}
									program={program}
									selected={
										choiceType === 'first'
											? firstChoice === String(program.id)
											: secondChoice === String(program.id)
									}
									disabled={
										choiceType === 'first'
											? secondChoice === String(program.id)
											: firstChoice === String(program.id)
									}
									onToggle={(sel) => {
										if (choiceType === 'first') {
											setFirstChoice(sel ? String(program.id) : null);
										} else {
											handleSecondChoiceToggle(program, sel);
										}
									}}
								/>
							))}
						</SimpleGrid>
					</Stack>
				)}

				<WizardNavigation
					applicationId={applicationId}
					backPath='qualifications'
					onNext={handleContinue}
					nextDisabled={!canContinue}
					nextLoading={submitMutation.isPending}
				/>
			</Stack>
		</Paper>
	);
}
