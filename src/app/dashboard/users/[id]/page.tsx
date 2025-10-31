import { Avatar, Badge, Card, Center, Grid, GridCol, Stack } from '@mantine/core';
import { notFound } from 'next/navigation';
import { DetailsView, DetailsViewBody, DetailsViewHeader, FieldView } from '@/components/adease';
import { largeProfilePic, toTitleCase } from '@/lib/utils';
import { deleteUser, getUser, getUserSchools } from '@/server/users/actions';
import { SchoolsList } from './SchoolsList';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function UserDetails({ params }: Props) {
	const { id } = await params;
	const users = await getUser(id);
	const _userSchools = await getUserSchools(id);

	if (!users) {
		return notFound();
	}

	return (
		<DetailsView>
			<DetailsViewHeader
				title={'User'}
				queryKey={['users']}
				handleDelete={async () => {
					'use server';
					await deleteUser(id);
				}}
			/>
			<DetailsViewBody>
				<Grid>
					<GridCol span={{ base: 12, md: 5 }}>
						<Card withBorder p={'sm'}>
							<Center>
								<Avatar src={largeProfilePic(users.image)} size={220} />
							</Center>
						</Card>
					</GridCol>
					<GridCol span={{ base: 12, md: 7 }}>
						<Stack gap={'lg'} p={'sm'}>
							<FieldView label='Name'>{users.name}</FieldView>

							<FieldView label='Email'>{users.email}</FieldView>
							<FieldView label='Role'>
								<Badge color={getRoleColor(users.role)} radius={'sm'} variant='light'>
									{toTitleCase(users.role)}
								</Badge>
							</FieldView>
							<FieldView label='Position'>{toTitleCase(users.position)}</FieldView>
						</Stack>
					</GridCol>
				</Grid>
				{users.role === 'academic' && <SchoolsList userId={id} />}
			</DetailsViewBody>
		</DetailsView>
	);
}

function getRoleColor(role: string) {
	switch (role) {
		case 'admin':
			return 'red';
		case 'user':
			return 'blue';
		case 'student':
			return 'teal';
		case 'finance':
			return 'orange';
		case 'registry':
			return 'grape';
		case 'library':
			return 'indigo';
		case 'resource':
			return 'cyan';
		case 'academic':
			return 'yellow';
		default:
			return 'gray';
	}
}
