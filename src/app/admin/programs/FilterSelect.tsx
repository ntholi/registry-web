'use client';

import {
  getProgramsBySchool,
  getSchools,
  getStructuresByProgram,
} from '@/server/modules/actions';
import { Grid, Select, Stack, Loader } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

interface FilterSelectProps {
  onStructureSelect: (structureId: number) => void;
}

export default function FilterSelect({ onStructureSelect }: FilterSelectProps) {
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [selectedStructure, setSelectedStructure] = useState<string | null>(
    null
  );

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
    queryKey: ['programs', selectedSchool],
    queryFn: async () => {
      if (!selectedSchool) return [];
      const programData = await getProgramsBySchool(parseInt(selectedSchool));
      return programData.map((program) => ({
        value: program.id.toString(),
        label: `${program.code} - ${program.name}`,
      }));
    },
    enabled: !!selectedSchool,
  });

  const { data: structures = [], isLoading: isLoadingStructures } = useQuery({
    queryKey: ['structures', selectedProgram],
    queryFn: async () => {
      if (!selectedProgram) return [];
      const structureData = await getStructuresByProgram(
        parseInt(selectedProgram)
      );
      return structureData.map((structure) => ({
        value: structure.id.toString(),
        label: structure.code,
      }));
    },
    enabled: !!selectedProgram,
  });

  const handleSchoolChange = (value: string | null) => {
    setSelectedSchool(value);
    setSelectedProgram(null);
    setSelectedStructure(null);
  };

  const handleProgramChange = (value: string | null) => {
    setSelectedProgram(value);
    setSelectedStructure(null);
  };

  const handleStructureChange = (value: string | null) => {
    setSelectedStructure(value);
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
            value={selectedSchool}
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
            value={selectedProgram}
            onChange={handleProgramChange}
            searchable
            clearable
            disabled={!selectedSchool}
            rightSection={isLoadingPrograms ? <Loader size='xs' /> : null}
          />
        </Grid.Col>
        <Grid.Col span={2}>
          <Select
            label='Structure'
            data={structures}
            value={selectedStructure}
            onChange={handleStructureChange}
            searchable
            clearable
            disabled={!selectedProgram}
            rightSection={isLoadingStructures ? <Loader size='xs' /> : null}
          />
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
