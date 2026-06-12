'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Image from 'next/image';
import Modal from '@/components/Modal';
import type { AIChatWidgetResponse } from '@/types/ai-chat';
import { getImageUrl } from '@/types/common';
import { useLanguage } from '@/contexts/LanguageContext';

export interface EntityCarouselItem {
  id: number;
  name: string | null;
  image_url: string | null;
}

export interface EntityCarouselSelection {
  id: number;
  name: string | null;
}

const MAX_MULTI_SELECT = 5;

interface EntityCarouselProps<TItem extends EntityCarouselItem, TEntity> {
  items: TItem[];
  entityLabel: string;
  selectLabel: string;
  onSubmit: (response: AIChatWidgetResponse) => void;
  disabled?: boolean;
  fetchEntity: (id: number) => Promise<TEntity>;
  renderDetail: (entity: TEntity) => ReactNode;
  buildValue: (selections: EntityCarouselSelection[]) => AIChatWidgetResponse;
  testIdPrefix: string;
  // Opt-in multi-select mode (HotelCarousel only). When false/undefined the
  // single-select behavior is byte-for-byte unchanged.
  multiSelect?: boolean;
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
  multiSelect = false,
}: EntityCarouselProps<TItem, TEntity>) {
  const { t } = useLanguage();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [accumulated, setAccumulated] = useState<EntityCarouselSelection[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [activeName, setActiveName] = useState<string | null>(null);
  const [previewEntity, setPreviewEntity] = useState<TEntity | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const isModalOpen = activeId !== null;
  const isLocked = selectedId !== null;
  const atCap = accumulated.length >= MAX_MULTI_SELECT;

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
        setPreviewError(t('carousel.load_error').replace('{entity}', entityLabel.toLowerCase()));
        setPreviewLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeId, fetchEntity, entityLabel, t]);

  function isAccumulated(id: number) {
    return accumulated.some((s) => s.id === id);
  }

  function handleCardClick(item: { id: number; name: string | null }) {
    if (disabled || isLocked) return;
    if (multiSelect && isAccumulated(item.id)) return;
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
    const selections =
      multiSelect && accumulated.length > 0
        ? [...accumulated, { id: entityId, name }]
        : [{ id: entityId, name }];
    setSelectedId(entityId);
    closeModal();
    onSubmit(buildValue(selections));
  }

  function handleAddAnother() {
    if (activeId === null || atCap) return;
    if (!isAccumulated(activeId)) {
      setAccumulated((prev) => [...prev, { id: activeId, name: activeName }]);
    }
    closeModal();
  }

  function handleRemoveChip(id: number) {
    setAccumulated((prev) => prev.filter((s) => s.id !== id));
  }

  function handleSubmitAccumulated() {
    if (accumulated.length === 0 || isLocked) return;
    setSelectedId(accumulated[accumulated.length - 1].id);
    onSubmit(buildValue(accumulated));
  }

  if (items.length === 0) return null;

  return (
    <>
      <div className="mt-3 rounded-lg border border-gray-200 bg-white p-3">
        <p className="font-inter mb-3 text-xs text-gray-500">
          {t('carousel.select_prompt')
            .replace('{article}', /^[aeiou]/i.test(entityLabel) ? 'an' : 'a')
            .replace('{entity}', entityLabel.toLowerCase())}
        </p>
        {multiSelect && accumulated.length > 0 && (
          <div className="mb-3" data-testid={`${testIdPrefix}-chips`}>
            <p className="font-inter mb-2 text-[11px] font-medium tracking-wide text-gray-500 uppercase">
              {t('carousel.selected_count').replace('{count}', String(accumulated.length))}
            </p>
            <div className="flex flex-wrap gap-2">
              {accumulated.map((s) => (
                <span
                  key={s.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#1E3D2F]/10 py-1 pr-1 pl-3 text-xs font-medium text-[#1E3D2F]"
                  data-testid={`${testIdPrefix}-chip-${s.id}`}
                >
                  {s.name ?? `${entityLabel} ${s.id}`}
                  <button
                    type="button"
                    onClick={() => handleRemoveChip(s.id)}
                    disabled={isLocked}
                    aria-label={t('carousel.remove_selection').replace(
                      '{entity}',
                      s.name ?? `${entityLabel} ${s.id}`,
                    )}
                    className="flex h-4 w-4 items-center justify-center rounded-full text-[#1E3D2F] hover:bg-[#1E3D2F]/20 disabled:opacity-50"
                    data-testid={`${testIdPrefix}-chip-remove-${s.id}`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
            {!isLocked && (
              <button
                type="button"
                onClick={handleSubmitAccumulated}
                disabled={disabled}
                className="mt-3 rounded-full bg-[#1E3D2F] px-5 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                data-testid={`${testIdPrefix}-submit-selection`}
              >
                {t('carousel.submit_selection').replace('{count}', String(accumulated.length))}
              </button>
            )}
          </div>
        )}
        <div className="flex gap-3 overflow-x-auto pb-1">
          {items.map((item) => {
            const isSelected = selectedId === item.id;
            const isChosen = multiSelect && isAccumulated(item.id);
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => handleCardClick({ id: item.id, name: item.name })}
                disabled={disabled || isLocked || isChosen}
                className={`w-44 shrink-0 overflow-hidden rounded-lg border text-left transition-all disabled:opacity-60 ${
                  isSelected || isChosen
                    ? 'border-[#1E3D2F] ring-2 ring-[#1E3D2F]'
                    : 'border-gray-200'
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
        ariaLabel={activeName ?? t('carousel.preview_label').replace('{entity}', entityLabel)}
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
              {t('carousel.close')}
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
                {t('carousel.cancel')}
              </button>
              {multiSelect && (
                <button
                  type="button"
                  onClick={handleAddAnother}
                  disabled={atCap}
                  className="rounded-full border border-[#1E3D2F] px-6 py-2 text-[13px] font-semibold text-[#1E3D2F] hover:bg-[#1E3D2F]/5 disabled:opacity-50"
                  data-testid={`${testIdPrefix}-preview-add-another`}
                >
                  {atCap ? t('carousel.add_cap_reached') : t('carousel.add_another')}
                </button>
              )}
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
