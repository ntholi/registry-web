'use client';

import {
  getProgramsBySchool,
  getSchools,
  getStructuresByProgram,
} from '@/server/semester-modules/actions';
import {
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
import { useEffect } from 'react';

interface FilterSelectProps {
  onStructureSelect: (structureId: number) => void;
}

interface SelectOption extends ComboboxItem {
  code: string;
  name: string;
}

export default function FilterSelect({ onStructureSelect }: FilterSelectProps) {
  const [school, setSchool] = useQueryState('school');
  const [program, setProgram] = useQueryState('program');
  const [structure, setStructure] = useQueryState('structure');

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

  const { data: programs = [], isLoading: isLoadingPrograms } = useQuery({
    queryKey: ['programs', school],
    queryFn: async () => {
      if (!school) return [];
      const programData = await getProgramsBySchool(parseInt(school));
      return programData.map((program) => ({
        value: program.id.toString(),
        label: program.code,
        code: program.code,
        name: program.name,
      }));
    },
    enabled: !!school,
  });

  const { data: structures = [], isLoading: isLoadingStructures } = useQuery({
    queryKey: ['structures', program],
    queryFn: async () => {
      if (!program) return [];
      const structureData = await getStructuresByProgram(parseInt(program));
      return structureData.map((structure, index) => ({
        id: structure.id,
        value: structure.id.toString(),
        label: structure.code,
        code: structure.code,
        name: index === 0 ? 'Current' : 'Old',
      }));
    },
    enabled: !!program,
  });

  useEffect(() => {
    if (structure && program) {
      onStructureSelect(parseInt(structure));
    }
  }, [structure, program, onStructureSelect]);

  const handleSchoolChange = (value: string | null) => {
    setSchool(value);
    setProgram(null);
    setStructure(null);
  };

  const handleProgramChange = (value: string | null) => {
    setProgram(value);
    setStructure(null);
  };

  const handleStructureChange = (value: string | null) => {
    setStructure(value);
    if (value) {
      onStructureSelect(parseInt(value));
    }
  };

  function renderOption(item: ComboboxLikeRenderOptionInput<ComboboxItem>) {
    const { code, name } = item.option as SelectOption;
    if (code === name) {
      return <Text size='sm'>{code}</Text>;
    }
    return (
      <Box>
        <Text size='sm'>{code}</Text>
        <Text size='0.85rem' c='dimmed'>
          {name}
        </Text>
      </Box>
    );
  }

  return (
    <Stack gap='md'>
      <Grid>
        <Grid.Col span={5}>
          <Select
            label='School'
            data={schools}
            value={school}
            disabled={!schools}
            onChange={handleSchoolChange}
            searchable
            clearable
            rightSection={isLoadingSchools ? <Loader size='xs' /> : null}
            renderOption={renderOption}
          />
        </Grid.Col>
        <Grid.Col span={5}>
          <Select
            label='Program'
            data={programs}
            value={program}
            onChange={handleProgramChange}
            searchable
            clearable
            disabled={!school || !programs}
            rightSection={isLoadingPrograms ? <Loader size='xs' /> : null}
            renderOption={renderOption}
          />
        </Grid.Col>
        <Grid.Col span={2}>
          <Select
            label='Structure'
            data={structures}
            value={structure}
            onChange={handleStructureChange}
            searchable
            clearable
            disabled={!program || !structures}
            rightSection={isLoadingStructures ? <Loader size='xs' /> : null}
            renderOption={renderOption}
          />
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
