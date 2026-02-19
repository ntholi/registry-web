'use client';

import {
	Accordion,
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
	SegmentedControl,
	Stack,
	Text,
	TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconFilter, IconPlus, IconSearch } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
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

type SchoolGroup = {
	schoolId: number;
	schoolName: string;
	classes: ClassItem[];
};

function getYear(semesterNumber: string) {
	const num = Number.parseInt(semesterNumber, 10);
	if (Number.isNaN(num)) return 0;
	return Math.ceil(num / 2);
}

function getUniqueYears(groups: SchoolGroup[]) {
	const years = new Set<number>();
	for (const g of groups) {
		for (const c of g.classes) {
			const y = getYear(c.semesterNumber);
			if (y > 0) years.add(y);
		}
	}
	return Array.from(years).sort((a, b) => a - b);
}

function getUniquePrograms(groups: SchoolGroup[]) {
	const map = new Map<string, string>();
	for (const g of groups) {
		for (const c of g.classes) {
			if (!map.has(c.programCode)) {
				map.set(c.programCode, c.programName);
			}
		}
	}
	return Array.from(map.entries())
		.map(([code, name]) => ({ code, name }))
		.sort((a, b) => a.code.localeCompare(b.code));
}

export default function PassphraseManager({
	cycleId,
	termId,
	cycleName,
}: Props) {
	const queryClient = useQueryClient();
	const [search, setSearch] = useState('');
	const [yearFilter, setYearFilter] = useState<string[]>([]);
	const [programFilter, setProgramFilter] = useState<string[]>([]);
	const [groupBy, setGroupBy] = useState<'school' | 'year' | 'program'>(
		'school'
	);
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

	const years = useMemo(() => getUniqueYears(schoolGroups), [schoolGroups]);
	const programs = useMemo(
		() => getUniquePrograms(schoolGroups),
		[schoolGroups]
	);

	const allClasses = useMemo(() => {
		const list: (ClassItem & { schoolId: number; schoolName: string })[] = [];
		for (const g of schoolGroups) {
			for (const c of g.classes) {
				list.push({ ...c, schoolId: g.schoolId, schoolName: g.schoolName });
			}
		}
		return list;
	}, [schoolGroups]);

	const filtered = useMemo(() => {
		const q = search.toLowerCase().trim();
		return allClasses.filter((cls) => {
			if (yearFilter.length > 0) {
				const y = getYear(cls.semesterNumber);
				if (!yearFilter.includes(String(y))) return false;
			}
			if (programFilter.length > 0) {
				if (!programFilter.includes(cls.programCode)) return false;
			}
			if (q) {
				const className = getStudentClassName({
					semesterNumber: cls.semesterNumber,
					structure: { program: { code: cls.programCode } },
				});
				const searchable =
					`${cls.programCode} ${cls.programName} ${className}`.toLowerCase();
				if (!searchable.includes(q)) return false;
			}
			return true;
		});
	}, [allClasses, yearFilter, programFilter, search]);

	const grouped = useMemo(() => {
		const map = new Map<string, { label: string; classes: typeof filtered }>();
		for (const cls of filtered) {
			let key: string;
			let label: string;
			if (groupBy === 'year') {
				const y = getYear(cls.semesterNumber);
				key = `y-${y}`;
				label = `Year ${y}`;
			} else if (groupBy === 'program') {
				key = `p-${cls.programCode}`;
				label = `${cls.programCode} — ${cls.programName}`;
			} else {
				key = `s-${cls.schoolId}`;
				label = cls.schoolName;
			}
			if (!map.has(key)) {
				map.set(key, { label, classes: [] });
			}
			map.get(key)!.classes.push(cls);
		}
		return Array.from(map.entries()).map(([key, val]) => ({
			key,
			...val,
		}));
	}, [filtered, groupBy]);

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

	const activeFilterCount = yearFilter.length + programFilter.length;

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

			<Group justify='space-between' align='flex-end'>
				<TextInput
					placeholder='Search classes...'
					leftSection={<IconSearch size={16} />}
					value={search}
					onChange={(e) => setSearch(e.currentTarget.value)}
					style={{ flex: 1, maxWidth: 300 }}
				/>
				<Group gap='xs' align='center'>
					<IconFilter size={16} opacity={0.5} />
					<SegmentedControl
						size='xs'
						value={groupBy}
						onChange={(v) => setGroupBy(v as 'school' | 'year' | 'program')}
						data={[
							{ label: 'School', value: 'school' },
							{ label: 'Year', value: 'year' },
							{ label: 'Program', value: 'program' },
						]}
					/>
				</Group>
			</Group>

			<Stack gap={6}>
				<ScrollArea type='auto' offsetScrollbars scrollbarSize={4}>
					<Group gap={6} wrap='nowrap'>
						{years.map((y) => (
							<Chip
								key={y}
								size='xs'
								checked={yearFilter.includes(String(y))}
								onChange={() =>
									setYearFilter((prev) =>
										prev.includes(String(y))
											? prev.filter((v) => v !== String(y))
											: [...prev, String(y)]
									)
								}
							>
								Year {y}
							</Chip>
						))}
					</Group>
				</ScrollArea>
				{programs.length > 5 ? (
					<ScrollArea type='auto' offsetScrollbars scrollbarSize={4}>
						<Group gap={6} wrap='nowrap'>
							{programs.map((p) => (
								<Chip
									key={p.code}
									size='xs'
									checked={programFilter.includes(p.code)}
									onChange={() =>
										setProgramFilter((prev) =>
											prev.includes(p.code)
												? prev.filter((v) => v !== p.code)
												: [...prev, p.code]
										)
									}
								>
									{p.code}
								</Chip>
							))}
						</Group>
					</ScrollArea>
				) : (
					<Group gap={6}>
						{programs.map((p) => (
							<Chip
								key={p.code}
								size='xs'
								checked={programFilter.includes(p.code)}
								onChange={() =>
									setProgramFilter((prev) =>
										prev.includes(p.code)
											? prev.filter((v) => v !== p.code)
											: [...prev, p.code]
									)
								}
							>
								{p.code}
							</Chip>
						))}
					</Group>
				)}
				{activeFilterCount > 0 && (
					<Button
						size='compact-xs'
						variant='subtle'
						onClick={() => {
							setYearFilter([]);
							setProgramFilter([]);
							setSearch('');
						}}
						w='fit-content'
					>
						Clear filters ({activeFilterCount})
					</Button>
				)}
			</Stack>

			<Text size='xs' c='dimmed'>
				{filtered.length} class{filtered.length !== 1 ? 'es' : ''} shown
			</Text>

			{grouped.length === 0 ? (
				<Text c='dimmed' ta='center' py='lg'>
					No classes match the current filters.
				</Text>
			) : (
				<Accordion
					variant='separated'
					multiple
					defaultValue={grouped.map((g) => g.key)}
				>
					{grouped.map((group) => (
						<Accordion.Item key={group.key} value={group.key}>
							<Accordion.Control>
								<Group gap='xs'>
									<Text fw={600} size='sm'>
										{group.label}
									</Text>
									<Badge size='xs' variant='light' color='gray'>
										{group.classes.length}
									</Badge>
								</Group>
							</Accordion.Control>
							<Accordion.Panel>
								<Stack gap='xs'>
									{group.classes.map((cls) => {
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
																{total} generated · {used} used · {remaining}{' '}
																remaining
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
							</Accordion.Panel>
						</Accordion.Item>
					))}
				</Accordion>
			)}
		</Stack>
	);
}
