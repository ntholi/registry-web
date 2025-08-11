'use client';

import { Button } from '@mantine/core';
import { IconDownload } from '@tabler/icons-react';
import { useState } from 'react';
import * as XLSX from 'xlsx';
import { getAllSponsoredStudents } from '@/server/sponsors/actions';

interface Props {
  searchQuery: string;
  sponsorId: string | null;
  programId: string | null;
  confirmation: string | null;
  termId: string | null;
}

type ExportRow = {
  stdNo: number | string;
  name: string;
  program: string;
  sponsor: string;
  borrowerNo: string;
  bankName: string;
  accountNumber: string;
  confirmed: string;
};

type ProgramRef = { name?: string };
type StructureRef = { program?: ProgramRef | null };
type StudentProgramRef = { structure?: StructureRef | null };
type StudentRef = {
  stdNo?: number;
  name?: string;
  programs?: Array<StudentProgramRef> | null;
};
type SponsorRef = { name?: string };
type SponsoredStudentItem = {
  student?: StudentRef | null;
  sponsor?: SponsorRef | null;
  borrowerNo?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  confirmed?: boolean | null;
};
type AllSponsoredStudentsResponse = {
  items: SponsoredStudentItem[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
};

export default function DownloadButton({
  searchQuery,
  sponsorId,
  programId,
  confirmation,
  termId,
}: Props) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const allItems: SponsoredStudentItem[] = [];
      let page = 1;
      // Prime first page to know total pages
      const confirmedParam =
        confirmation === 'confirmed'
          ? true
          : confirmation === 'pending'
            ? false
            : undefined;
      const first: AllSponsoredStudentsResponse = await getAllSponsoredStudents(
        page,
        searchQuery,
        sponsorId || undefined,
        programId || undefined,
        confirmedParam,
        termId || undefined
      );
      allItems.push(...(first.items || []));
      const totalPages = first.totalPages || 1;
      for (page = 2; page <= totalPages; page += 1) {
        const next: AllSponsoredStudentsResponse =
          await getAllSponsoredStudents(
            page,
            searchQuery,
            sponsorId || undefined,
            programId || undefined,
            confirmedParam,
            termId || undefined
          );
        allItems.push(...(next.items || []));
      }

      const rows: ExportRow[] = allItems.map((s) => {
        const student = s.student;
        const program =
          student?.programs && student.programs.length > 0
            ? student.programs[0]?.structure?.program
            : undefined;
        return {
          stdNo: student?.stdNo ?? '',
          name: student?.name ?? '',
          program: program?.name ?? '',
          sponsor: s.sponsor?.name ?? '',
          borrowerNo: s.borrowerNo ?? '',
          bankName: s.bankName ?? '',
          accountNumber: s.accountNumber ?? '',
          confirmed: s.confirmed ? 'Confirmed' : 'Pending',
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sponsored Students');
      const filename = `sponsored-students-${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(workbook, filename);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Button
      leftSection={<IconDownload size={16} />}
      onClick={handleDownload}
      loading={downloading}
      variant='light'
    >
      Download
    </Button>
  );
}
