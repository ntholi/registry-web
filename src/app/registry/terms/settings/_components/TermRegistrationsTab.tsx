'use client';

import {
	getAllSchools,
	getProgramsBySchoolId,
} from '@academic/schools/_server/actions';
import {
	ActionIcon,
	Badge,
	Box,
	Button,
	Checkbox,
	Collapse,
	Divider,
	Group,
	Modal,
	MultiSelect,
	Paper,
	Select,
	Stack,
	Text,
	ThemeIcon,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import {
	IconBuilding,
	IconCheck,
	IconChevronDown,
	IconChevronRight,
	IconPlus,
	IconTrash,
} from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { formatDate } from '@/shared/lib/utils/dates';
import {
	deleteTermRegistration,
	getTermRegistrations,
	type RegistrationEntry,
	saveTermRegistrations,
} from '../_server/termRegistrationsActions';

interface Props {
	termId: number;
}

interface SchoolOption {
	value: string;
	label: string;
}

interface ProgramOption {
	id: number;
	code: string;
	name: string;
}

interface RegistrationData {
	id?: number;
	schoolId: number;
	schoolName: string;
	startDate: string;
	endDate: string;
	programIds: number[];
	programs?: { program: ProgramOption }[];
}

export default function TermRegistrationsTab({ termId }: Props) {
	const queryClient = useQueryClient();
	const [opened, { open, close }] = useDisclosure(false);
	const [editing, setEditing] = useState<RegistrationData | null>(null);

	const { data: registrations = [] } = useQuery({
		queryKey: ['term-registrations', termId],
		queryFn: () => getTermRegistrations(termId),
	});

	const { data: schools = [] } = useQuery({
		queryKey: ['schools'],
		queryFn: getAllSchools,
	});

	const usedSchoolIds = new Set(registrations.map((r) => r.schoolId));
	const availableSchools: SchoolOption[] = schools
		.filter((s) => !usedSchoolIds.has(s.id) || editing?.schoolId === s.id)
		.map((s) => ({ value: String(s.id), label: s.name }));

	const deleteMutation = useMutation({
		mutationFn: (id: number) => deleteTermRegistration(id),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['term-registrations', termId],
			});
			notifications.show({
				title: 'Deleted',
				message: 'School registration removed',
				color: 'green',
			});
		},
		onError: (error: Error) => {
			notifications.show({
				title: 'Error',
				message: error.message,
				color: 'red',
			});
		},
	});

	const confirmDelete = (id: number, schoolName: string) => {
		modals.openConfirmModal({
			title: 'Remove School Registration',
			children: (
				<Text size='sm'>
					Remove registration access for <strong>{schoolName}</strong>? Students
					from this school will no longer be able to register.
				</Text>
			),
			labels: { confirm: 'Remove', cancel: 'Cancel' },
			confirmProps: { color: 'red' },
			onConfirm: () => deleteMutation.mutate(id),
		});
	};

	const openAddModal = () => {
		setEditing(null);
		open();
	};

	const openEditModal = (reg: (typeof registrations)[0]) => {
		setEditing({
			id: reg.id,
			schoolId: reg.schoolId,
			schoolName: reg.school?.name || '',
			startDate: reg.startDate,
			endDate: reg.endDate,
			programIds: reg.programs?.map((p) => p.programId) || [],
			programs: reg.programs,
		});
		open();
	};

	const today = new Date().toISOString().split('T')[0];

	return (
		<Stack gap='md'>
			<Group justify='space-between'>
				<Text size='sm' c='dimmed'>
					Configure which schools can register and when
				</Text>
				<Button
					leftSection={<IconPlus size={16} />}
					onClick={openAddModal}
					disabled={availableSchools.length === 0}
				>
					Add School
				</Button>
			</Group>

			{registrations.length === 0 ? (
				<Paper withBorder p='xl' ta='center'>
					<Text c='dimmed'>
						No schools configured. Students cannot register.
					</Text>
				</Paper>
			) : (
				<Stack gap='sm'>
					{registrations.map((reg) => {
						const isOpen = today >= reg.startDate && today <= reg.endDate;
						return (
							<SchoolRegistrationCard
								key={reg.id}
								registration={reg}
								isOpen={isOpen}
								onEdit={() => openEditModal(reg)}
								onDelete={() =>
									confirmDelete(reg.id, reg.school?.name || 'Unknown')
								}
							/>
						);
					})}
				</Stack>
			)}

			<RegistrationModal
				termId={termId}
				opened={opened}
				onClose={close}
				schools={availableSchools}
				editing={editing}
			/>
		</Stack>
	);
}

interface CardProps {
	registration: {
		id: number;
		schoolId: number;
		startDate: string;
		endDate: string;
		school?: { id: number; name: string; code: string } | null;
		programs?: { programId: number; program: ProgramOption }[];
	};
	isOpen: boolean;
	onEdit: () => void;
	onDelete: () => void;
}

