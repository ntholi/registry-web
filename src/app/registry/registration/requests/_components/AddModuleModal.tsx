'use client';

import {
	ActionIcon,
	Alert,
	Badge,
	Box,
	Button,
	Group,
	Modal,
	Stack,
	Table,
	Text,
	TextInput,
	Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
	createRegistration,
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
import type { StudentModuleStatus } from '@/core/database';
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
	const [receipt, setReceipt] = useState('');
	const queryClient = useQueryClient();
	const isSelfSponsored = request.sponsoredStudent?.sponsor?.code === 'PRV';

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

	const isRepeat = selected?.status.startsWith('Repeat') ?? false;
	const requiresRepeatReceipt = isRepeat && !isSelfSponsored;
	const isValidReceipt = /^(PMRC\d{5}|SR-\d{5})$/.test(receipt);
	const canSubmit =
		!!selected &&
		(!requiresRepeatReceipt || isValidReceipt) &&
		!existingModuleIds.has(selected.semesterModuleId);

	function getModuleStatus(module: EligibleModule): StudentModuleStatus {
		if (module.status === 'Compulsory' || module.status === 'Elective') {
			return 'Compulsory';
		}

		return module.status as StudentModuleStatus;
	}

	const mutation = useMutation({
		mutationFn: async () => {
			if (!selected) throw new Error('Please select a module');

			const sponsorId = request.sponsoredStudent?.sponsorId;
			if (!sponsorId) {
				throw new Error(
					'No sponsor information found on the current request. Please update sponsorship details first.'
				);
			}

			if (!request.semesterNumber || !request.semesterStatus) {
				throw new Error(
					'Missing semester details on the current request. Please update semester details first.'
				);
			}

			const receipts =
				requiresRepeatReceipt && receipt
					? [{ receiptNo: receipt, receiptType: 'repeat_module' as const }]
					: undefined;

			return createRegistration({
				stdNo: request.stdNo,
				termId: request.termId,
				sponsorId,
				semesterNumber: request.semesterNumber,
				semesterStatus: request.semesterStatus,
				borrowerNo: request.sponsoredStudent?.borrowerNo ?? undefined,
				bankName: request.sponsoredStudent?.bankName ?? undefined,
				accountNumber: request.sponsoredStudent?.accountNumber ?? undefined,
				modules: [
					{
						moduleId: selected.semesterModuleId,
						moduleStatus: getModuleStatus(selected),
					},
				],
				receipts,
			});
		},
		onSuccess: () => {
			notifications.show({
				title: 'Additional Request Created',
				message: `${selected?.code} - ${selected?.name} was submitted as a new registration request`,
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
		setReceipt('');
	}

	function handleSelect(mod: EligibleModule) {
		const hasFailedPrereqs = mod.prerequisites && mod.prerequisites.length > 0;
		if (hasFailedPrereqs || existingModuleIds.has(mod.semesterModuleId)) return;
		setSelected(mod);
		setReceipt('');
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

			<Modal
				opened={opened}
				onClose={handleClose}
				title='Add Module as Additional Request'
				size='xl'
			>
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

							{requiresRepeatReceipt && (
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
							Create Request
						</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
