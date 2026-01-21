'use client';

import { createOrUpdateApplication } from '@admissions/applications';
import {
	Badge,
	Button,
	Card,
	Group,
	Paper,
	Radio,
	SimpleGrid,
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
import { useEffect, useState } from 'react';
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
	school?: { name: string } | null;
	level?: string | null;
	duration?: number | null;
};

export default function ProgramSelectionForm({ applicantId }: Props) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [firstChoice, setFirstChoice] = useState<string | null>(null);
	const [secondChoice, setSecondChoice] = useState<string | null>(null);
	const [initialized, setInitialized] = useState(false);

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

	const submitMutation = useMutation({
		mutationFn: async () => {
			if (!firstChoice || !activeIntake?.id) {
				throw new Error('Please select a program and ensure intake is active');
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
				title: 'Programs selected',
				message: 'Your program choices have been saved',
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
					<Title order={3}>Select Your Programs</Title>
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

				{activeIntake && (
					<Paper withBorder radius='md' p='sm' bg='blue.0'>
						<Group>
							<ThemeIcon size='lg' variant='light' color='blue'>
								<IconSchool size={20} />
							</ThemeIcon>
							<Stack gap={0}>
								<Text fw={500} size='sm'>
									{activeIntake.name}
								</Text>
								<Text size='xs' c='dimmed'>
									Current intake period
								</Text>
							</Stack>
						</Group>
					</Paper>
				)}

				{eligiblePrograms.length === 0 && !isLoading && (
					<Paper withBorder radius='md' p='lg' ta='center'>
						<Stack gap='sm' align='center'>
							<ThemeIcon size='xl' variant='light' color='gray'>
								<IconSchool size={28} />
							</ThemeIcon>
							<Text c='dimmed'>
								No eligible programs found based on your qualifications
							</Text>
							<Text size='sm' c='dimmed'>
								Please ensure you have uploaded your academic documents
							</Text>
						</Stack>
					</Paper>
				)}

				{eligiblePrograms.length > 0 && (
					<Stack gap='md'>
						<Stack gap='xs'>
							<Text fw={500}>First Choice (Required)</Text>
							<Radio.Group value={firstChoice} onChange={setFirstChoice}>
								<SimpleGrid cols={{ base: 1, md: 2 }} spacing='sm'>
									{eligiblePrograms.map((program) => (
										<ProgramCard
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

						<Stack gap='xs'>
							<Text fw={500}>Second Choice (Optional)</Text>
							<Radio.Group value={secondChoice} onChange={setSecondChoice}>
								<SimpleGrid cols={{ base: 1, md: 2 }} spacing='sm'>
									{eligiblePrograms.map((program) => (
										<ProgramCard
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

type ProgramCardProps = {
	program: EligibleProgram;
	selected: boolean;
	disabled: boolean;
	onSelect: () => void;
};

function ProgramCard({
	program,
	selected,
	disabled,
	onSelect,
}: ProgramCardProps) {
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
				<Stack gap='xs' style={{ flex: 1 }}>
					<Text fw={500} size='sm'>
						{program.name}
					</Text>
					<Group gap='xs'>
						<Badge size='xs' variant='light'>
							{program.code}
						</Badge>
						{program.level && (
							<Badge size='xs' variant='outline'>
								{program.level}
							</Badge>
						)}
						{program.duration && (
							<Badge size='xs' variant='outline' color='gray'>
								{program.duration} years
							</Badge>
						)}
					</Group>
					{program.school?.name && (
						<Text size='xs' c='dimmed'>
							{program.school.name}
						</Text>
					)}
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
