import {
  DetailsView,
  DetailsViewBody,
  DetailsViewHeader,
  FieldView,
} from '@/components/adease';
import {
  deleteLecturesModule,
  getLecturesModule,
} from '@/server/lecturer-modules/actions';
import { Grid, GridCol } from '@mantine/core';
import { notFound } from 'next/navigation';
import AssessmentsManager from './assessments/AssessmentsManager';

type Props = {
  params: { id: string };
};

export default async function LecturesModuleDetails({ params }: Props) {
  const { id } = params;
  const lecturesModule = await getLecturesModule(Number(id));

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
