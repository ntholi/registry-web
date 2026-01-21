'use client';

import type { ProgramLevel } from '@academic/_database';
import { createOrUpdateApplication } from '@admissions/applications';
import {
	Badge,
	Box,
	Button,
	Card,
	Group,
	Paper,
	Radio,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
	ThemeIcon,
	Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
	IconArrowLeft,
	IconArrowRight,
	IconCheck,
	IconSchool,
} from '@tabler/icons-react';
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

						<Stack gap='xs'>
							<Text fw={500}>First Choice (Required)</Text>
							<Radio.Group value={firstChoice} onChange={setFirstChoice}>
								<SimpleGrid cols={{ base: 1, md: 2 }} spacing='sm'>
									{filteredPrograms.map((program) => (
										<CourseCard
											key={program.id}
											program={program}
											selected={firstChoice === String(program.id)}
											disabled={secondChoice === String(program.id)}
											onSelect={() => setFirstChoice(String(program.id))}
										/>
									))}
								</SimpleGrid>
							</Radio.Group>
						</Stack>

						{filteredPrograms.length > 1 && (
							<Stack gap='xs'>
								<Text fw={500}>Second Choice (Optional)</Text>
								<Radio.Group value={secondChoice} onChange={setSecondChoice}>
									<SimpleGrid cols={{ base: 1, md: 2 }} spacing='sm'>
										{filteredPrograms.map((program) => (
											<CourseCard
												key={program.id}
												program={program}
												selected={secondChoice === String(program.id)}
												disabled={firstChoice === String(program.id)}
												onSelect={() => setSecondChoice(String(program.id))}
											/>
										))}
									</SimpleGrid>
								</Radio.Group>
								{secondChoice && (
									<Button
										variant='subtle'
										size='xs'
										onClick={() => setSecondChoice(null)}
									>
										Clear second choice
									</Button>
								)}
							</Stack>
						)}
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

type CourseCardProps = {
	program: EligibleProgram;
	selected: boolean;
	disabled: boolean;
	onSelect: () => void;
};

function CourseCard({
	program,
	selected,
	disabled,
	onSelect,
}: CourseCardProps) {
	return (
		<Card
			withBorder
			radius='md'
			p='sm'
			style={{
				cursor: disabled ? 'not-allowed' : 'pointer',
				opacity: disabled ? 0.5 : 1,
				borderColor: selected
					? 'var(--mantine-color-blue-6)'
					: 'var(--mantine-color-default-border)',
				borderWidth: selected ? 2 : 1,
			}}
			onClick={disabled ? undefined : onSelect}
		>
			<Group wrap='nowrap' align='flex-start'>
				<Radio value={String(program.id)} disabled={disabled} />
				<Stack gap={4} style={{ flex: 1 }}>
					<Text fw={500} size='sm' lh={1.3}>
						{program.name}
					</Text>
					<Group gap='xs'>
						{program.school.shortName && (
							<Badge size='xs' variant='light' color='blue'>
								{program.school.shortName}
							</Badge>
						)}
						<Badge size='xs' variant='outline' tt='capitalize'>
							{program.level}
						</Badge>
					</Group>
				</Stack>
				{selected && (
					<ThemeIcon size='sm' variant='light' color='blue'>
						<IconCheck size={14} />
					</ThemeIcon>
				)}
			</Group>
		</Card>
	);
}
