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
      </DetailsViewBody>
    </DetailsView>
  );
}
