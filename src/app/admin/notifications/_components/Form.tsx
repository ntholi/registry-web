'use client';

import { userPositions, userRoles } from '@auth/_database';
import {
	ActionIcon,
	Badge,
	Group,
	MultiSelect,
	SegmentedControl,
	Stack,
	Text,
	Textarea,
	TextInput,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { IconX } from '@tabler/icons-react';
import { useRouter } from 'nextjs-toploader/app';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import type { notifications, users } from '@/core/database';
import { toTitleCase } from '@/shared/lib/utils/utils';
import { Form } from '@/shared/ui/adease';
import UserInput from '@/shared/ui/UserInput';

type User = typeof users.$inferSelect;
type NotificationTargetType = 'all' | 'role' | 'users';

type NotificationFormData = typeof notifications.$inferInsert & {
	recipientUserIds?: string[];
};

type Props = {
	onSubmit: (values: NotificationFormData) => Promise<NotificationFormData>;
	defaultValues?: Partial<NotificationFormData>;
	title?: string;
};

const notificationSchema = z.object({
	title: z.string().min(1, 'Title is required'),
	message: z.string().min(1, 'Message is required'),
	targetType: z.enum(['all', 'role', 'users']),
	targetRoles: z.array(z.string()).nullable().optional(),
	targetPositions: z.array(z.string()).nullable().optional(),
	visibleFrom: z.date(),
	visibleUntil: z.date(),
	isActive: z.boolean().default(true),
	recipientUserIds: z.array(z.string()).optional(),
});

export default function NotificationForm({
	onSubmit,
	defaultValues,
	title,
}: Props) {
	const router = useRouter();
	const [targetType, setTargetType] = useState<NotificationTargetType>(
		(defaultValues?.targetType as NotificationTargetType) || 'all'
	);
	const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
	const [selectedRoles, setSelectedRoles] = useState<string[]>(
		defaultValues?.targetRoles || []
	);
	const [selectedPositions, setSelectedPositions] = useState<string[]>(
		defaultValues?.targetPositions || []
	);

	useEffect(() => {
		if (defaultValues?.targetRoles) {
			setSelectedRoles(defaultValues.targetRoles);
		}
		if (defaultValues?.targetPositions) {
			setSelectedPositions(defaultValues.targetPositions);
		}
	}, [defaultValues?.targetRoles, defaultValues?.targetPositions]);

	const handleAddUser = (user: User | null) => {
		if (user && !selectedUsers.find((u) => u.id === user.id)) {
			setSelectedUsers([...selectedUsers, user]);
		}
	};

	const handleRemoveUser = (userId: string) => {
		setSelectedUsers(selectedUsers.filter((u) => u.id !== userId));
	};

	const roleOptions = userRoles.enumValues.map((role) => ({
		value: role,
		label: toTitleCase(role),
	}));

	const positionOptions = userPositions.enumValues.map((position) => ({
		value: position,
		label: toTitleCase(position),
	}));

	return (
		<Form<NotificationFormData, Partial<NotificationFormData>>
			title={title}
			action={(values) => {
				const formData: NotificationFormData = {
					...values,
					targetType: targetType,
					targetRoles: targetType === 'role' ? selectedRoles : null,
					targetPositions: targetType === 'role' ? selectedPositions : null,
					recipientUserIds:
						targetType === 'users' ? selectedUsers.map((u) => u.id) : undefined,
				};
				return onSubmit(formData);
			}}
			queryKey={['notifications']}
			schema={notificationSchema}
			defaultValues={{
				title: defaultValues?.title || '',
				message: defaultValues?.message || '',
				targetType: defaultValues?.targetType || 'all',
				visibleFrom: defaultValues?.visibleFrom || new Date(),
				visibleUntil:
					defaultValues?.visibleUntil ||
					new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
				isActive: defaultValues?.isActive ?? true,
			}}
			onSuccess={({ id }) => {
				router.push(`/admin/notifications/${id}`);
			}}
		>
			{(form) => (
				<Stack gap='md'>
					<TextInput
						label='Title'
						placeholder='Enter notification title'
						required
						{...form.getInputProps('title')}
					/>

					<Textarea
						label='Message'
						placeholder='Enter notification message'
						minRows={4}
						required
						{...form.getInputProps('message')}
					/>

					<Group grow>
						<DateTimePicker
							label='Visible From'
							placeholder='Select start date and time'
							required
							{...form.getInputProps('visibleFrom')}
						/>
						<DateTimePicker
							label='Visible Until'
							placeholder='Select end date and time'
							required
							{...form.getInputProps('visibleUntil')}
						/>
					</Group>

					<Stack gap='xs'>
						<Text size='sm' fw={500}>
							Target Audience
						</Text>
						<SegmentedControl
							fullWidth
							value={targetType}
							onChange={(value) => {
								setTargetType(value as NotificationTargetType);
								form.setFieldValue(
									'targetType',
									value as NotificationTargetType
								);
							}}
							data={[
								{ label: 'All Users', value: 'all' },
								{ label: 'By Role/Position', value: 'role' },
								{ label: 'Specific Users', value: 'users' },
							]}
						/>
					</Stack>

					{targetType === 'role' && (
						<Stack gap='md'>
							<MultiSelect
								label='Target Roles'
								description='Leave empty to target all roles'
								placeholder='Select roles'
								data={roleOptions}
								value={selectedRoles}
								onChange={setSelectedRoles}
								searchable
								clearable
							/>
							<MultiSelect
								label='Target Positions'
								description='Leave empty to target all positions'
								placeholder='Select positions'
								data={positionOptions}
								value={selectedPositions}
								onChange={setSelectedPositions}
								searchable
								clearable
							/>
							<Text size='xs' c='dimmed'>
								{selectedRoles.length === 0 && selectedPositions.length === 0
									? 'This will target all dashboard users'
									: selectedRoles.length > 0 && selectedPositions.length > 0
										? 'Users must match BOTH role AND position'
										: selectedRoles.length > 0
											? 'Users with any of the selected roles'
											: 'Users with any of the selected positions'}
							</Text>
						</Stack>
					)}

					{targetType === 'users' && (
						<Stack gap='md'>
							<UserInput
								label='Add User'
								placeholder='Search for users...'
								onChange={handleAddUser}
							/>

							{selectedUsers.length > 0 && (
								<Stack gap='xs'>
									<Text size='sm' fw={500}>
										Selected Users ({selectedUsers.length})
									</Text>
									<Group gap='xs'>
										{selectedUsers.map((user) => (
											<Badge
												key={user.id}
												variant='light'
												rightSection={
													<ActionIcon
														size='xs'
														variant='transparent'
														onClick={() => handleRemoveUser(user.id)}
													>
														<IconX size={12} />
													</ActionIcon>
												}
											>
												{user.name || user.email}
											</Badge>
										))}
									</Group>
								</Stack>
							)}

							{selectedUsers.length === 0 && (
								<Text size='xs' c='dimmed'>
									No users selected. Search and add users above.
								</Text>
							)}
						</Stack>
					)}
				</Stack>
			)}
		</Form>
	);
}
