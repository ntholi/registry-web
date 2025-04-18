import { DetailsView, DetailsViewHeader } from '@/components/adease';
import { notFound } from 'next/navigation';
import { getUser } from '@/server/users/actions';
import {
  Box,
  Divider,
  Group,
  Stack,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
  Title,
  Text,
  Flex,
} from '@mantine/core';
import ModuleAssignModal from './ModuleAsignModal';

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
      <Box px='lg' py='md'>
        <Tabs defaultValue='gallery' orientation='vertical'>
          <TabsList>
            <TabsTab value='gallery'>Gallery</TabsTab>
            <TabsTab value='messages'>Messages</TabsTab>
            <TabsTab value='settings'>Settings</TabsTab>
          </TabsList>
          <Box p='lg'>
            <TabsPanel value='gallery'>Gallery tab content</TabsPanel>
            <TabsPanel value='messages'>Messages tab content</TabsPanel>
            <TabsPanel value='settings'>Settings tab content</TabsPanel>
          </Box>
        </Tabs>
      </Box>
    </Stack>
  );
}
