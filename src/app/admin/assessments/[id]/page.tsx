import {
  DetailsView,
  DetailsViewBody,
  DetailsViewHeader,
  FieldView,
} from '@/components/adease';
import { deleteModule } from '@/server/modules/actions';
import { getModule } from '@/server/modules/actions';
import { notFound } from 'next/navigation';
import {
  Badge,
  Paper,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import AssessmentsTable from './AssessmentsTable';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ModuleDetails({ params }: Props) {
  const { id } = await params;
  const module = await getModule(Number(id));

  if (!module) {
    return notFound();
  }

  return (
    <DetailsView>
      <DetailsViewHeader
        title={`Module: ${module.code}`}
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
          <FieldView label='Module Code'>{module.code}</FieldView>
          <FieldView label='Module Name'>{module.name}</FieldView>
        </Stack>
      </Paper>

      <AssessmentsTable moduleId={module.id} />
    </DetailsView>
  );
}
