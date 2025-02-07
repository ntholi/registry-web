'use client';

import {
  getProgramsBySchool,
  getSchools,
  getStructuresByProgram,
} from '@/server/modules/actions';
import { Grid, Select, Stack, Loader } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useQueryState } from 'nuqs';
import { useState } from 'react';

interface FilterSelectProps {
  onStructureSelect: (structureId: number) => void;
}

export default function FilterSelect({ onStructureSelect }: FilterSelectProps) {
  const [school, setSchool] = useQueryState('school');
  const [program, setProgram] = useQueryState('program');
  const [structure, setStructure] = useState<string | null>('structure');

  const { data: schools = [], isLoading: isLoadingSchools } = useQuery({
    queryKey: ['schools'],
    queryFn: async () => {
      const schoolData = await getSchools();
      return schoolData.map((school) => ({
        value: school.id.toString(),
        label: `${school.code} - ${school.name}`,
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
        label: `${program.code} - ${program.name}`,
      }));
    },
    enabled: !!school,
  });

  const { data: structures = [], isLoading: isLoadingStructures } = useQuery({
    queryKey: ['structures', program],
    queryFn: async () => {
      if (!program) return [];
      const structureData = await getStructuresByProgram(parseInt(program));
      return structureData.map((structure) => ({
        value: structure.id.toString(),
        label: structure.code,
      }));
    },
    enabled: !!program,
  });

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

  return (
    <Stack gap='md'>
      <Grid>
        <Grid.Col span={5}>
          <Select
            label='School'
            data={schools}
            value={school}
            disabled={!school}
            onChange={handleSchoolChange}
            searchable
            clearable
            rightSection={isLoadingSchools ? <Loader size='xs' /> : null}
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
          />
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
