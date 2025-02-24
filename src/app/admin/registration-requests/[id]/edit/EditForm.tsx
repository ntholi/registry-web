'use client';

import { Form } from '@/components/adease';
import { modules, registrationRequests } from '@/db/schema';
import { getModulesForStructure } from '@/server/modules/actions';
import { getRegistrationRequest } from '@/server/registration-requests/actions';
import { findAllTerms } from '@/server/terms/actions';
import {
  Autocomplete,
  Button,
  Grid,
  GridCol,
  Loader,
  Select,
  Stack,
  Table,
  Text,
  ThemeIcon,
} from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type RegistrationRequest = typeof registrationRequests.$inferInsert;
type Module = typeof modules.$inferSelect;

type Props = {
  onSubmit: (values: RegistrationRequest) => Promise<RegistrationRequest>;
  defaultValues?: NonNullable<
    Awaited<ReturnType<typeof getRegistrationRequest>>
  >;
  onSuccess?: (value: RegistrationRequest) => void;
  onError?: (
    error: Error | React.SyntheticEvent<HTMLDivElement, Event>,
  ) => void;
  title?: string;
  term: string;
};

type FormSubmission = {
  requestedModules: {
    moduleId: number;
    moduleStatus: 'Compulsory';
  }[];
} & typeof registrationRequests.$inferInsert;

export default function EditForm({ onSubmit, defaultValues, title }: Props) {
  const router = useRouter();
  const [selectedModules, setSelectedModules] = useState<Module[]>(
    defaultValues?.requestedModules?.map((rm) => rm.module) || [],
  );
  const [availableModules, setAvailableModules] = useState<Module[]>([]);

  const { data: terms, isLoading: isLoadingTerms } = useQuery({
    queryKey: ['terms'],
    queryFn: () => findAllTerms(1),
    select: (it) => it.data,
  });

  const { data: structureModules } = useQuery({
    queryKey: ['structureModules', defaultValues?.student.structureId],
    queryFn: () => {
      const structureId = defaultValues?.student.structureId;
      if (structureId) {
        return getModulesForStructure(structureId);
      }
      return Promise.resolve([]);
    },
    enabled: !!defaultValues?.student.structureId,
  });

  useEffect(() => {
    if (structureModules) {
      const modules = structureModules.flatMap((s) => s.modules);
      setAvailableModules(modules);
    }
  }, [structureModules]);

  const handleAddModule = (moduleCode: string) => {
    const mod = availableModules.find((it) => it.code === moduleCode);
    if (mod && !selectedModules.find((it) => it.id === mod.id)) {
      setSelectedModules([...selectedModules, mod]);
    }
  };

  const handleRemoveModule = (moduleId: number) => {
    setSelectedModules(selectedModules.filter((m) => m.id !== moduleId));
  };

  const semesterOptions = [
    { value: '1', label: 'Year 1 Sem 1' },
    { value: '2', label: 'Year 1 Sem 2' },
    { value: '3', label: 'Year 2 Sem 1' },
    { value: '4', label: 'Year 2 Sem 2' },
    { value: '5', label: 'Year 3 Sem 1' },
    { value: '6', label: 'Year 3 Sem 2' },
    { value: '7', label: 'Year 4 Sem 1' },
    { value: '8', label: 'Year 4 Sem 2' },
  ];

  return (
    <Form
      title={title}
      action={async (values) => {
        const result = await onSubmit({
          ...values,
          termId: Number(values.termId),
          semesterNumber: Number(values.semesterNumber),
          requestedModules: selectedModules.map((m) => ({
            moduleId: m.id,
            moduleStatus: 'Compulsory' as const,
          })),
        } as FormSubmission);
        return result;
      }}
      queryKey={['registrationRequests']}
      schema={createInsertSchema(registrationRequests)}
      defaultValues={{
        ...defaultValues,
        termId: defaultValues?.termId?.toString(),
        semesterNumber: defaultValues?.semesterNumber?.toString(),
      }}
      onSuccess={({ id }) => {
        router.push(`/admin/registration-requests/${id}`);
      }}
    >
      {(form) => (
        <Stack>
          <Select
            label='Term'
            data={
              terms?.map((term) => ({
                value: term.id.toString(),
                label: term.name,
              })) || []
            }
            required
            disabled={isLoadingTerms}
            rightSection={isLoadingTerms ? <Loader size='xs' /> : undefined}
            {...form.getInputProps('termId')}
          />
          <Select
            label='Semester'
            data={semesterOptions}
            required
            {...form.getInputProps('semesterNumber')}
          />

          <Stack>
            <Text fw={500}>Modules</Text>
            <Grid>
              <GridCol span={7}>
                <Autocomplete
                  label='Add Module'
                  placeholder='Search modules'
                  data={availableModules.map((m) => ({
                    value: m.code,
                    label: `${m.code} - ${m.name}`,
                  }))}
                  onChange={handleAddModule}
                />
              </GridCol>
              <GridCol span={5}>
                <Button
                  leftSection={<IconPlus size={16} />}
                  variant='light'
                  mt={25}
                >
                  Add
                </Button>
              </GridCol>
            </Grid>

            <Table withTableBorder withColumnBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Code</Table.Th>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Credits</Table.Th>
                  <Table.Th>Action</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {selectedModules.map((m) => (
                  <Table.Tr key={m.id}>
                    <Table.Td>{m.code}</Table.Td>
                    <Table.Td>{m.name}</Table.Td>
                    <Table.Td>{m.type}</Table.Td>
                    <Table.Td>{m.credits}</Table.Td>
                    <Table.Td>
                      <ThemeIcon
                        color='red'
                        variant='light'
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleRemoveModule(m.id)}
                      >
                        <IconTrash size={16} />
                      </ThemeIcon>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Stack>
        </Stack>
      )}
    </Form>
  );
}
