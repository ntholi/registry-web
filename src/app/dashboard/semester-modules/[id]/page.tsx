import {
  DetailsView,
  DetailsViewBody,
  DetailsViewHeader,
  FieldView,
} from '@/components/adease';
import {
  deleteModule,
  getModulePrerequisites,
  getSemesterModule,
} from '@/server/semester-modules/actions';
import {
  Anchor,
  Fieldset,
  List,
  ListItem,
  ThemeIcon,
  Text,
  SimpleGrid,
} from '@mantine/core';
import { IconCircleCheck } from '@tabler/icons-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ModuleDetails({ params }: Props) {
  const { id } = await params;
  const item = await getSemesterModule(Number(id));
  const prerequisites = await getModulePrerequisites(Number(id));

  if (!item) {
    return notFound();
  }

  return (
    <DetailsView>
      <DetailsViewHeader
        title={'Semester Module'}
        queryKey={['modules']}
        handleDelete={async () => {
          'use server';
          await deleteModule(Number(id));
        }}
      />
      <DetailsViewBody>
        <FieldView label='ID'>{item.id}</FieldView>
        <FieldView label='Module'>
          <Anchor
            size='sm'
            component={Link}
            href={`/dashboard/modules/${item.module?.id}`}
          >
            {item.module?.name} ({item.module?.code})
          </Anchor>
        </FieldView>
        <SimpleGrid cols={2}>
          <FieldView label='Type'>{item.type}</FieldView>
          <FieldView label='Credits'>{item.credits}</FieldView>
        </SimpleGrid>
        <FieldView label='Structure'>
          {item.semester?.structure ? (
            <Anchor
              size='sm'
              component={Link}
              href={`/dashboard/schools/structures/${item.semester.structure.id}`}
            >
              {item.semester.structure.code}
            </Anchor>
          ) : (
            <Text size='sm' c='dimmed'>
              Not linked
            </Text>
          )}
        </FieldView>

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
                    href={`/dashboard/semester-modules/${it.id}`}
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
