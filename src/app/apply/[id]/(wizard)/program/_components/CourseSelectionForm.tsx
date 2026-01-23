'use client';

import type { ProgramLevel } from '@academic/_database';
import { createOrUpdateApplication } from '@admissions/applications';
import {
	Box,
	Button,
	Group,
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
import { IconArrowLeft, IconArrowRight, IconSchool } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { useEffect, useMemo, useState } from 'react';
import CoursesFilters from '@/app/apply/courses/_components/CoursesFilters';
import {
	getActiveIntake,
	getEligiblePrograms,
	getExistingApplication,
} from '../_server/actions';
import CourseCard from './CourseCard';

type Props = {
	applicantId: string;
};

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

export default function CourseSelectionForm({ applicantId }: Props) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [firstChoice, setFirstChoice] = useState<string | null>(null);
	const [secondChoice, setSecondChoice] = useState<string | null>(null);
	const [choiceType, setChoiceType] = useState<'first' | 'second'>('first');
	const [initialized, setInitialized] = useState(false);

	const [filters] = useQueryStates({
		schoolId: parseAsInteger,
		level: parseAsString,
	});

	const { data: eligiblePrograms = [], isLoading: loadingPrograms } = useQuery({
		queryKey: ['eligible-programs', applicantId],
		queryFn: () => getEligiblePrograms(applicantId),
	});

	const { data: activeIntake, isLoading: loadingIntake } = useQuery({
		queryKey: ['active-intake'],
		queryFn: getActiveIntake,
	});

	const { data: existingApp } = useQuery({
		queryKey: ['existing-application', applicantId],
		queryFn: () => getExistingApplication(applicantId),
	});

	useEffect(() => {
		if (!initialized && existingApp) {
			if (existingApp.firstChoiceProgramId) {
				setFirstChoice(String(existingApp.firstChoiceProgramId));
			}
			if (existingApp.secondChoiceProgramId) {
				setSecondChoice(String(existingApp.secondChoiceProgramId));
			}
			setInitialized(true);
		}
	}, [existingApp, initialized]);

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
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['applications'] });
			queryClient.invalidateQueries({
				queryKey: ['existing-application', applicantId],
			});
			notifications.show({
				title: 'Courses selected',
				message: 'Your course choices have been saved',
				color: 'green',
			});
			router.push(`/apply/${applicantId}/personal-info`);
		},
		onError: (error) => {
			notifications.show({
				title: 'Error',
				message: error.message,
				color: 'red',
			});
		},
	});

	function handleBack() {
		router.push(`/apply/${applicantId}/qualifications`);
	}

	function handleContinue() {
		if (eligiblePrograms.length > 1 && !secondChoice) {
			modals.openConfirmModal({
				title: 'No Second Choice Selected',
				children: (
					<Text size='sm'>
						You have not selected a second choice program. Would you like to
						select one now?
					</Text>
				),
				labels: { confirm: 'Choose Second Choice', cancel: 'Continue Anyway' },
				onConfirm: () => setChoiceType('second'),
				onCancel: () => submitMutation.mutate(),
			});
			return;
		}
		submitMutation.mutate();
	}

	const isLoading = loadingPrograms || loadingIntake;
	const canContinue = firstChoice && activeIntake?.id;

	return (
		<Paper withBorder radius='md' p='lg'>
			<Stack gap='lg'>
				<Stack gap='xs'>
					<Title order={3}>Select Your Courses</Title>
					<Text c='dimmed' size='sm'>
						Choose your first and optional second choice based on your
						qualifications
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
							<Text size='sm' c='dimmed'>
								Please ensure you have uploaded your academic documents
							</Text>
						</Stack>
					</Paper>
				)}

				{eligiblePrograms.length > 0 && !isLoading && (
					<Stack gap='md'>
						{(schools.length > 1 || levels.length > 1) && (
							<Box>
								<CoursesFilters schools={schools} levels={levels} />
							</Box>
						)}

						{eligiblePrograms.length > 1 && (
							<SegmentedControl
								fullWidth
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
											setSecondChoice(sel ? String(program.id) : null);
										}
									}}
								/>
							))}
						</SimpleGrid>
					</Stack>
				)}

				<Group justify='space-between' mt='md'>
					<Button
						variant='subtle'
						leftSection={<IconArrowLeft size={16} />}
						onClick={handleBack}
					>
						Back
					</Button>
					<Button
						rightSection={<IconArrowRight size={16} />}
						onClick={handleContinue}
						disabled={!canContinue}
						loading={submitMutation.isPending}
					>
						Continue
					</Button>
				</Group>
			</Stack>
		</Paper>
	);
}
