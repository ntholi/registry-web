import {
  DetailsView,
  DetailsViewHeader,
  FieldView,
  DetailsViewBody,
} from '@/components/adease';
import { notFound } from 'next/navigation';
import {
  getModule,
  deleteModule,
  getModulePrerequisites,
} from '@/server/modules/actions';
import Link from 'next/link';
import { Box } from '@mantine/core';

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
        <FieldView label='Code'>{item.code}</FieldView>
        <FieldView label='Name'>{item.name}</FieldView>
        <FieldView label='Type'>{item.type}</FieldView>
        <FieldView label='Credits'>{item.credits}</FieldView>

        {prerequisites.length === 0 && (
          <FieldView label='Prerequisites'>No prerequisites</FieldView>
        )}
        <Box>
          <ul className='list-disc pl-5'>
            {prerequisites.map((it) => (
              <li key={it.id}>
                <Link
                  href={`/admin/modules/${it.id}`}
                  className='text-blue-600 hover:text-blue-800'
                >
                  {it.code} - {it.name}
                </Link>
              </li>
            ))}
          </ul>
        </Box>
      </DetailsViewBody>
    </DetailsView>
  );
}
