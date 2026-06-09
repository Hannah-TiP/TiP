'use client';

import { useState } from 'react';
import { resolveS3Url } from '@/types/common';
import { useLanguage } from '@/contexts/LanguageContext';
import type { TripDocument } from '@/types/trip';

interface BookingDocumentsProps {
  documents: TripDocument[];
  headingLevel?: 'h2' | 'h3';
}

export default function BookingDocuments({
  documents,
  headingLevel = 'h2',
}: BookingDocumentsProps) {
  const { t } = useLanguage();
  const [openIndexes, setOpenIndexes] = useState<Record<number, boolean>>({});

  if (documents.length === 0) return null;

  const toggle = (index: number) => {
    setOpenIndexes((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const download = async (url: string, fileName: string) => {
    const res = await fetch(url);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  };

  const Heading = headingLevel;
  const headingClass =
    headingLevel === 'h2'
      ? 'text-xl font-bold text-gray-900 mb-3'
      : 'font-semibold text-gray-900 mb-3';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <Heading className={headingClass}>{t('trip_detail.booking_documents')}</Heading>
      <div className="space-y-3">
        {documents.map((document, index) => {
          const url = resolveS3Url(document.file);
          const fileName =
            document.file_name ||
            document.document_type ||
            t('trip_detail.document_fallback').replace('{n}', String(index + 1));
          const isOpen = !!openIndexes[index];

          return (
            <div key={`${document.file}-${index}`}>
              <div className="flex items-center gap-3">
                <span>📄</span>
                <span className="flex-1 truncate text-sm text-gray-900">{fileName}</span>
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  className="text-sm text-[#1E3D2F] hover:underline"
                >
                  {isOpen ? t('trip_detail.document_close') : t('trip_detail.document_view')}
                </button>
                <button
                  type="button"
                  onClick={() => download(url, fileName)}
                  className="text-sm text-[#1E3D2F] hover:underline"
                >
                  {t('trip_detail.document_download')}
                </button>
              </div>
              {isOpen && (
                <iframe
                  src={url}
                  title={fileName}
                  className="mt-2 h-[600px] w-full rounded-lg border border-gray-200"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
