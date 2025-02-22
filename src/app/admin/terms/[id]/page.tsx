import {
  DetailsView,
  DetailsViewHeader,
  FieldView,
  DetailsViewBody,
} from '@/components/adease';
import { notFound } from 'next/navigation';
import { getTerm, deleteTerm } from '@/server/terms/actions';
import { Badge } from '@mantine/core';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function TermDetails({ params }: Props) {
  const { id } = await params;
  const term = await getTerm(Number(id));

  if (!term) {
    return notFound();
  }

  return (
    <DetailsView>
      <DetailsViewHeader
        title={'Term'}
        queryKey={['terms']}
        handleDelete={async () => {
          'use server';
          await deleteTerm(Number(id));
        }}
      />
      <DetailsViewBody>
        <FieldView label='Name'>{term.name}</FieldView>
        <FieldView label='Semester'>{term.semester}</FieldView>
        <FieldView label='Is Active'>
          <Badge color={term.isActive ? 'green' : 'red'}>
            {term.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </FieldView>
      </DetailsViewBody>
    </DetailsView>
  );
}
