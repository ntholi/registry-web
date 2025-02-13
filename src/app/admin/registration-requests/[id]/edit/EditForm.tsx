'use client';

import { Form } from '@/components/adease';
import { modules, registrationRequests } from '@/db/schema';
import { getModulesForStructure } from '@/server/modules/actions';
import { getRegistrationRequest } from '@/server/registration-requests/actions';
import { findAllTerms, getCurrentTerm } from '@/server/terms/actions';
import {
  Autocomplete,
  Button,
  Grid,
  GridCol,
  Group,
  NumberInput,
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

export default function EditForm({ onSubmit, defaultValues, title }: Props) {
  const router = useRouter();
  const [selectedModules, setSelectedModules] = useState<Module[]>(
    defaultValues?.requestedModules?.map((rm) => rm.module) || [],
  );
  const [availableModules, setAvailableModules] = useState<Module[]>([]);

  const { data: terms } = useQuery({
    queryKey: ['terms'],
    queryFn: () => findAllTerms(1),
    select: (it) => it.data,
  });

  const { data: structureModules } = useQuery({
    queryKey: ['structureModules', defaultValues?.student.structureId],
    queryFn: () => getModulesForStructure(defaultValues?.student.structureId!),
    enabled: !!defaultValues?.student.structureId,
  });

  useEffect(() => {
    if (structureModules) {
      const modules = structureModules.flatMap((semester) =>
        semester.semesterModules.map((sm) => sm.module),
      );
      setAvailableModules(modules);
    }
  }, [structureModules]);

  const handleAddModule = (moduleCode: string) => {
    const module = availableModules.find((m) => m.code === moduleCode);
    if (module && !selectedModules.find((m) => m.id === module.id)) {
      setSelectedModules([...selectedModules, module]);
    }
  };

  const handleRemoveModule = (moduleId: number) => {
    setSelectedModules(selectedModules.filter((m) => m.id !== moduleId));
  };

  return (
    <Form
      title={title}
      action={async (values) => {
        const result = await onSubmit({
          ...values,
          requestedModules: selectedModules.map((module) => ({
            moduleId: module.id,
            moduleStatus: 'Compulsory' as const,
          })),
        });
        return result;
      }}
      queryKey={['registrationRequests']}
      schema={createInsertSchema(registrationRequests)}
      defaultValues={defaultValues}
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
            {...form.getInputProps('termId')}
          />
          <NumberInput
            label='Semester Number'
            min={1}
            max={8}
            {...form.getInputProps('semesterNumber')}
          />

          <Stack>
            <Text fw={500}>Modules</Text>
            <Grid>
              <GridCol span={7}>
                <Autocomplete
                  label='Add Module'
                  placeholder='Search modules'
                  data={availableModules.map((module) => ({
                    value: module.code,
                    label: `${module.code} - ${module.name}`,
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
                {selectedModules.map((module) => (
                  <Table.Tr key={module.id}>
                    <Table.Td>{module.code}</Table.Td>
                    <Table.Td>{module.name}</Table.Td>
                    <Table.Td>{module.type}</Table.Td>
                    <Table.Td>{module.credits}</Table.Td>
                    <Table.Td>
                      <ThemeIcon
                        color='red'
                        variant='light'
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleRemoveModule(module.id)}
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
