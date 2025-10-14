'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getStudentDocuments } from '@/server/documents/actions';
import { Stack, Button, Text, Paper, Box, SimpleGrid } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useSession } from 'next-auth/react';
import AddDocumentModal from './AddDocumentModal';
import DeleteDocumentModal from './DeleteDocumentModal';
import DocumentCard from './DocumentCard';

type DocumentsViewProps = {
  stdNo: number;
  isActive: boolean;
};

export default function DocumentsView({ stdNo, isActive }: DocumentsViewProps) {
  const { data: session } = useSession();
  const [addModalOpened, setAddModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{
    id: string;
    fileName: string;
  } | null>(null);

  const {
    data: documents,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['student-documents', stdNo],
    queryFn: () => getStudentDocuments(stdNo),
    enabled: isActive,
  });

  const canEdit =
    session?.user?.role === 'admin' || session?.user?.role === 'registry';

  const canView =
    session?.user?.role === 'admin' ||
    session?.user?.role === 'registry' ||
    session?.user?.role === 'finance' ||
    session?.user?.position === 'manager';

  if (!canView) {
    return (
      <Paper p='xl' withBorder>
        <Text c='dimmed'>You do not have permission to view documents.</Text>
      </Paper>
    );
  }

  function handleDelete(id: string, fileName: string) {
    setSelectedDocument({ id, fileName });
    setDeleteModalOpened(true);
  }

  return (
    <Stack gap='md'>
      {canEdit && (
        <Box>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setAddModalOpened(true)}
          >
            Add Document
          </Button>
        </Box>
      )}

      {isLoading ? (
        <Text c='dimmed'>Loading documents...</Text>
      ) : !documents || documents.length === 0 ? (
        <Paper p='xl' withBorder>
          <Text c='dimmed' ta='center'>
            No documents found for this student.
          </Text>
        </Paper>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing='md'>
          {documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              id={doc.id}
              fileName={doc.fileName}
              type={doc.type}
              createdAt={doc.createdAt}
              canEdit={canEdit}
              onDelete={handleDelete}
            />
          ))}
        </SimpleGrid>
      )}

      <AddDocumentModal
        opened={addModalOpened}
        onClose={() => setAddModalOpened(false)}
        stdNo={stdNo}
        onSuccess={() => {
          refetch();
          setAddModalOpened(false);
        }}
      />

      {selectedDocument && (
        <DeleteDocumentModal
          opened={deleteModalOpened}
          onClose={() => {
            setDeleteModalOpened(false);
            setSelectedDocument(null);
          }}
          document={selectedDocument}
          onSuccess={() => {
            refetch();
            setDeleteModalOpened(false);
            setSelectedDocument(null);
          }}
        />
      )}
    </Stack>
  );
}
