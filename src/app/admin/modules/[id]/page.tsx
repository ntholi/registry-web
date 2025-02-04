import {
  DetailsView,
  DetailsViewHeader,
  FieldView,
  DetailsViewBody,
} from '@/components/adease';
import { notFound } from 'next/navigation';
import { getModule, deleteModule } from '@/server/modules/actions';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ModuleDetails({ params }: Props) {
  const { id } = await params;
  const item = await getModule(Number(id));

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
      </DetailsViewBody>
    </DetailsView>
  );
}
