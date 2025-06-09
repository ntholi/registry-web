import { DetailsView, DetailsViewHeader, FieldView } from '@/components/adease';
import { deleteModule, getModule } from '@/server/modules/actions';
import { Paper, Stack, Title, Button, Group } from '@mantine/core';
import { IconChartLine } from '@tabler/icons-react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import AssessmentsTable from './AssessmentsTable';
import ModuleLecturers from './ModuleLecturers';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ModuleDetails({ params }: Props) {
  const { id } = await params;
  const mod = await getModule(Number(id));

  if (!mod) {
    return notFound();
  }
  return (
    <DetailsView>
      <DetailsViewHeader
        title={`Module: ${mod.code}`}
        queryKey={['modules']}
        handleDelete={async () => {
          'use server';
          await deleteModule(Number(id));
        }}
      />

      <Paper p='md' radius='md' withBorder shadow='sm' mb='md' mt='lg'>
        <Group justify='space-between' align='flex-start' mb='md'>
          <Title order={4} fw={400}>
            Module Information
          </Title>
          <Link href={`/admin/gradebook/${mod.id}`} passHref>
            <Button
              variant='light'
              leftSection={<IconChartLine size={16} />}
              size='sm'
            >
              View Gradebook
            </Button>
          </Link>
        </Group>
        <Stack p={'md'}>
          <FieldView label='Module Code'>{mod.code}</FieldView>
          <FieldView label='Module Name'>{mod.name}</FieldView>
        </Stack>
      </Paper>

      <Paper p='md' radius='md' withBorder shadow='sm' mb='md'>
        <Title order={4} fw={400} mb='md'>
          Assigned Lecturers
        </Title>
        <ModuleLecturers moduleId={mod.id} />
      </Paper>

      <AssessmentsTable moduleId={mod.id} />
    </DetailsView>
  );
}
