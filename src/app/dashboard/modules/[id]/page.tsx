import {
  DetailsView,
  DetailsViewBody,
  DetailsViewHeader,
  FieldView,
} from '@/components/adease';
import { deleteModule, getModule } from '@/server/modules/actions';
import { getStructuresByModule } from '@/server/semester-modules/actions';
import {
  Anchor,
  Box,
  Skeleton,
  Table,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
  Text,
} from '@mantine/core';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

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
        <Suspense fallback={<StructuresLoading />}>
          <StructuresSection moduleId={Number(id)} />
        </Suspense>
      </DetailsViewBody>
    </DetailsView>
  );
}

type StructuresSectionProps = { moduleId: number };

async function StructuresSection({ moduleId }: StructuresSectionProps) {
  const structures = await getStructuresByModule(moduleId);
  return (
    <Box mt='md'>
      {structures.length === 0 ? (
        <Text size='sm'>Not referenced in any structure</Text>
      ) : (
        <Table striped highlightOnHover withTableBorder withColumnBorders>
          <TableThead>
            <TableTr>
              <TableTh>Program</TableTh>
              <TableTh>Structure</TableTh>
            </TableTr>
          </TableThead>
          <TableTbody>
            {structures.map((s) => (
              <TableTr key={s.id}>
                <TableTd>{s.programName}</TableTd>
                <TableTd>
                  <Anchor
                    size='sm'
                    component={Link}
                    href={`/dashboard/schools/structures/${s.id}`}
                  >
                    {s.code}
                  </Anchor>
                </TableTd>
              </TableTr>
            ))}
          </TableTbody>
        </Table>
      )}
    </Box>
  );
}

function StructuresLoading() {
  return (
    <Box mt='md'>
      <Table striped withTableBorder withColumnBorders>
        <TableThead>
          <TableTr>
            <TableTh>Program</TableTh>
            <TableTh>Structure</TableTh>
          </TableTr>
        </TableThead>
        <TableTbody>
          <TableTr>
            <TableTd>
              <Skeleton h={10} w={220} radius='xl' />
            </TableTd>
            <TableTd>
              <Skeleton h={10} w={120} radius='xl' />
            </TableTd>
          </TableTr>
          <TableTr>
            <TableTd>
              <Skeleton h={10} w={200} radius='xl' />
            </TableTd>
            <TableTd>
              <Skeleton h={10} w={100} radius='xl' />
            </TableTd>
          </TableTr>
        </TableTbody>
      </Table>
    </Box>
  );
}
