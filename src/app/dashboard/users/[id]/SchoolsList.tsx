import { Badge, Box, Divider, Group, Paper, Skeleton, Stack, Text, Title } from '@mantine/core';
import { Suspense } from 'react';
import { getUserSchools } from '@/server/users/actions';

interface SchoolsListProps {
	userId: string;
}

function SchoolsListSkeleton() {
	return (
		<Paper withBorder p={'md'}>
			<Box>
				<Title order={5} fw='normal'>
					Schools
				</Title>
				<Divider mb={'md'} mt='xs' />
				<Title order={5} fw='normal'>
					Schools
				</Title>
				<Stack gap='xs'>
					{Array.from({ length: 3 }).map((_, index) => (
						<Group key={index}>
							<Skeleton height={24} width={60} radius='sm' />
							<Skeleton height={20} width={200} />
						</Group>
					))}
				</Stack>
			</Box>
		</Paper>
	);
}

async function SchoolsContent({ userId }: { userId: string }) {
	const userSchools = await getUserSchools(userId);

	return (
		<Paper withBorder p={'md'}>
			<Box>
				<Title order={5} fw='normal'>
					Schools
				</Title>
				<Divider mb={'md'} mt='xs' />
				{userSchools && userSchools.length > 0 ? (
					<Stack gap='xs'>
						{userSchools.map((school) => (
							<Group key={school.schoolId} justify='space-between'>
								<Group>
									<Badge variant='light' color='blue'>
										{school.school.code}
									</Badge>
									<Text size='sm'>{school.school.name}</Text>
								</Group>
							</Group>
						))}
					</Stack>
				) : (
					<Text c='dimmed' size='sm' ta='center' py='xl'>
						No schools assigned
					</Text>
				)}
			</Box>
		</Paper>
	);
}

export function SchoolsList({ userId }: SchoolsListProps) {
	return (
		<Suspense fallback={<SchoolsListSkeleton />}>
			<SchoolsContent userId={userId} />
		</Suspense>
	);
}
