import {
  DetailsView,
  DetailsViewHeader,
  FieldView,
  DetailsViewBody,
} from '@/components/adease';
import { notFound } from 'next/navigation';
import { getSponsor, deleteSponsor } from '@/server/sponsors/actions';
import { Tabs, TabsList, TabsPanel, TabsTab } from '@mantine/core';
import StudentsTable from './students/StudentsTable';

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
      <Tabs defaultValue={'info'}>
        <TabsList>
          <TabsTab value='info'>Info</TabsTab>
          <TabsTab value='students'>Students</TabsTab>
        </TabsList>

        <TabsPanel value='info'>
          <DetailsViewBody>
            <FieldView label='Name'>{sponsor.name}</FieldView>
          </DetailsViewBody>
        </TabsPanel>

        <TabsPanel value='students'>
          <StudentsTable sponsorId={sponsor.id.toString()} />
        </TabsPanel>
      </Tabs>
    </DetailsView>
  );
}
