'use client';

import { useUserSchools } from '@/hooks/use-user-schools';
import {
  getProgramsBySchool,
  getSchools,
  getStructuresByProgram,
} from '@/server/semester-modules/actions';
import {
  Badge,
  Box,
  ComboboxItem,
  ComboboxLikeRenderOptionInput,
  Grid,
  Loader,
  Select,
  Stack,
  Text,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useQueryState } from 'nuqs';
import { useEffect, useState } from 'react';

interface FilterSelectProps {
  onStructureSelect: (structureId: number) => void;
}

interface SelectOption extends ComboboxItem {
  code: string;
  name: string;
}

interface ProgramWithStructure extends ComboboxItem {
  code: string;
  name: string;
  structureId: number;
  structureCode: string;
  isCurrentStructure: boolean;
}

export default function FilterSelect({ onStructureSelect }: FilterSelectProps) {
  const [school, setSchool] = useState<string | null>(null);
  const [structureId, setStructureId] = useQueryState('structure');
  const [programWithStructure, setProgramWithStructure] = useState<
    string | null
  >(null);
  const { userSchools, isLoading: isLoadingUserSchools } = useUserSchools();

  const { data: schools = [], isLoading: isLoadingSchools } = useQuery({
    queryKey: ['schools'],
    queryFn: async () => {
      const schoolData = await getSchools();
      return schoolData
        .filter((it) => !it.code.includes('UNUSED') && it.code !== 'UNC')
        .map((school) => ({
          value: school.id.toString(),
          label: school.name.replace('Faculty of', ''),
          code: school.code,
          name: school.name.replace('Faculty of', ''),
        }));
    },
  });

  const { data: programsWithStructures = [], isLoading: isLoadingPrograms } =
    useQuery({
      queryKey: ['programsWithStructures', school],
      queryFn: async () => {
        if (!school) return [];
        try {
          const programData = await getProgramsBySchool(parseInt(school));
          const programsWithStructures: ProgramWithStructure[] = [];

          for (const program of programData) {
            try {
              const structures = await getStructuresByProgram(program.id);
              structures.forEach((structure, index) => {
                const isCurrentStructure = index === 0;
                programsWithStructures.push({
                  value: `${program.id}-${structure.id}`,
                  label: `${program.code} (${structure.code})`,
                  code: program.code,
                  name: program.name,
                  structureId: structure.id,
                  structureCode: structure.code,
                  isCurrentStructure,
                });
              });
            } catch (error) {
              console.error(
                `Error fetching structures for program ${program.id}:`,
                error,
              );
            }
          }

          return programsWithStructures.sort((a, b) => {
            if (a.code !== b.code) {
              return a.code.localeCompare(b.code);
            }
            return b.isCurrentStructure ? 1 : -1;
          });
        } catch (error) {
          console.error('Error fetching programs:', error);
          return [];
        }
      },
      enabled: !!school,
      staleTime: 1000 * 60 * 5,
    });

  useEffect(() => {
    if (structureId) {
      onStructureSelect(parseInt(structureId));
      const matchingOption = programsWithStructures.find(
        (item) => item.structureId.toString() === structureId,
      );
      if (matchingOption) {
        setProgramWithStructure(matchingOption.value);
      }
    }
  }, [structureId, onStructureSelect, programsWithStructures]);

  useEffect(() => {
    if (programWithStructure && !structureId) {
      const [, extractedStructureId] = programWithStructure.split('-');
      if (extractedStructureId) {
        setStructureId(extractedStructureId);
      }
    }
  }, [programWithStructure, structureId, setStructureId]);

  useEffect(() => {
    if (
      !isLoadingSchools &&
      !isLoadingUserSchools &&
      !school &&
      userSchools.length > 0
    ) {
      const firstUserSchool = userSchools[0]?.school;
      if (firstUserSchool) {
        setSchool(firstUserSchool.id.toString());
      }
    }
  }, [userSchools, isLoadingUserSchools, isLoadingSchools, school]);

  const handleSchoolChange = (value: string | null) => {
    setSchool(value);
    setProgramWithStructure(null);
    setStructureId(null);
  };

  const handleProgramWithStructureChange = (value: string | null) => {
    setProgramWithStructure(value);
    if (value) {
      const [, extractedStructureId] = value.split('-');
      if (extractedStructureId) {
        setStructureId(extractedStructureId);
        onStructureSelect(parseInt(extractedStructureId));
      }
    } else {
      setStructureId(null);
    }
  };

  const RenderOption = ({
    option,
  }: {
    option: ComboboxLikeRenderOptionInput<ComboboxItem>['option'];
  }) => {
    const item = option as SelectOption | ProgramWithStructure;

    if ('structureId' in item) {
      const programStructure = item as ProgramWithStructure;

      return (
        <Box p='xs'>
          <Text size='sm' fw={500}>
            {programStructure.code}
          </Text>
          <Text size='xs' c='dimmed' mb={2}>
            {programStructure.name}
          </Text>
          <Badge
            variant='outline'
            radius={'xs'}
            size='xs'
            color={programStructure.isCurrentStructure ? 'blue' : 'gray'}
          >
            {programStructure.structureCode} •{' '}
            {programStructure.isCurrentStructure ? 'Current' : 'Old'}
          </Badge>
        </Box>
      );
    }

    const { code, name } = item as SelectOption;
    if (code === name) {
      return <Text size='sm'>{code}</Text>;
    }
    return (
      <Box p='xs'>
        <Text size='sm' fw={500}>
          {code}
        </Text>
        <Text size='xs' c='dimmed'>
          {name}
        </Text>
      </Box>
    );
  };

  return (
    <Stack gap='md'>
      <Grid>
        <Grid.Col span={6}>
          <Select
            label='School'
            data={schools}
            value={school}
            disabled={!schools || isLoadingUserSchools}
            onChange={handleSchoolChange}
            searchable
            clearable
            rightSection={
              isLoadingSchools || isLoadingUserSchools ? (
                <Loader size='xs' />
              ) : null
            }
            renderOption={(item) => <RenderOption option={item.option} />}
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <Select
            label='Program & Structure'
            data={programsWithStructures}
            value={programWithStructure}
            onChange={handleProgramWithStructureChange}
            searchable
            clearable
            disabled={!school || isLoadingPrograms}
            rightSection={isLoadingPrograms ? <Loader size='xs' /> : null}
            renderOption={(item) => <RenderOption option={item.option} />}
          />
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
