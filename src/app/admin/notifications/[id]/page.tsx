import { Badge, Group, Stack, Text } from '@mantine/core';
import { notFound } from 'next/navigation';
import { getBooleanColor } from '@/shared/lib/utils/colors';
import { formatFullDateTime } from '@/shared/lib/utils/dates';
import { toTitleCase } from '@/shared/lib/utils/utils';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
	FieldView,
} from '@/shared/ui/adease';
import { deleteNotification, getNotification } from '../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function NotificationDetails({ params }: Props) {
	const { id } = await params;
	const notification = await getNotification(Number(id));

	if (!notification) {
		return notFound();
	}

	return (
		<DetailsView>
			<DetailsViewHeader
				title='Notification'
				queryKey={['notifications']}
				handleDelete={async () => {
					'use server';
					await deleteNotification(Number(id));
				}}
			/>
			<DetailsViewBody>
				<Stack gap='md'>
					<FieldView label='Title'>{notification.title}</FieldView>

					<FieldView label='Message'>
						<Text style={{ whiteSpace: 'pre-wrap' }}>
							{notification.message}
						</Text>
					</FieldView>

					<Group grow>
						<FieldView label='Visible From'>
							{formatFullDateTime(notification.visibleFrom)}
						</FieldView>
						<FieldView label='Visible Until'>
							{formatFullDateTime(notification.visibleUntil)}
						</FieldView>
					</Group>

					<FieldView label='Status'>
						<Badge color={getBooleanColor(notification.isActive)}>
							{notification.isActive ? 'Active' : 'Inactive'}
						</Badge>
					</FieldView>

					<FieldView label='Target Audience'>
						<Badge variant='light'>
							{notification.targetType === 'all'
								? 'All Users'
								: notification.targetType === 'role'
									? 'By Role/Position'
									: 'Specific Users'}
						</Badge>
					</FieldView>

					{notification.targetType === 'role' && (
						<>
							{notification.targetRoles &&
								notification.targetRoles.length > 0 && (
									<FieldView label='Target Roles'>
										<Group gap='xs'>
											{notification.targetRoles.map((role) => (
												<Badge key={role} variant='outline'>
													{toTitleCase(role)}
												</Badge>
											))}
										</Group>
									</FieldView>
								)}
							{notification.targetPositions &&
								notification.targetPositions.length > 0 && (
									<FieldView label='Target Positions'>
										<Group gap='xs'>
											{notification.targetPositions.map((position) => (
												<Badge key={position} variant='outline'>
													{toTitleCase(position)}
												</Badge>
											))}
										</Group>
									</FieldView>
								)}
						</>
					)}

					{notification.targetType === 'users' &&
						notification.recipients &&
						notification.recipients.length > 0 && (
							<FieldView label='Recipients'>
								<Group gap='xs'>
									{notification.recipients.map((recipient) => (
										<Badge key={recipient.userId} variant='outline'>
											{recipient.user?.name || recipient.user?.email}
										</Badge>
									))}
								</Group>
							</FieldView>
						)}

					<FieldView label='Created By'>
						{notification.creator?.name || notification.creator?.email}
					</FieldView>

					{notification.createdAt && (
						<FieldView label='Created At'>
							{formatFullDateTime(notification.createdAt)}
						</FieldView>
					)}
				</Stack>
			</DetailsViewBody>
		</DetailsView>
	);
}
