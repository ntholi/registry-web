import {
  DetailsView,
  DetailsViewHeader,
  FieldView,
  DetailsViewBody,
} from '@/components/adease';
import { notFound } from 'next/navigation';
import { getModule, deleteModule } from '@/server/modules/actions';
import { getStructuresByModule } from '@/server/semester-modules/actions';
import {
  Anchor,
  Fieldset,
  List,
  ListItem,
  Text,
  ThemeIcon,
  Skeleton,
} from '@mantine/core';
import Link from 'next/link';
import { IconCircleCheck } from '@tabler/icons-react';
import { Suspense } from 'react';

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
        title={'Module'}
        queryKey={['modules']}
        handleDelete={async () => {
          'use server';
          await deleteModule(Number(id));
        }}
      />
      <DetailsViewBody>
        <FieldView label='ID'>{mod.id}</FieldView>
        <FieldView label='Code'>{mod.code}</FieldView>
        <FieldView label='Name'>{mod.name}</FieldView>
        <FieldView label='Status'>{mod.status}</FieldView>
        <Suspense fallback={<StructuresLoading />}>
          <StructuresSection moduleId={Number(id)} />
        </Suspense>
      </DetailsViewBody>
    </DetailsView>
  );
}

type StructuresSectionProps = { moduleId: number };

async function StructuresSection({ moduleId }: StructuresSectionProps) {
  const structures = await getStructuresByModule(moduleId);
  return (
    <Fieldset legend='Structures'>
      {structures.length === 0 ? (
        <Text size='sm'>Not referenced in any structure</Text>
      ) : (
        <List
          spacing='xs'
          size='sm'
          center
          icon={
            <ThemeIcon color='gray' variant='light' size={'sm'} radius='xl'>
              <IconCircleCheck />
            </ThemeIcon>
          }
        >
          {structures.map((s) => (
            <ListItem key={s.id}>
              <Anchor
                size='sm'
                component={Link}
                href={`/dashboard/schools/structures/${s.id}`}
              >
                {s.code}
              </Anchor>
            </ListItem>
          ))}
        </List>
      )}
    </Fieldset>
  );
}

function StructuresLoading() {
  return (
    <Fieldset legend='Structures'>
      <List
        spacing='xs'
        size='sm'
        center
        icon={
          <ThemeIcon color='gray' variant='light' size={'sm'} radius='xl'>
            <IconCircleCheck />
          </ThemeIcon>
        }
      >
        <ListItem>
          <Skeleton h={8} w={160} radius='xl' />
        </ListItem>
        <ListItem>
          <Skeleton h={8} w={140} radius='xl' />
        </ListItem>
        <ListItem>
          <Skeleton h={8} w={120} radius='xl' />
        </ListItem>
      </List>
    </Fieldset>
  );
}
