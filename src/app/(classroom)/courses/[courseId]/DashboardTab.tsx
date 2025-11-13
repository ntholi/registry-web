import { Box, Card, Divider, Paper, Stack, Text } from '@mantine/core';
import type { Announcement } from '@/server/classroom/actions';

type Props = {
	announcements: Announcement[];
};

function formatDate(dateString: string | null | undefined) {
	if (!dateString) return '';
	return new Date(dateString).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}

export default function DashboardTab({ announcements }: Props) {
	if (announcements.length === 0) {
		return (
			<Paper p='xl' radius='md' withBorder>
				<Text c='dimmed' ta='center'>
					No announcements yet
				</Text>
			</Paper>
		);
	}

	return (
		<Stack gap='md'>
			{announcements.map((announcement) => (
				<Paper key={announcement.id} p='xl' radius='md' withBorder>
					<Stack gap='md'>
						<Box>
							<Text size='sm' c='dimmed'>
								{formatDate(announcement.creationTime)}
							</Text>
						</Box>

						{announcement.text && (
							<Text
								size='md'
								style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}
								dangerouslySetInnerHTML={{ __html: announcement.text }}
							/>
						)}

						{announcement.materials && announcement.materials.length > 0 && (
							<>
								<Divider />
								<Stack gap='xs'>
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
											p='sm'
											radius='sm'
										>
											<Text size='sm' fw={500}>
												{material.driveFile?.driveFile?.title ||
													material.link?.title ||
													material.youtubeVideo?.title ||
													material.form?.title ||
													'Attachment'}
											</Text>
										</Card>
									))}
								</Stack>
							</>
						)}
					</Stack>
				</Paper>
			))}
		</Stack>
	);
}
