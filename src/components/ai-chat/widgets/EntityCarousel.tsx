'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Image from 'next/image';
import Modal from '@/components/Modal';
import type { AIChatWidgetResponse } from '@/types/ai-chat';
import { getImageUrl } from '@/types/common';

export interface EntityCarouselItem {
  id: number;
  name: string | null;
  image_url: string | null;
}

interface EntityCarouselProps<TItem extends EntityCarouselItem, TEntity> {
  items: TItem[];
  entityLabel: string;
  selectLabel: string;
  onSubmit: (response: AIChatWidgetResponse) => void;
  disabled?: boolean;
  fetchEntity: (id: number) => Promise<TEntity>;
  renderDetail: (entity: TEntity) => ReactNode;
  buildValue: (id: number, name: string | null) => AIChatWidgetResponse;
  testIdPrefix: string;
}

export default function EntityCarousel<TItem extends EntityCarouselItem, TEntity>({
  items,
  entityLabel,
  selectLabel,
  onSubmit,
  disabled,
  fetchEntity,
  renderDetail,
  buildValue,
  testIdPrefix,
}: EntityCarouselProps<TItem, TEntity>) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [activeName, setActiveName] = useState<string | null>(null);
  const [previewEntity, setPreviewEntity] = useState<TEntity | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const isModalOpen = activeId !== null;

  useEffect(() => {
    if (activeId === null) return;
    let cancelled = false;

    fetchEntity(activeId)
      .then((entity) => {
        if (cancelled) return;
        setPreviewEntity(entity);
        setPreviewLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setPreviewError(`Could not load ${entityLabel.toLowerCase()} details. Please try again.`);
        setPreviewLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeId, fetchEntity, entityLabel]);

  function handleCardClick(item: { id: number; name: string | null }) {
    if (disabled || selectedId !== null) return;
    setPreviewEntity(null);
    setPreviewError(null);
    setPreviewLoading(true);
    setActiveId(item.id);
    setActiveName(item.name);
  }

  function closeModal() {
    setActiveId(null);
    setActiveName(null);
    setPreviewEntity(null);
    setPreviewError(null);
    setPreviewLoading(false);
  }

  function handleConfirm() {
    if (activeId === null) return;
    const entityId = activeId;
    const name = activeName;
    setSelectedId(entityId);
    closeModal();
    onSubmit(buildValue(entityId, name));
  }

  if (items.length === 0) return null;

  return (
    <>
      <div className="mt-3 rounded-lg border border-gray-200 bg-white p-3">
        <p className="font-inter mb-3 text-xs text-gray-500">
          Select {/^[aeiou]/i.test(entityLabel) ? 'an' : 'a'} {entityLabel.toLowerCase()}
        </p>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {items.map((item) => {
            const isSelected = selectedId === item.id;
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => handleCardClick({ id: item.id, name: item.name })}
                disabled={disabled || selectedId !== null}
                className={`w-44 shrink-0 overflow-hidden rounded-lg border text-left transition-all disabled:opacity-60 ${
                  isSelected ? 'border-[#1E3D2F] ring-2 ring-[#1E3D2F]' : 'border-gray-200'
                }`}
                data-testid={`${testIdPrefix}-card-${item.id}`}
              >
                <div className="relative h-24 w-full bg-gray-100">
                  {item.image_url && (
                    <Image
                      src={getImageUrl(item.image_url)}
                      alt={item.name ?? `${entityLabel} ${item.id}`}
                      fill
                      sizes="176px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="p-2">
                  <p className="font-inter line-clamp-2 text-xs font-medium text-[#1E3D2F]">
                    {item.name ?? `${entityLabel} ${item.id}`}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        ariaLabel={activeName ?? `${entityLabel} preview`}
      >
        {previewLoading && (
          <div
            className="flex items-center justify-center py-32"
            data-testid={`${testIdPrefix}-preview-loading`}
          >
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#1E3D2F] border-t-transparent"></div>
          </div>
        )}

        {!previewLoading && previewError && (
          <div
            className="flex flex-col items-center justify-center gap-4 px-6 py-24 text-center"
            data-testid={`${testIdPrefix}-preview-error`}
          >
            <p className="font-inter text-sm text-gray-600">{previewError}</p>
            <button
              type="button"
              onClick={closeModal}
              className="rounded-full bg-[#1E3D2F] px-6 py-2 text-[13px] font-semibold text-white hover:opacity-90"
            >
              Close
            </button>
          </div>
        )}

        {!previewLoading && !previewError && previewEntity && (
          <>
            {renderDetail(previewEntity)}
            <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 border-t border-gray-200 bg-white px-6 py-4">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-gray-300 px-6 py-2 text-[13px] font-semibold text-gray-700 hover:bg-gray-50"
                data-testid={`${testIdPrefix}-preview-cancel`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="rounded-full bg-[#1E3D2F] px-6 py-2 text-[13px] font-semibold text-white hover:opacity-90"
                data-testid={`${testIdPrefix}-preview-confirm`}
              >
                {selectLabel}
              </button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
