'use client';

import { getUserSchools } from '@admin/users';
import {
	ActionIcon,
	Avatar,
	Card,
	Flex,
	Group,
	Modal,
	Select,
	Stack,
	Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { IconLogout2, IconSwitchHorizontal, IconX } from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { ViewAsData } from '@/core/auth';
import { DASHBOARD_ROLES, type DashboardRole } from '@/core/auth/permissions';
import { authClient } from '@/core/auth-client';
import { toTitleCase } from '@/shared/lib/utils/utils';
import { clearViewAs, getPresetsForRole, setViewAs } from './_server/view-as';

export default function UserButton({ viewAs }: { viewAs: ViewAsData | null }) {
	const { data: session, isPending } = authClient.useSession();
	const router = useRouter();

	const { data: userSchools } = useQuery({
		queryKey: ['user-schools'],
		queryFn: () => getUserSchools(session?.user?.id),
		enabled: session?.user?.role === 'academic' && !viewAs,
	});

	if (!isPending && !session) {
		router.push('/auth/login');
	}
	const user = session?.user;
	const isAdmin = session?.user?.role === 'admin' || !!viewAs;

	const openLogoutModal = () =>
		modals.openConfirmModal({
			centered: true,
			title: 'Confirm logout',
			children: 'Are you sure you want to logout?',
			confirmProps: { color: 'dark' },
			labels: { confirm: 'Logout', cancel: 'Cancel' },
			onConfirm: () =>
				authClient.signOut({
					fetchOptions: {
						onSuccess: () => router.push('/auth/login'),
					},
				}),
		});

	const effectiveRole = viewAs?.role ?? user?.role;

	return (
		<Stack gap='xs' mt='md' mb='sm'>
			{isAdmin && <ViewAsCard viewAs={viewAs} />}
			<Flex justify='space-between' align='center'>
				<Group>
					<Avatar src={user?.image} />
					<Stack gap={5}>
						<Text size='0.9rem'>{user?.name}</Text>
						<Text size='0.7rem' c='dimmed'>
							{user?.email}
						</Text>
						<Text size='0.65rem' c='dimmed'>
							{effectiveRole === 'academic' && !viewAs
								? userSchools?.map((it) => it.school.code).join(', ')
								: toTitleCase(effectiveRole)}
							{viewAs?.presetName
								? ` | ${viewAs.presetName}`
								: user?.presetName
									? ` | ${user.presetName}`
									: ''}
						</Text>
					</Stack>
				</Group>
				<ActionIcon variant='default' size='lg' onClick={openLogoutModal}>
					<IconLogout2 size='1rem' />
				</ActionIcon>
			</Flex>
		</Stack>
	);
}

function ViewAsCard({ viewAs }: { viewAs: ViewAsData | null }) {
	const [opened, { open, close }] = useDisclosure(false);
	const [loading, setLoading] = useState(false);
	const queryClient = useQueryClient();

	async function handleClear() {
		setLoading(true);
		await clearViewAs();
		queryClient.invalidateQueries();
		setLoading(false);
		window.location.reload();
	}

	return (
		<>
			<Card withBorder p='xs' radius='sm'>
				<Flex justify='space-between' align='center'>
					<Stack gap={2}>
						<Text size='0.7rem' fw={600} c='dimmed' tt='uppercase'>
							{viewAs ? 'Viewing as' : 'Admin'}
						</Text>
						{viewAs ? (
							<Text size='xs' fw={500}>
								{toTitleCase(viewAs.role)}
								{viewAs.presetName ? ` — ${viewAs.presetName}` : ''}
							</Text>
						) : (
							<Text size='xs' c='dimmed'>
								Switch to view as another role
							</Text>
						)}
					</Stack>
					<Group gap={4}>
						<ActionIcon
							variant='subtle'
							size='sm'
							color={viewAs ? 'orange' : 'gray'}
							onClick={open}
						>
							<IconSwitchHorizontal size='0.9rem' />
						</ActionIcon>
						{viewAs && (
							<ActionIcon
								variant='subtle'
								size='sm'
								color='red'
								onClick={handleClear}
								loading={loading}
							>
								<IconX size='0.9rem' />
							</ActionIcon>
						)}
					</Group>
				</Flex>
			</Card>
			<RoleSwitchModal opened={opened} onClose={close} viewAs={viewAs} />
		</>
	);
}

type PresetOption = { value: string; label: string };

function RoleSwitchModal({
	opened,
	onClose,
	viewAs,
}: {
	opened: boolean;
	onClose: () => void;
	viewAs: ViewAsData | null;
}) {
	const [role, setRole] = useState<DashboardRole | null>(viewAs?.role ?? null);
	const [presetId, setPresetId] = useState<string | null>(
		viewAs?.presetId ?? null
	);
	const [loading, setLoading] = useState(false);
	const queryClient = useQueryClient();

	const { data: presets, isLoading: presetsLoading } = useQuery({
		queryKey: ['presets-by-role', role],
		queryFn: () => getPresetsForRole(role!),
		enabled: !!role,
	});

	const presetOptions: PresetOption[] = (presets ?? []).map((p) => ({
		value: p.id,
		label: p.name,
	}));

	const roleOptions = DASHBOARD_ROLES.filter((r) => r !== 'admin').map((r) => ({
		value: r,
		label: toTitleCase(r),
	}));

	async function handleApply() {
		if (!role) return;
		setLoading(true);
		await setViewAs(role, presetId);
		queryClient.invalidateQueries();
		onClose();
		setLoading(false);
		window.location.reload();
	}

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title='Switch Role View'
			centered
			size='sm'
		>
			<Stack gap='md'>
				<Select
					label='Role'
					placeholder='Select role'
					data={roleOptions}
					value={role}
					onChange={(val) => {
						setRole(val as DashboardRole);
						setPresetId(null);
					}}
					searchable
				/>
				{role && (
					<Select
						label='Permission Preset'
						placeholder={presetsLoading ? 'Loading...' : 'None (role only)'}
						data={presetOptions}
						value={presetId}
						onChange={setPresetId}
						clearable
						disabled={presetsLoading}
						searchable
					/>
				)}
				<Group justify='flex-end'>
					<ActionIcon
						variant='filled'
						size='lg'
						onClick={handleApply}
						disabled={!role}
						loading={loading}
					>
						<IconSwitchHorizontal size='1rem' />
					</ActionIcon>
				</Group>
			</Stack>
		</Modal>
	);
}
