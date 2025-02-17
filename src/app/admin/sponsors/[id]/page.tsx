import {
  DetailsView,
  DetailsViewHeader,
  FieldView,
  DetailsViewBody,
} from '@/components/adease';
import { notFound } from 'next/navigation';
import { getSponsor, deleteSponsor } from '@/server/sponsors/actions';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function SponsorDetails({ params }: Props) {
  const { id } = await params;
  const sponsor = await getSponsor(Number(id));

  if (!sponsor) {
    return notFound();
  }

  return (
    <DetailsView>
      <DetailsViewHeader
        title={'Sponsor'}
        queryKey={['sponsors']}
        handleDelete={async () => {
          'use server';
          await deleteSponsor(Number(id));
        }}
      />
      <DetailsViewBody>
        <FieldView label='Name'>{sponsor.name}</FieldView>
      </DetailsViewBody>
    </DetailsView>
  );
}
