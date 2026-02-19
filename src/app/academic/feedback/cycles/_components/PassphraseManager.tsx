'use client';

import {
	ActionIcon,
	Badge,
	Box,
	Button,
	Chip,
	Group,
	Loader,
	Modal,
	NumberInput,
	Paper,
	ScrollArea,
	Stack,
	Text,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
	IconChevronLeft,
	IconChevronRight,
	IconPlus,
} from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useRef, useState } from 'react';
import { getStudentClassName } from '@/shared/lib/utils/utils';
import {
	generatePassphrases,
	getClassesForCycle,
	getPassphraseStats,
} from '../_server/actions';
import PassphraseDownloadButton from './PassphraseDownloadButton';

type Props = {
	cycleId: string;
	termId: number;
	cycleName: string;
};

type ClassItem = {
	structureSemesterId: number;
	semesterNumber: string;
	programCode: string;
	programName: string;
	studentCount: number;
};

function getYear(semesterNumber: string) {
	const num = Number.parseInt(semesterNumber, 10);
	if (Number.isNaN(num)) return 0;
	return Math.ceil(num / 2);
}

export default function PassphraseManager({
	cycleId,
	termId,
	cycleName,
}: Props) {
	const queryClient = useQueryClient();
	const [yearFilter, setYearFilter] = useState('');
	const [programFilter, setProgramFilter] = useState('');
	const [chipsHovered, setChipsHovered] = useState(false);
	const [canScrollLeft, setCanScrollLeft] = useState(false);
	const [canScrollRight, setCanScrollRight] = useState(false);
	const chipViewport = useRef<HTMLDivElement>(null);

	function checkScrollEdges() {
		const el = chipViewport.current;
		if (!el) return;
		setCanScrollLeft(el.scrollLeft > 0);
		setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
	}
	const [generateTarget, setGenerateTarget] = useState<{
		structureSemesterId: number;
		className: string;
		studentCount: number;
		passphraseCount: number;
	} | null>(null);

	const { data: schoolGroups = [], isLoading: classesLoading } = useQuery({
		queryKey: ['feedback-classes', cycleId, termId],
		queryFn: () => getClassesForCycle(cycleId, termId),
	});

	const { data: statsMap, isLoading: statsLoading } = useQuery({
		queryKey: ['feedback-passphrase-stats', cycleId],
		queryFn: () => getPassphraseStats(cycleId),
	});

	const years = useMemo(() => {
		const set = new Set<number>();
		for (const g of schoolGroups) {
			for (const c of g.classes) {
				const y = getYear(c.semesterNumber);
				if (y > 0) set.add(y);
			}
		}
		return Array.from(set).sort((a, b) => a - b);
	}, [schoolGroups]);

	const programs = useMemo(() => {
		const map = new Map<string, string>();
		for (const g of schoolGroups) {
			for (const c of g.classes) {
				if (!map.has(c.programCode)) map.set(c.programCode, c.programName);
			}
		}
		return Array.from(map.entries())
			.map(([code, name]) => ({ code, name }))
			.sort((a, b) => a.code.localeCompare(b.code));
	}, [schoolGroups]);

	const filtered = useMemo(() => {
		const flat: ClassItem[] = schoolGroups.flatMap((g) => g.classes);
		return flat.filter((cls) => {
			if (yearFilter && getYear(cls.semesterNumber) !== Number(yearFilter))
				return false;
			if (programFilter && cls.programCode !== programFilter) return false;
			return true;
		});
	}, [schoolGroups, yearFilter, programFilter]);

	const mutation = useMutation({
		mutationFn: ({
			structureSemesterId,
			passphraseCount,
		}: {
			structureSemesterId: number;
			passphraseCount: number;
		}) => generatePassphrases(cycleId, structureSemesterId, passphraseCount),
		onSuccess: (count) => {
			notifications.show({
				title: 'Passphrases Generated',
				message: `${count} passphrases created`,
				color: 'green',
			});
			setGenerateTarget(null);
			queryClient.invalidateQueries({
				queryKey: ['feedback-passphrase-stats', cycleId],
			});
			queryClient.invalidateQueries({
				queryKey: ['feedback-passphrase-slips', cycleId],
			});
		},
		onError: (err: Error) => {
			notifications.show({
				title: 'Error',
				message: err.message,
				color: 'red',
			});
		},
	});

	if (classesLoading || statsLoading) {
		return (
			<Group justify='center' py='xl'>
				<Loader size='sm' />
				<Text size='sm' c='dimmed'>
					Loading classes...
				</Text>
			</Group>
		);
	}

	if (schoolGroups.length === 0) {
		return (
			<Text c='dimmed' ta='center' py='lg'>
				No classes found for this term.
			</Text>
		);
	}

	function getDefaultPassphraseCount(studentCount: number) {
		return studentCount + Math.ceil(studentCount * 0.1);
	}

	return (
		<Stack gap='md'>
			<Modal
				opened={Boolean(generateTarget)}
				onClose={() => setGenerateTarget(null)}
				title='Generate Passphrases'
				centered
			>
				{generateTarget && (
					<Stack>
						<Text size='sm'>
							Class:{' '}
							<Text span fw={600}>
								{generateTarget.className}
							</Text>
						</Text>
						<Text size='sm'>
							Students:{' '}
							<Text span fw={600}>
								{generateTarget.studentCount}
							</Text>
						</Text>
						<NumberInput
							label='Passphrases to generate'
							min={1}
							value={generateTarget.passphraseCount}
							onChange={(value) => {
								const next =
									typeof value === 'number' && Number.isFinite(value)
										? Math.max(1, Math.floor(value))
										: 1;
								setGenerateTarget({
									...generateTarget,
									passphraseCount: next,
								});
							}}
						/>
						<Group justify='flex-end'>
							<Button variant='light' onClick={() => setGenerateTarget(null)}>
								Cancel
							</Button>
							<Button
								loading={mutation.isPending}
								onClick={() =>
									mutation.mutate({
										structureSemesterId: generateTarget.structureSemesterId,
										passphraseCount: generateTarget.passphraseCount,
									})
								}
							>
								Generate
							</Button>
						</Group>
					</Stack>
				)}
			</Modal>

			<Box
				pos='relative'
				onMouseEnter={() => {
					setChipsHovered(true);
					checkScrollEdges();
				}}
				onMouseLeave={() => setChipsHovered(false)}
			>
				{chipsHovered && canScrollLeft && (
					<ActionIcon
						pos='absolute'
						left={0}
						size='lg'
						radius='xl'
						variant='default'
						style={{
							top: '50%',
							transform: 'translateY(-50%)',
							zIndex: 2,
							opacity: 0.85,
						}}
						onClick={() =>
							chipViewport.current?.scrollBy({ left: -120, behavior: 'smooth' })
						}
					>
						<IconChevronLeft size={12} />
					</ActionIcon>
				)}
				<ScrollArea
					type='never'
					py={4}
					viewportRef={chipViewport}
					onScrollPositionChange={checkScrollEdges}
				>
					<Group gap={6} wrap='nowrap'>
						<Chip
							size='xs'
							variant='filled'
							checked={!yearFilter && !programFilter}
							onChange={() => {
								setYearFilter('');
								setProgramFilter('');
							}}
						>
							All
						</Chip>
						<Text size='xs' c='dimmed' px={2} style={{ userSelect: 'none' }}>
							·
						</Text>
						{years.map((y) => (
							<Chip
								key={y}
								size='xs'
								checked={yearFilter === String(y)}
								onChange={() =>
									setYearFilter((prev) => (prev === String(y) ? '' : String(y)))
								}
							>
								Year {y}
							</Chip>
						))}
						<Text size='xs' c='dimmed' px={2} style={{ userSelect: 'none' }}>
							·
						</Text>
						{programs.map((p) => (
							<Chip
								key={p.code}
								size='xs'
								checked={programFilter === p.code}
								onChange={() =>
									setProgramFilter((prev) => (prev === p.code ? '' : p.code))
								}
							>
								{p.code}
							</Chip>
						))}
					</Group>
				</ScrollArea>
				{chipsHovered && canScrollRight && (
					<ActionIcon
						pos='absolute'
						right={0}
						size='lg'
						radius='xl'
						variant='default'
						style={{
							top: '50%',
							transform: 'translateY(-50%)',
							zIndex: 2,
							opacity: 0.85,
						}}
						onClick={() =>
							chipViewport.current?.scrollBy({ left: 120, behavior: 'smooth' })
						}
					>
						<IconChevronRight size={12} />
					</ActionIcon>
				)}
			</Box>

			<Text size='xs' c='dimmed'>
				{filtered.length} class{filtered.length !== 1 ? 'es' : ''} shown
			</Text>

			{filtered.length === 0 ? (
				<Text c='dimmed' ta='center' py='lg'>
					No classes match the current filters.
				</Text>
			) : (
				<Stack gap='xs'>
					{filtered.map((cls) => {
						const stats = statsMap?.[cls.structureSemesterId];
						const total = stats?.total ?? 0;
						const used = stats?.used ?? 0;
						const remaining = stats?.remaining ?? 0;
						const className = getStudentClassName({
							semesterNumber: cls.semesterNumber,
							structure: { program: { code: cls.programCode } },
						});

						return (
							<Paper
								key={cls.structureSemesterId}
								withBorder
								p='sm'
								radius='sm'
							>
								<Group justify='space-between' wrap='nowrap'>
									<Box>
										<Group gap='xs'>
											<Text fw={600} size='sm'>
												{className}
											</Text>
											<Badge size='sm' variant='light'>
												{cls.studentCount} students
											</Badge>
										</Group>
										{total > 0 && (
											<Text size='xs' c='dimmed' mt={2}>
												{total} generated · {used} used · {remaining} remaining
											</Text>
										)}
									</Box>
									<Group gap='xs' wrap='nowrap'>
										<Button
											size='xs'
											variant='light'
											leftSection={<IconPlus size={14} />}
											onClick={() =>
												setGenerateTarget({
													structureSemesterId: cls.structureSemesterId,
													className,
													studentCount: cls.studentCount,
													passphraseCount: getDefaultPassphraseCount(
														cls.studentCount
													),
												})
											}
										>
											{total > 0 ? 'Regenerate' : 'Generate'}
										</Button>
										{total > 0 && (
											<PassphraseDownloadButton
												cycleId={cycleId}
												structureSemesterId={cls.structureSemesterId}
												cycleName={cycleName}
												className={className}
											/>
										)}
									</Group>
								</Group>
							</Paper>
						);
					})}
				</Stack>
			)}
		</Stack>
	);
}
