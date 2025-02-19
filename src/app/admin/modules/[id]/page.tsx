import {
  DetailsView,
  DetailsViewBody,
  DetailsViewHeader,
  FieldView,
} from '@/components/adease';
import {
  deleteModule,
  getModule,
  getModulePrerequisites,
} from '@/server/modules/actions';
import {
  Anchor,
  Fieldset,
  List,
  ListItem,
  ThemeIcon,
  Text,
} from '@mantine/core';
import { IconCircleCheck } from '@tabler/icons-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ModuleDetails({ params }: Props) {
  const { id } = await params;
  const item = await getModule(Number(id));
  const prerequisites = await getModulePrerequisites(Number(id));

  if (!item) {
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
        <FieldView label='ID'>{item.id}</FieldView>
        <FieldView label='Code'>{item.code}</FieldView>
        <FieldView label='Name'>{item.name}</FieldView>
        <FieldView label='Type'>{item.type}</FieldView>
        <FieldView label='Credits'>{item.credits}</FieldView>

        <Fieldset legend='Prerequisites'>
          {prerequisites.length === 0 ? (
            <Text size='sm'>No Prerequisites</Text>
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
              {prerequisites.map((it) => (
                <ListItem key={it.id}>
                  <Anchor
                    size='sm'
                    component={Link}
                    href={`/admin/modules/${it.id}`}
                  >
                    {it.code} - {it.name}
                  </Anchor>
                </ListItem>
              ))}
            </List>
          )}
        </Fieldset>
      </DetailsViewBody>
    </DetailsView>
  );
}
