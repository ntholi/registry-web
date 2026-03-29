'use client';

import {
	Alert,
	Badge,
	Button,
	Group,
	Loader,
	Paper,
	Stack,
	Text,
	TextInput,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconAlertTriangle, IconCheck, IconSearch } from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { unwrap } from '@/shared/lib/actions/actionResult';
import { formatSemester } from '@/shared/lib/utils/utils';
import {
	canReassignStudentModule,
	reassignStudentModule,
	searchSemesterModulesForReassign,
} from '../../_server/actions';

type SemesterModuleResult = {
	id: number;
	code: string;
	name: string;
	credits: number;
	programName: string;
	semesterName: string;
	semesterNumber: string;
};

type Props = {
	studentModuleId: number;
	stdNo: number;
	onSuccess: () => void;
};

export default function AdvancedTab({
	studentModuleId,
	stdNo,
	onSuccess,
}: Props) {
	const queryClient = useQueryClient();
	const [search, setSearch] = useState('');
	const [debouncedSearch] = useDebouncedValue(search, 300);
	const [selected, setSelected] = useState<SemesterModuleResult | null>(null);
	const [confirmCode, setConfirmCode] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);

	const { data: canReassign = false, isLoading: isLoadingPermission } =
		useQuery({
			queryKey: ['can-reassign-module'],
			queryFn: canReassignStudentModule,
			staleTime: 1000 * 60 * 15,
		});

	const { data: results = [], isLoading: isSearching } = useQuery({
		queryKey: ['semester-modules-reassign', debouncedSearch],
		queryFn: () => searchSemesterModulesForReassign(debouncedSearch),
		enabled: debouncedSearch.length >= 2 && canReassign,
	});

	if (isLoadingPermission) {
		return (
			<Stack align='center' py='xl'>
				<Loader size='sm' />
			</Stack>
		);
	}

	if (!canReassign) {
		return (
			<Alert color='red' icon={<IconAlertTriangle size={16} />}>
				You do not have permission to reassign modules. This action is
				restricted to administrators and the Registry Manager.
			</Alert>
		);
	}

	const isConfirmed = selected && confirmCode === selected.code;

	async function handleReassign() {
		if (!selected || !isConfirmed) return;
		setIsSubmitting(true);
		try {
			unwrap(await reassignStudentModule(studentModuleId, selected.id, stdNo));
			notifications.show({
				title: 'Success',
				message: `Module reassigned to ${selected.code} - ${selected.name}`,
				color: 'green',
			});
			queryClient.invalidateQueries({ queryKey: ['student'] });
			queryClient.invalidateQueries({
				queryKey: ['audit-history', 'student_modules', String(studentModuleId)],
			});
			setSearch('');
			setSelected(null);
			setConfirmCode('');
			onSuccess();
		} catch (error) {
			notifications.show({
				title: 'Error',
				message: `Failed to reassign module: ${error}`,
				color: 'red',
			});
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<Stack gap='md'>
			<Alert color='yellow' icon={<IconAlertTriangle size={16} />}>
				This will change the semester module that this student module points to.
				This is a sensitive action — proceed with caution.
			</Alert>

			{!selected ? (
				<>
					<TextInput
						placeholder='Search by module code or name...'
						leftSection={<IconSearch size={16} />}
						value={search}
						onChange={(e) => setSearch(e.currentTarget.value)}
						rightSection={isSearching ? <Loader size='xs' /> : undefined}
					/>

					{results.length > 0 && (
						<Stack gap='xs' mah={300} style={{ overflowY: 'auto' }}>
							{results.map((mod) => (
								<Paper
									key={mod.id}
									p='sm'
									withBorder
									style={{ cursor: 'pointer' }}
									onClick={() => setSelected(mod)}
								>
									<Group justify='space-between' wrap='nowrap'>
										<Stack gap={2}>
											<Group gap='xs'>
												<Text size='sm' fw={600}>
													{mod.code}
												</Text>
												<Badge size='xs' variant='light'>
													{mod.credits} cr
												</Badge>
											</Group>
											<Text size='xs'>{mod.name}</Text>
											<Text size='xs' c='dimmed'>
												{mod.programName} • {formatSemester(mod.semesterNumber)}
											</Text>
										</Stack>
									</Group>
								</Paper>
							))}
						</Stack>
					)}

					{debouncedSearch.length >= 2 &&
						!isSearching &&
						results.length === 0 && (
							<Text size='sm' c='dimmed' ta='center'>
								No modules found
							</Text>
						)}
				</>
			) : (
				<Stack gap='md'>
					<Paper p='sm' withBorder bg='var(--mantine-color-dark-6)'>
						<Group justify='space-between'>
							<Stack gap={2}>
								<Group gap='xs'>
									<Text size='sm' fw={600}>
										{selected.code}
									</Text>
									<Badge size='xs' variant='light'>
										{selected.credits} cr
									</Badge>
								</Group>
								<Text size='xs'>{selected.name}</Text>
								<Text size='xs' c='dimmed'>
									{selected.programName} •{' '}
									{formatSemester(selected.semesterNumber)}
								</Text>
							</Stack>
							<Button
								variant='subtle'
								size='xs'
								color='gray'
								onClick={() => {
									setSelected(null);
									setConfirmCode('');
								}}
							>
								Change
							</Button>
						</Group>
					</Paper>

					<TextInput
						label={`Type "${selected.code}" to confirm`}
						placeholder={selected.code}
						value={confirmCode}
						onChange={(e) => setConfirmCode(e.currentTarget.value)}
						error={
							confirmCode.length > 0 && confirmCode !== selected.code
								? 'Module code does not match'
								: undefined
						}
					/>

					<Button
						color='red'
						leftSection={<IconCheck size={16} />}
						disabled={!isConfirmed}
						loading={isSubmitting}
						onClick={handleReassign}
					>
						Reassign Module
					</Button>
				</Stack>
			)}
		</Stack>
	);
}
