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
  Divider,
  Grid,
  GridCol,
  Group,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { notFound } from 'next/navigation';
import { deleteUser, getUser, getUserSchools } from '../../../../server/users/actions';

type Props = {
  params: Promise<{ id: string }>;
};

type School = {
  id: number;
  name: string;
  code: string;
};

export default async function UserDetails({ params }: Props) {
  const { id } = await params;
  const users = await getUser(id);
  const userSchools = await getUserSchools(id);

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
              
              <FieldView label='Role'>
                <Badge
                  color={getRoleColor(users.role)}
                  radius={'sm'}
                  variant='light'
                  size="lg"
                >
                  {toTitleCase(users.role)}
                </Badge>
              </FieldView>
              
              {users.position && (
                <FieldView label='Position'>
                  {toTitleCase(users.position)}
                </FieldView>
              )}
              
              <FieldView label='Email'>{users.email}</FieldView>
              
              <Divider my="xs" />
              
              <FieldView label='Schools'>
                {userSchools && userSchools.length > 0 ? (
                  <Stack gap="xs">
                    {userSchools.map((school: any) => (
                      <Group key={school.schoolId}>
                        <Badge variant="light" color="blue">
                          {school.school.code}
                        </Badge>
                        <Text size="sm">{school.school.name}</Text>
                      </Group>
                    ))}
                  </Stack>
                ) : (
                  <Text c="dimmed" size="sm">No schools assigned</Text>
                )}
              </FieldView>
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
