import type { Metadata } from 'next';
import DocumentAnalyzer from './_components/DocumentAnalyzer';

export const metadata: Metadata = {
	title: 'Document Analyzer | Registry',
};

export default function DocumentAnalyzerPage() {
	return <DocumentAnalyzer />;
}
