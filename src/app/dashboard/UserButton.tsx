'use client';

import { getUserSchools } from '@admin/users';
import {
	ActionIcon,
	Avatar,
	Button,
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
import { IconLogout2, IconSwitchHorizontal } from '@tabler/icons-react';
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
	const [opened, { open, close }] = useDisclosure(false);

	const { data: userSchools } = useQuery({
		queryKey: ['user-schools'],
		queryFn: () => getUserSchools(session?.user?.id),
		enabled: session?.user?.role === 'academic' && !viewAs,
	});

	if (!isPending && !session) {
		router.push('/auth/login');
	}
	const user = session?.user;
	const isAdmin = session?.user?.role === 'admin';
	const isViewingAs = isAdmin && !!viewAs;

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
				<ActionIcon
					variant={isViewingAs ? 'filled' : 'default'}
					size='lg'
					color={isViewingAs ? 'red' : undefined}
					onClick={isAdmin ? open : openLogoutModal}
				>
					<IconLogout2 size='1rem' />
				</ActionIcon>
			</Flex>
			{isAdmin && (
				<UserActionModal
					opened={opened}
					onClose={close}
					viewAs={viewAs}
					onLogout={openLogoutModal}
				/>
			)}
		</Stack>
	);
}

type PresetOption = { value: string; label: string };

function UserActionModal({
	opened,
	onClose,
	viewAs,
	onLogout,
}: {
	opened: boolean;
	onClose: () => void;
	viewAs: ViewAsData | null;
	onLogout: () => void;
}) {
	const [role, setRole] = useState<DashboardRole | null>(viewAs?.role ?? null);
	const [presetId, setPresetId] = useState<string | null>(
		viewAs?.presetId ?? null
	);
	const [applyLoading, setApplyLoading] = useState(false);
	const [clearLoading, setClearLoading] = useState(false);
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

	function handleClose() {
		setRole(viewAs?.role ?? null);
		setPresetId(viewAs?.presetId ?? null);
		onClose();
	}

	async function handleClear() {
		setClearLoading(true);
		await clearViewAs();
		await queryClient.invalidateQueries();
		handleClose();
		setClearLoading(false);
		window.location.reload();
	}

	async function handleApply() {
		if (!role) return;
		setApplyLoading(true);
		await setViewAs(role, presetId);
		await queryClient.invalidateQueries();
		handleClose();
		setApplyLoading(false);
		window.location.reload();
	}

	function handleLogout() {
		handleClose();
		onLogout();
	}

	return (
		<Modal
			opened={opened}
			onClose={handleClose}
			title='Account Actions'
			centered
			size='sm'
		>
			<Stack gap='md'>
				<Card withBorder p='sm' radius='md'>
					<Stack gap={2}>
						<Text size='0.7rem' fw={600} c='dimmed' tt='uppercase'>
							{viewAs ? 'Viewing as' : 'Admin'}
						</Text>
						<Text size='sm' fw={500}>
							{viewAs
								? `${toTitleCase(viewAs.role)}${viewAs.presetName ? ` | ${viewAs.presetName}` : ''}`
								: 'Switch to another dashboard role or logout.'}
						</Text>
					</Stack>
				</Card>
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
				<Group grow>
					<Button
						variant='filled'
						onClick={handleApply}
						disabled={!role}
						loading={applyLoading}
						leftSection={<IconSwitchHorizontal size='1rem' />}
					>
						Apply View As
					</Button>
					{viewAs && (
						<Button
							variant='light'
							color='red'
							onClick={handleClear}
							loading={clearLoading}
						>
							Return to Admin
						</Button>
					)}
				</Group>
				<Button variant='default' onClick={handleLogout}>
					Logout
				</Button>
			</Stack>
		</Modal>
	);
}
