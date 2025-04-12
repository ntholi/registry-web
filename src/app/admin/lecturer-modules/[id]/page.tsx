import {
  DetailsView,
  DetailsViewHeader,
  DetailsViewBody,
  FieldView,
} from '@/components/adease';
import { notFound } from 'next/navigation';
import {
  getLecturesModule,
  deleteLecturesModule,
} from '@/server/lecturer-modules/actions';
import { getCurrentTerm } from '@/server/terms/actions';
import { Button, Card, Flex, Grid, GridCol, Stack, Title } from '@mantine/core';
import { IconNotebook } from '@tabler/icons-react';
import Link from 'next/link';
import AssessmentsManager from './assessments/AssessmentsManager';

type Props = {
  params: { id: string };
};

export default async function LecturesModuleDetails({ params }: Props) {
  const { id } = params;
  const lecturesModule = await getLecturesModule(Number(id));
  const currentTerm = await getCurrentTerm();

  if (!lecturesModule) {
    return notFound();
  }

  return (
    <DetailsView>
      <DetailsViewHeader
        title={'Manage Assessments'}
        queryKey={['lecturerModules']}
        handleDelete={async () => {
          'use server';
          await deleteLecturesModule(Number(id));
        }}
      />
      <DetailsViewBody>
        <Grid gutter='xl'>
          <GridCol span={12}>
            <FieldView label={lecturesModule.semesterModule.code}>
              {lecturesModule.semesterModule.name}
            </FieldView>
          </GridCol>

          <GridCol span={12}>
            <AssessmentsManager
              semesterModuleId={lecturesModule.semesterModuleId}
              lecturesModuleId={Number(id)}
            />
          </GridCol>
        </Grid>
      </DetailsViewBody>
    </DetailsView>
  );
}
