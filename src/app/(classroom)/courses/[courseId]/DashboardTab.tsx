import { Avatar, Card, Group, Stack, Text } from '@mantine/core';
import type { Announcement } from '@/server/classroom/actions';

type Props = {
	announcements: Announcement[];
};

function formatDate(dateString: string | null | undefined) {
	if (!dateString) return 'No date';
	return new Date(dateString).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	});
}

export default function DashboardTab({ announcements }: Props) {
	if (announcements.length === 0) {
		return (
			<Card>
				<Text c='dimmed'>No announcements yet</Text>
			</Card>
		);
	}

	return (
		<Stack gap='md'>
			{announcements.map((announcement) => (
				<Card key={announcement.id} shadow='sm' padding='lg' radius='md'>
					<Stack gap='sm'>
						<Group>
							<Avatar
								src={announcement.creatorUserId}
								alt='Creator'
								radius='xl'
								size='md'
							/>
							<div>
								<Text fw={500} size='sm'>
									{announcement.creatorUserId}
								</Text>
								<Text size='xs' c='dimmed'>
									{formatDate(announcement.creationTime)}
								</Text>
							</div>
						</Group>

						{announcement.text && (
							<div>
								<Text
									size='sm'
									style={{ whiteSpace: 'pre-wrap' }}
									dangerouslySetInnerHTML={{ __html: announcement.text }}
								/>
							</div>
						)}

						{announcement.materials && announcement.materials.length > 0 && (
							<Stack gap='xs' mt='sm'>
								{announcement.materials.map((material, index) => (
									<Card
										key={
											material.driveFile?.driveFile?.id ||
											material.link?.url ||
											material.youtubeVideo?.id ||
											material.form?.formUrl ||
											index
										}
										withBorder
										padding='xs'
									>
										<Text size='sm'>
											{material.driveFile?.driveFile?.title ||
												material.link?.title ||
												material.youtubeVideo?.title ||
												material.form?.title ||
												'Attachment'}
										</Text>
									</Card>
								))}
							</Stack>
						)}
					</Stack>
				</Card>
			))}
		</Stack>
	);
}
