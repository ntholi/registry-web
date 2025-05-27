import {
  DetailsView,
  DetailsViewBody,
  DetailsViewHeader,
  FieldView,
} from '@/components/adease';
import { largeProfilePic, toTitleCase } from '@/lib/utils';
import {
  Avatar,
  Badge,
  Card,
  Center,
  Grid,
  GridCol,
  Group,
  Stack,
} from '@mantine/core';
import { notFound } from 'next/navigation';
import { deleteUser, getUser } from '../../../../server/users/actions';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function UserDetails({ params }: Props) {
  const { id } = await params;
  const users = await getUser(id);

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
          <GridCol span={{ base: 12, md: 6 }}>
            <Card withBorder p={'sm'}>
              <Center>
                <Avatar src={largeProfilePic(users.image)} size={300} />
              </Center>
            </Card>
          </GridCol>
          <GridCol span={{ base: 12, md: 6 }}>
            <Stack gap={'lg'} p={'sm'}>
              <FieldView label='Name'>{users.name}</FieldView>
              <Group align='center'>
                <Badge
                  color={getRoleColor(users.role)}
                  radius={'sm'}
                  variant='light'
                >
                  {toTitleCase(users.role)}
                </Badge>
              </Group>
              {users.position && (
                <FieldView label='Position'>
                  {toTitleCase(users.position)}
                </FieldView>
              )}
              <FieldView label='Email'>{users.email}</FieldView>
            </Stack>
          </GridCol>
        </Grid>
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
