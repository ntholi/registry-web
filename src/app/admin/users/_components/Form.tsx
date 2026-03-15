'use client';

import { getAllSchools } from '@academic/schools/_server/actions';
import type { users } from '@auth/_database';
import {
	findPresetsByRole,
	getPreset,
} from '@auth/permission-presets/_server/actions';
import {
	ActionIcon,
	Anchor,
	Button,
	Group,
	Modal,
	Paper,
	Select,
	Stack,
	Table,
	Text,
	TextInput,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';
import { z } from 'zod';
import PermissionMatrix from '@/app/auth/_components/PermissionMatrix';
import {
	DASHBOARD_ROLES,
	type DashboardRole,
	USER_ROLES,
	type UserRole,
} from '@/core/auth/permissions';
import { unwrap } from '@/shared/lib/utils/actionResult';
import { toTitleCase } from '@/shared/lib/utils/utils';
import { Form } from '@/shared/ui/adease';

type User = typeof users.$inferInsert;

type UserWithSchools = User & {
	schoolIds?: number[];
	lmsUserId?: number | null;
	lmsToken?: string | null;
};

type UserFormValues = Omit<UserWithSchools, 'schoolIds'> & {
	schoolIds?: string[];
};

const NO_PRESET = '__none__';

function isDashboardRole(role: string): role is DashboardRole {
	return DASHBOARD_ROLES.includes(role as DashboardRole);
}

type Props = {
	onSubmit: (values: UserWithSchools) => Promise<User>;
	defaultValues?: Partial<UserWithSchools>;
	onSuccess?: (value: User) => void;
	onError?: (
		error: Error | React.SyntheticEvent<HTMLDivElement, Event>
	) => void;
	title?: string;
};

export default function UserForm({ onSubmit, defaultValues, title }: Props) {
	const router = useRouter();
	const [opened, { open, close }] = useDisclosure(false);
	const [selectedSchools, setSelectedSchools] = useState<string[]>(
		defaultValues?.schoolIds?.map((id) => id.toString()) ?? []
	);
	const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
	const [role, setRole] = useState<UserRole>(
		(defaultValues?.role ?? 'user') as UserRole
	);
	const [presetId, setPresetId] = useState<string | null>(
		defaultValues?.presetId ?? null
	);
	const presetRole = isDashboardRole(role) ? role : null;

	const { data: schools } = useQuery({
		queryKey: ['schools'],
		queryFn: () => getAllSchools(),
		select: unwrap,
	});

	const { data: presets } = useQuery({
		queryKey: ['permission-presets', presetRole],
		queryFn: () =>
			presetRole ? findPresetsByRole(presetRole) : Promise.resolve([]),
		enabled: presetRole !== null,
	});

	const { data: preset } = useQuery({
		queryKey: ['permission-preset', presetId],
		queryFn: () => getPreset(presetId!),
		enabled: presetId !== null,
	});

	const schoolsOptions = schools
		? schools.map((school) => ({
				value: school.id.toString(),
				label: school.name,
			}))
		: [];

	const presetOptions = [
		{ value: NO_PRESET, label: 'No preset (role-only access)' },
		...(presets?.map((item) => ({
			value: item.id,
			label: `${item.name} (${item.permissionCount})`,
		})) ?? []),
	];

	const formDefaults: Partial<UserFormValues> = {
		...defaultValues,
		schoolIds: defaultValues?.schoolIds?.map((id) => id.toString()),
		presetId: defaultValues?.presetId ?? null,
		role: (defaultValues?.role ?? 'user') as UserRole,
	};

	const userFormSchema = z.object({
		name: z.string().min(1, 'Name is required'),
		role: z.enum(USER_ROLES),
		presetId: z.string().nullable().optional(),
		schoolIds: z.array(z.string()).optional(),
		lmsUserId: z.number().nullable().optional(),
		lmsToken: z.string().nullable().optional(),
	});

	const handleAddSchool = () => {
		if (selectedSchoolId && !selectedSchools.includes(selectedSchoolId)) {
			setSelectedSchools([...selectedSchools, selectedSchoolId]);
			setSelectedSchoolId(null);
			close();
		}
	};

	const handleRemoveSchool = (schoolId: string) => {
		setSelectedSchools(selectedSchools.filter((id) => id !== schoolId));
	};

	const getSchoolNameById = (id: string) => {
		const school = schoolsOptions.find((school) => school.value === id);
		return school ? school.label : 'Unknown School';
	};

	return (
		<>
			<Modal opened={opened} onClose={close} title='Add School' centered>
				<Select
					label='Select School'
					placeholder='Choose a school'
					data={schoolsOptions.filter(
						(school) => !selectedSchools.includes(school.value)
					)}
					value={selectedSchoolId}
					onChange={setSelectedSchoolId}
					searchable
					clearable
				/>
				<Group justify='flex-end' mt='md'>
					<Button onClick={handleAddSchool} disabled={!selectedSchoolId}>
						Add
					</Button>
				</Group>
			</Modal>

			<Form<UserFormValues, Partial<UserFormValues>>
				title={title}
				action={(values) => {
					const formattedValues: UserWithSchools = {
						...values,
						presetId: values.presetId ?? null,
						schoolIds:
							values.role === 'academic'
								? selectedSchools.map((id: string) => parseInt(id, 10))
								: undefined,
					};
					return onSubmit(formattedValues).then((user) => ({
						...values,
						id: user.id,
					}));
				}}
				queryKey={['users']}
				schema={userFormSchema}
				defaultValues={formDefaults}
				onSuccess={({ id }) => {
					router.push(`/admin/users/${id}`);
				}}
			>
				{(form) => (
					<>
						<TextInput
							label='Name'
							{...form.getInputProps('name')}
							description={form.values.email}
						/>
						<Group>
							<Select
								label='Role'
								flex={1}
								searchable
								data={USER_ROLES.map((role) => ({
									value: role,
									label: toTitleCase(role),
								})).sort((a, b) => a.label.localeCompare(b.label))}
								{...form.getInputProps('role')}
								onChange={(value) => {
									const nextRole = (value || 'user') as UserRole;
									setRole(nextRole);
									form.setFieldValue('role', nextRole);
									setPresetId(null);
									form.setFieldValue('presetId', null);
									if (value !== 'academic' && selectedSchools.length > 0) {
										setSelectedSchools([]);
									}
								}}
							/>

							<Select
								label='Preset'
								flex={1}
								searchable
								data={presetOptions}
								disabled={presetRole === null}
								value={presetId ?? NO_PRESET}
								nothingFoundMessage='No presets available'
								description={
									presetRole === null
										? 'Presets are available for dashboard roles only'
										: undefined
								}
								onChange={(value) => {
									const nextPresetId =
										value && value !== NO_PRESET ? value : null;
									setPresetId(nextPresetId);
									form.setFieldValue('presetId', nextPresetId);
								}}
							/>
						</Group>

						<Group>
							<TextInput
								label='Moodle User ID'
								flex={1}
								type='number'
								placeholder='Enter Moodle User ID'
								{...form.getInputProps('lmsUserId')}
								onChange={(event) => {
									const value = event.currentTarget.value;
									form.setFieldValue('lmsUserId', value ? Number(value) : null);
								}}
							/>
							<TextInput
								label='Moodle Token'
								flex={1}
								placeholder='Enter Moodle access token'
								{...form.getInputProps('lmsToken')}
							/>
						</Group>

						{form.values.role === 'academic' && (
							<div>
								<Group justify='space-between' align='center' mb='xs'>
									<Text fw={500}>Schools</Text>
									<Button
										leftSection={<IconPlus size={16} />}
										size='xs'
										onClick={open}
										variant='light'
									>
										Add School
									</Button>
								</Group>

								{selectedSchools.length > 0 ? (
									<Table striped highlightOnHover withTableBorder>
										<Table.Thead>
											<Table.Tr>
												<Table.Th>School Name</Table.Th>
												<Table.Th style={{ width: 80 }}>Actions</Table.Th>
											</Table.Tr>
										</Table.Thead>
										<Table.Tbody>
											{selectedSchools.map((schoolId) => (
												<Table.Tr key={schoolId}>
													<Table.Td>{getSchoolNameById(schoolId)}</Table.Td>
													<Table.Td>
														<ActionIcon
															color='red'
															variant='subtle'
															onClick={() => handleRemoveSchool(schoolId)}
														>
															<IconTrash size={16} />
														</ActionIcon>
													</Table.Td>
												</Table.Tr>
											))}
										</Table.Tbody>
									</Table>
								) : (
									<Text c='dimmed' size='xs' ta='center' py='md'>
										No schools assigned. Click &quot;Add School&quot; to assign
										schools to this user.
									</Text>
								)}
								<input type='hidden' {...form.getInputProps('schoolIds')} />
							</div>
						)}
						{preset ? (
							<Paper withBorder radius='md' p='md'>
								<Stack gap='sm'>
									<PermissionMatrix permissions={preset.permissions} readOnly />
									<Text c='dimmed' size='sm'>
										To modify permissions, edit the preset directly.{' '}
										<Anchor
											component={Link}
											href={`/admin/permission-presets/${preset.id}`}
										>
											Manage Presets
										</Anchor>
									</Text>
								</Stack>
							</Paper>
						) : null}
					</>
				)}
			</Form>
		</>
	);
}