function SchoolRegistrationCard({
	registration,
	isOpen,
	onEdit,
	onDelete,
}: CardProps) {
	const [expanded, setExpanded] = useState(false);
	const hasPrograms = (registration.programs?.length ?? 0) > 0;

	return (
		<Paper withBorder p='md'>
			<Group justify='space-between' align='flex-start'>
				<Group gap='sm' align='flex-start'>
					<ThemeIcon variant='light' size='lg'>
						<IconBuilding size={18} />
					</ThemeIcon>
					<Stack gap={2}>
						<Group gap='xs'>
							<Text fw={500}>{registration.school?.name}</Text>
							<Badge size='sm' color={isOpen ? 'green' : 'gray'}>
								{isOpen ? 'Open' : 'Closed'}
							</Badge>
						</Group>
						<Text size='sm' c='dimmed'>
							{formatDate(registration.startDate, 'numeric')} –{' '}
							{formatDate(registration.endDate, 'numeric')}
						</Text>
						{hasPrograms && (
							<Button
								variant='subtle'
								size='compact-xs'
								rightSection={
									expanded ? (
										<IconChevronDown size={14} />
									) : (
										<IconChevronRight size={14} />
									)
								}
								onClick={() => setExpanded(!expanded)}
								p={0}
							>
								{registration.programs?.length} program
								{registration.programs?.length !== 1 ? 's' : ''} selected
							</Button>
						)}
						{!hasPrograms && (
							<Text size='xs' c='dimmed'>
								All programs in this school
							</Text>
						)}
					</Stack>
				</Group>
				<Group gap='xs'>
					<Button variant='light' size='xs' onClick={onEdit}>
						Edit
					</Button>
					<ActionIcon variant='light' color='red' onClick={onDelete}>
						<IconTrash size={16} />
					</ActionIcon>
				</Group>
			</Group>
			<Collapse in={expanded}>
				<Divider my='sm' />
				<Stack gap='xs'>
					{registration.programs?.map((p) => (
						<Group key={p.programId} gap='xs'>
							<IconCheck size={14} color='var(--mantine-color-green-6)' />
							<Text size='sm'>
								{p.program.code} - {p.program.name}
							</Text>
						</Group>
					))}
				</Stack>
			</Collapse>
		</Paper>
	);
}

interface ModalProps {
	termId: number;
	opened: boolean;
	onClose: () => void;
	schools: SchoolOption[];
	editing: RegistrationData | null;
}

function RegistrationModal({
	termId,
	opened,
	onClose,
	schools,
	editing,
}: ModalProps) {
	const queryClient = useQueryClient();
	const [schoolId, setSchoolId] = useState<string | null>(null);
	const [startDate, setStartDate] = useState<string | null>(null);
	const [endDate, setEndDate] = useState<string | null>(null);
	const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
	const [filterByPrograms, setFilterByPrograms] = useState(false);

	useEffect(() => {
		if (opened) {
			if (editing) {
				setSchoolId(String(editing.schoolId));
				setStartDate(editing.startDate);
				setEndDate(editing.endDate);
				setSelectedPrograms(editing.programIds.map(String));
				setFilterByPrograms(editing.programIds.length > 0);
			} else {
				setSchoolId(null);
				setStartDate(null);
				setEndDate(null);
				setSelectedPrograms([]);
				setFilterByPrograms(false);
			}
		}
	}, [opened, editing]);

	const { data: programs = [], isLoading: programsLoading } = useQuery({
		queryKey: ['school-programs', schoolId],
		queryFn: () =>
			getProgramsBySchoolId(schoolId ? Number(schoolId) : undefined),
		enabled: !!schoolId,
	});

	const programOptions = programs.map((p) => ({
		value: String(p.id),
		label: `${p.code} - ${p.name}`,
	}));

	const saveMutation = useMutation({
		mutationFn: (entries: RegistrationEntry[]) =>
			saveTermRegistrations(termId, entries),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['term-registrations', termId],
			});
			notifications.show({
				title: 'Saved',
				message: 'Registration settings updated',
				color: 'green',
			});
			handleClose();
		},
		onError: (error: Error) => {
			notifications.show({
				title: 'Error',
				message: error.message,
				color: 'red',
			});
		},
	});

	const handleClose = () => {
		setSchoolId(null);
		setStartDate(null);
		setEndDate(null);
		setSelectedPrograms([]);
		setFilterByPrograms(false);
		onClose();
	};

	const handleSave = () => {
		if (!schoolId || !startDate || !endDate) return;

		const entry: RegistrationEntry = {
			schoolId: Number(schoolId),
			startDate,
			endDate,
			programIds: filterByPrograms ? selectedPrograms.map(Number) : undefined,
		};

		saveMutation.mutate([entry]);
	};

	const canSave = schoolId && startDate && endDate && !saveMutation.isPending;

	return (
		<Modal
			opened={opened}
			onClose={handleClose}
			title={editing ? 'Edit School Registration' : 'Add School Registration'}
			centered
			size='md'
		>
			<Stack gap='md'>
				<Select
					label='School'
					placeholder='Select school'
					data={schools}
					value={schoolId}
					onChange={setSchoolId}
					disabled={!!editing}
					searchable
				/>

				<Group grow>
					<DateInput
						label='Start Date'
						placeholder='Select date'
						value={startDate}
						onChange={setStartDate}
						clearable
						firstDayOfWeek={0}
					/>
					<DateInput
						label='End Date'
						placeholder='Select date'
						value={endDate}
						onChange={setEndDate}
						clearable
						firstDayOfWeek={0}
					/>
				</Group>

				<Divider />

				<Checkbox
					label='Restrict to specific programs'
					description='If unchecked, all programs in this school can register'
					checked={filterByPrograms}
					onChange={(e) => setFilterByPrograms(e.currentTarget.checked)}
				/>

				<Collapse in={filterByPrograms}>
					<Box>
						<MultiSelect
							label='Programs'
							placeholder={programsLoading ? 'Loading...' : 'Select programs'}
							data={programOptions}
							value={selectedPrograms}
							onChange={setSelectedPrograms}
							disabled={!schoolId || programsLoading}
							searchable
							clearable
						/>
					</Box>
				</Collapse>

				<Group justify='flex-end' mt='md'>
					<Button variant='default' onClick={handleClose}>
						Cancel
					</Button>
					<Button
						onClick={handleSave}
						loading={saveMutation.isPending}
						disabled={!canSave}
					>
						Save
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
}
