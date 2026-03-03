'use client';

import {
	ActionIcon,
	Alert,
	Badge,
	Box,
	Button,
	Group,
	Modal,
	Select,
	Stack,
	Table,
	Text,
	TextInput,
	Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
	addModuleToRequest,
	getEligibleModulesForRequest,
} from '@registry/registration/requests';
import {
	IconAlertTriangle,
	IconCheck,
	IconLock,
	IconPlus,
	IconSearch,
} from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { studentModuleStatus } from '@/app/registry/students/_schema/types';
import type { ReceiptType, StudentModuleStatus } from '@/core/database';
import ReceiptInput from '@/shared/ui/adease/ReceiptInput';
import type { getRegistrationRequest } from '../_server/requests/actions';

type RegistrationRequest = NonNullable<
	Awaited<ReturnType<typeof getRegistrationRequest>>
>;

type EligibleModule = {
	semesterModuleId: number;
	code: string;
	name: string;
	type: string;
	credits: number;
	status: 'Compulsory' | 'Elective' | `Repeat${number}`;
	semesterNo: string;
	prerequisites?: Array<{ id: number; code: string; name: string }>;
};

type Props = {
	request: RegistrationRequest;
};

export default function AddModuleModal({ request }: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const [search, setSearch] = useState('');
	const [selected, setSelected] = useState<EligibleModule | null>(null);
	const [moduleStatus, setModuleStatus] = useState<StudentModuleStatus | null>(
		null
	);
	const [receipt, setReceipt] = useState('');
	const queryClient = useQueryClient();

	const existingModuleIds = new Set(
		request.requestedModules.map((rm) => rm.semesterModule.id)
	);

	const { data: moduleResult, isLoading } = useQuery({
		queryKey: ['eligible-modules', request.stdNo, request.term.code],
		queryFn: () =>
			getEligibleModulesForRequest(request.stdNo, request.term.code),
		enabled: opened,
	});

	const modules = moduleResult?.modules ?? [];

	const filtered = modules.filter(
		(m) =>
			m.code.toLowerCase().includes(search.toLowerCase()) ||
			m.name.toLowerCase().includes(search.toLowerCase())
	);

	const isRepeat = moduleStatus?.startsWith('Repeat') ?? false;
	const isValidReceipt = /^(PMRC\d{5}|SR-\d{5})$/.test(receipt);
	const canSubmit =
		!!selected &&
		!!moduleStatus &&
		(!isRepeat || isValidReceipt) &&
		!existingModuleIds.has(selected.semesterModuleId);

	const mutation = useMutation({
		mutationFn: async () => {
			if (!selected || !moduleStatus) return;
			const receiptPayload =
				isRepeat && receipt
					? ({ receiptNo: receipt, receiptType: 'repeat_module' } as {
							receiptNo: string;
							receiptType: ReceiptType;
						})
					: undefined;
			return addModuleToRequest(
				request.id,
				selected.semesterModuleId,
				moduleStatus,
				receiptPayload
			);
		},
		onSuccess: () => {
			notifications.show({
				title: 'Module Added',
				message: `${selected?.code} - ${selected?.name} added successfully`,
				color: 'green',
			});
			queryClient.invalidateQueries({
				queryKey: ['registration-requests'],
			});
			handleClose();
		},
		onError: (error) => {
			notifications.show({
				title: 'Error',
				message: error.message || 'Failed to add module',
				color: 'red',
			});
		},
	});

	function handleClose() {
		close();
		setSearch('');
		setSelected(null);
		setModuleStatus(null);
		setReceipt('');
	}

	function handleSelect(mod: EligibleModule) {
		const hasFailedPrereqs = mod.prerequisites && mod.prerequisites.length > 0;
		if (hasFailedPrereqs || existingModuleIds.has(mod.semesterModuleId)) return;
		setSelected(mod);
		if (mod.status.startsWith('Repeat')) {
			setModuleStatus(mod.status as StudentModuleStatus);
		} else if (mod.status === 'Elective') {
			setModuleStatus('Compulsory');
		} else {
			setModuleStatus(mod.status as StudentModuleStatus);
		}
	}

	const rows = filtered.map((mod) => {
		const hasFailedPrereqs = mod.prerequisites && mod.prerequisites.length > 0;
		const alreadyAdded = existingModuleIds.has(mod.semesterModuleId);
		const isSelected = selected?.semesterModuleId === mod.semesterModuleId;
		const isDisabled = hasFailedPrereqs || alreadyAdded;

		return (
			<Table.Tr
				key={mod.semesterModuleId}
				bg={isSelected ? 'var(--mantine-primary-color-light)' : undefined}
				style={{
					cursor: isDisabled ? 'not-allowed' : 'pointer',
					opacity: isDisabled ? 0.5 : 1,
				}}
				onClick={() => !isDisabled && handleSelect(mod)}
			>
				<Table.Td fw={500}>{mod.code}</Table.Td>
				<Table.Td>{mod.name}</Table.Td>
				<Table.Td ta='center'>{mod.credits}</Table.Td>
				<Table.Td>
					<Badge size='xs' variant='light'>
						{mod.status}
					</Badge>
				</Table.Td>
				<Table.Td>
					{alreadyAdded ? (
						<Tooltip label='Already in request'>
							<IconCheck size={16} color='var(--mantine-color-teal-6)' />
						</Tooltip>
					) : hasFailedPrereqs ? (
						<Tooltip
							label={`Failed prerequisites: ${mod.prerequisites!.map((p) => p.code).join(', ')}`}
							multiline
							maw={300}
						>
							<Group gap={4}>
								<IconLock size={16} color='var(--mantine-color-red-6)' />
								<Text size='xs' c='red'>
									{mod.prerequisites!.map((p) => p.code).join(', ')}
								</Text>
							</Group>
						</Tooltip>
					) : null}
				</Table.Td>
			</Table.Tr>
		);
	});

	return (
		<>
			<ActionIcon variant='default' onClick={open}>
				<IconPlus size={16} />
			</ActionIcon>

			<Modal opened={opened} onClose={handleClose} title='Add Module' size='xl'>
				<Stack>
					<TextInput
						placeholder='Search by module code or name...'
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						leftSection={<IconSearch size='1rem' />}
					/>

					<Box style={{ maxHeight: 400, overflow: 'auto' }}>
						{isLoading ? (
							<Text ta='center' p='md' c='dimmed'>
								Loading eligible modules...
							</Text>
						) : filtered.length === 0 ? (
							<Text ta='center' p='md' c='dimmed'>
								No modules found
							</Text>
						) : (
							<Table highlightOnHover withTableBorder>
								<Table.Thead>
									<Table.Tr>
										<Table.Th>Code</Table.Th>
										<Table.Th>Name</Table.Th>
										<Table.Th ta='center'>Credits</Table.Th>
										<Table.Th>Type</Table.Th>
										<Table.Th>Status</Table.Th>
									</Table.Tr>
								</Table.Thead>
								<Table.Tbody>{rows}</Table.Tbody>
							</Table>
						)}
					</Box>

					{moduleResult?.error && (
						<Alert
							icon={<IconAlertTriangle size='1rem' />}
							color='orange'
							variant='light'
						>
							{moduleResult.error}
						</Alert>
					)}

					{selected && (
						<Stack
							gap='sm'
							p='md'
							style={{
								borderRadius: 'var(--mantine-radius-md)',
								border: '1px solid var(--mantine-color-default-border)',
							}}
						>
							<Text size='sm' fw={500}>
								Selected: {selected.code} - {selected.name}
							</Text>

							<Select
								label='Module Status'
								data={studentModuleStatus.enumValues.map((s) => ({
									value: s,
									label: s,
								}))}
								value={moduleStatus}
								onChange={(v) =>
									setModuleStatus(v as StudentModuleStatus | null)
								}
								required
							/>

							{isRepeat && (
								<ReceiptInput
									label='Payment Receipt'
									description='Required for repeat modules'
									required
									value={receipt}
									onChange={setReceipt}
								/>
							)}
						</Stack>
					)}

					<Group justify='flex-end'>
						<Button variant='default' onClick={handleClose}>
							Cancel
						</Button>
						<Button
							onClick={() => mutation.mutate()}
							disabled={!canSubmit}
							loading={mutation.isPending}
						>
							Add Module
						</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
