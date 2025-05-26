import { DetailsView, DetailsViewHeader, FieldView } from '@/components/adease';
import { deleteModule, getModule } from '@/server/modules/actions';
import { Paper, Stack, Title } from '@mantine/core';
import { notFound } from 'next/navigation';
import AssessmentsTable from './AssessmentsTable';

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
        <Title order={4} fw={400}>
          Module Information
        </Title>
        <Stack p={'md'}>
          <FieldView label='Module Code'>{mod.code}</FieldView>
          <FieldView label='Module Name'>{mod.name}</FieldView>
        </Stack>
      </Paper>

      <AssessmentsTable moduleId={mod.id} />
    </DetailsView>
  );
}
