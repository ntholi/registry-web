import { getUser } from '@/server/users/actions';
import { Box, Divider, Flex, Stack, Text, Title } from '@mantine/core';
import { notFound } from 'next/navigation';
import AssignedModules from './AssignedModules';
import ModuleAssignModal from './ModuleAssignModal';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function UserDetails({ params }: Props) {
  const { id } = await params;
  const lecturer = await getUser(id);

  if (!lecturer) {
    return notFound();
  }

  return (
    <Stack p={'xl'}>
      <Flex justify={'space-between'} align={'end'}>
        <Box>
          <Title order={2} fw={100}>
            {lecturer.name}
          </Title>

          <Text c='dimmed' size='sm'>
            Assigned Modules
          </Text>
        </Box>
        <ModuleAssignModal />
      </Flex>

      <Divider />
      <AssignedModules />
    </Stack>
  );
}
