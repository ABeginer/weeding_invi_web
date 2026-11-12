"use client";

import * as React from "react";
import { Image as ImageIcon, Plus, Save, Trash2 } from "lucide-react";
import { ApiError, deleteWedding, updateWedding } from "@/lib/api";
import type { Wedding, WeddingContent, WeddingEvent } from "@/lib/types";
import { mergeWeddingContent } from "@/lib/wedding-content";
import { WEDDING_TEMPLATES } from "@/lib/wedding-slug";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Input, Textarea } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

interface WeddingContentEditorProps {
  wedding: Wedding;
  onUpdated: (wedding: Wedding) => void;
  onDeleted: () => void;
}

function toDateFieldValue(raw: string): string {
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : raw;
}

export function WeddingContentEditor({
  wedding,
  onUpdated,
  onDeleted,
}: WeddingContentEditorProps) {
  const { showToast } = useToast();
  const [templateId, setTemplateId] = React.useState(wedding.templateId);
  const [draft, setDraft] = React.useState<WeddingContent>(() =>
    mergeWeddingContent(wedding.content),
  );
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => {
    setTemplateId(wedding.templateId);
    setDraft(mergeWeddingContent(wedding.content));
  }, [wedding]);

  const updateEvent = (index: number, patch: Partial<WeddingEvent>) => {
    setDraft((prev) => ({
      ...prev,
      events: prev.events.map((evt, idx) => (idx === index ? { ...evt, ...patch } : evt)),
    }));
  };

  const handleAddEvent = () => {
    setDraft((prev) => ({
      ...prev,
      events: [
        ...prev.events,
        {
          title: "Tiệc Mừng Cưới",
          time: "18:00",
          date: toDateFieldValue(prev.date),
          lunarDate: "",
          venue: "",
          address: "",
          mapDirectionsUrl: "",
        },
      ],
    }));
  };

  const handleRemoveEvent = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      events: prev.events.filter((_, idx) => idx !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaving(true);
    try {
      const updated = await updateWedding(wedding.id, {
        templateId,
        content: draft,
      });
      onUpdated(updated);
      showToast("Đã lưu nội dung thiệp cưới", "success");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        window.location.assign("/auth/login");
        return;
      }
      setSaveError(
        err instanceof Error ? err.message : "Không thể lưu nội dung thiệp.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDeleteWedding = async () => {
    setDeleting(true);
    try {
      await deleteWedding(wedding.id);
      showToast("Đã xóa thiệp cưới", "success");
      setDeleteOpen(false);
      onDeleted();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setDeleteOpen(false);
        window.location.assign("/auth/login");
        return;
      }
      showToast(
        err instanceof Error ? err.message : "Không thể xóa thiệp cưới.",
        "error",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-fg">Nội dung &amp; thông tin tiệc</h2>
            <p className="text-xs text-fg-muted sm:text-sm">
              Chỉnh sửa thông tin cô dâu chú rể, hai bên gia đình, lịch tiệc và lời ngỏ.
            </p>
          </div>
          <Button type="submit" variant="primary" loading={saving}>
            <Save className="h-4 w-4" aria-hidden="true" />
            <span>Lưu thay đổi</span>
          </Button>
        </div>

        {saveError && (
          <div
            role="alert"
            className="rounded-xl border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-fg"
          >
            {saveError}
          </div>
        )}

        {/* Mẫu & thông tin chung */}
        <Card className="space-y-4 p-4 sm:p-6">
          <h3 className="text-base font-semibold text-fg">Thông tin chung</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="editor-template-id"
                className="block text-sm font-medium text-fg"
              >
                Mẫu giao diện
              </label>
              <select
                id="editor-template-id"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="flex h-11 w-full rounded-xl border border-border bg-surface px-3.5 py-2 text-sm text-fg focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {WEDDING_TEMPLATES.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Chữ lồng trên phong bì"
              value={draft.envelope.sealLabel}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  envelope: { ...prev.envelope, sealLabel: e.target.value },
                }))
              }
              placeholder="Ví dụ: A & B"
              maxLength={24}
            />

            <Input
              label="Ngày tổ chức chính (ISO hoặc YYYY-MM-DD)"
              value={draft.date}
              onChange={(e) => setDraft((prev) => ({ ...prev, date: e.target.value }))}
              placeholder="2027-01-01T10:00:00+07:00"
            />

            <Input
              label="Phụ đề trang mở đầu"
              value={draft.hero.subtitle}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  hero: { ...prev.hero, subtitle: e.target.value },
                }))
              }
            />
          </div>

          <Textarea
            label="Câu trích dẫn"
            rows={2}
            value={draft.quote}
            onChange={(e) => setDraft((prev) => ({ ...prev, quote: e.target.value }))}
          />

          <Textarea
            label="Lời mời trân trọng"
            rows={3}
            value={draft.invitationNote}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, invitationNote: e.target.value }))
            }
          />
        </Card>

        {/* Cô dâu & Chú rể */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="space-y-4 p-4 sm:p-6">
            <h3 className="text-base font-semibold text-fg">Chú rể &amp; Nhà trai</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Tên gọi ngắn (hiển thị Hero)"
                value={draft.groom.shortName}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    groom: { ...prev.groom, shortName: e.target.value },
                  }))
                }
              />
              <Input
                label="Họ và tên đầy đủ"
                value={draft.groom.fullName}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    groom: { ...prev.groom, fullName: e.target.value },
                  }))
                }
              />
            </div>
            <Input
              label="Phụ huynh nhà trai (ngăn cách bằng dấu &)"
              value={draft.families.groom.parents}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  groom: { ...prev.groom, parents: e.target.value },
                  families: {
                    ...prev.families,
                    groom: { ...prev.families.groom, parents: e.target.value },
                  },
                }))
              }
              placeholder="Ông Nguyễn Văn B & Bà Lê Thị C"
            />
            <Input
              label="Địa chỉ nhà trai"
              value={draft.families.groom.address}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  families: {
                    ...prev.families,
                    groom: { ...prev.families.groom, address: e.target.value },
                  },
                }))
              }
            />
          </Card>

          <Card className="space-y-4 p-4 sm:p-6">
            <h3 className="text-base font-semibold text-fg">Cô dâu &amp; Nhà gái</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Tên gọi ngắn (hiển thị Hero)"
                value={draft.bride.shortName}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    bride: { ...prev.bride, shortName: e.target.value },
                  }))
                }
              />
              <Input
                label="Họ và tên đầy đủ"
                value={draft.bride.fullName}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    bride: { ...prev.bride, fullName: e.target.value },
                  }))
                }
              />
            </div>
            <Input
              label="Phụ huynh nhà gái (ngăn cách bằng dấu &)"
              value={draft.families.bride.parents}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  bride: { ...prev.bride, parents: e.target.value },
                  families: {
                    ...prev.families,
                    bride: { ...prev.families.bride, parents: e.target.value },
                  },
                }))
              }
              placeholder="Ông Trần Văn D & Bà Phạm Thị E"
            />
            <Input
              label="Địa chỉ nhà gái"
              value={draft.families.bride.address}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  families: {
                    ...prev.families,
                    bride: { ...prev.families.bride, address: e.target.value },
                  },
                }))
              }
            />
          </Card>
        </div>

        {/* Các buổi lễ / tiệc */}
        <Card className="space-y-4 p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-fg">Thời gian &amp; địa điểm tiệc</h3>
              <p className="text-xs text-fg-muted">
                Sự kiện đầu tiên được dùng để tính đồng hồ đếm ngược trên thiệp.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleAddEvent}>
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Thêm sự kiện</span>
            </Button>
          </div>

          {draft.events.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-fg-muted">
              Chưa có sự kiện nào. Nhấn &ldquo;Thêm sự kiện&rdquo; để bổ sung thông tin buổi lễ.
            </p>
          ) : (
            <div className="space-y-4">
              {draft.events.map((evt, index) => (
                <div
                  key={index}
                  className="space-y-3 rounded-xl border border-border bg-bg/50 p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
                      Sự kiện #{index + 1}
                    </span>
                    {draft.events.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveEvent(index)}
                        className="text-danger-fg hover:bg-danger-bg"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Xóa</span>
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <Input
                      label="Tên buổi lễ"
                      value={evt.title}
                      onChange={(e) => updateEvent(index, { title: e.target.value })}
                      placeholder="Lễ Thành Hôn"
                    />
                    <Input
                      label="Giờ diễn ra"
                      value={evt.time}
                      onChange={(e) => updateEvent(index, { time: e.target.value })}
                      placeholder="10:00"
                    />
                    <Input
                      label="Ngày (YYYY-MM-DD hoặc DD.MM.YYYY)"
                      value={toDateFieldValue(evt.date)}
                      onChange={(e) => updateEvent(index, { date: e.target.value })}
                      placeholder="2027-01-01"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      label="Ngày âm lịch"
                      value={evt.lunarDate}
                      onChange={(e) => updateEvent(index, { lunarDate: e.target.value })}
                      placeholder="Ngày 24 tháng 11 năm Bính Ngọ"
                    />
                    <Input
                      label="Tên địa điểm / sảnh"
                      value={evt.venue}
                      onChange={(e) => updateEvent(index, { venue: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      label="Địa chỉ chi tiết"
                      value={evt.address}
                      onChange={(e) => updateEvent(index, { address: e.target.value })}
                    />
                    <Input
                      label="Link chỉ đường Google Maps"
                      value={evt.mapDirectionsUrl ?? ""}
                      onChange={(e) =>
                        updateEvent(index, { mapDirectionsUrl: e.target.value })
                      }
                      placeholder="https://maps.google.com/..."
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Lời cảm ơn & SEO */}
        <Card className="space-y-4 p-4 sm:p-6">
          <h3 className="text-base font-semibold text-fg">Lời cảm ơn &amp; chia sẻ link</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Tiêu đề chia sẻ (SEO / Zalo)"
              value={draft.seo.title}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  seo: { ...prev.seo, title: e.target.value },
                }))
              }
            />
            <Input
              label="Chữ ký cuối thiệp"
              value={draft.sections.footer.signature}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  sections: {
                    ...prev.sections,
                    footer: { ...prev.sections.footer, signature: e.target.value },
                  },
                }))
              }
              placeholder="Văn A ♥ Thị B · 01.01.2027"
            />
          </div>

          <Textarea
            label="Lời cảm ơn cuối trang"
            rows={2}
            value={draft.sections.footer.thankYouBody}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                sections: {
                  ...prev.sections,
                  footer: { ...prev.sections.footer, thankYouBody: e.target.value },
                },
              }))
            }
          />
        </Card>

        {/* Hình ảnh (Giai đoạn sau) */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-fg-muted">
              <ImageIcon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-fg">Album ảnh cưới</h3>
              <p className="mt-1 text-xs leading-relaxed text-fg-muted sm:text-sm">
                Hiện thiệp đang dùng bộ ảnh mặc định của mẫu. Tính năng tải và quản lý ảnh riêng (bảng <code className="rounded bg-surface-muted px-1 py-0.5 text-xs">photos</code>) sẽ được bổ sung ở giai đoạn tiếp theo.
              </p>
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" variant="primary" loading={saving}>
            <Save className="h-4 w-4" aria-hidden="true" />
            <span>Lưu thay đổi</span>
          </Button>
        </div>
      </form>

      {/* Vùng nguy hiểm: xóa thiệp */}
      <Card className="border-danger-border/80 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-danger-fg">Xóa thiệp cưới</h3>
            <p className="mt-0.5 text-xs text-fg-muted sm:text-sm">
              Thao tác này sẽ xóa vĩnh viễn thiệp <strong>/w/{wedding.slug}</strong> cùng toàn bộ khách mời và lời chúc liên quan.
            </p>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeleteOpen(true)}
            className="self-start sm:self-auto"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            <span>Xóa thiệp này</span>
          </Button>
        </div>
      </Card>

      <Dialog
        open={deleteOpen}
        onClose={() => !deleting && setDeleteOpen(false)}
        title="Xác nhận xóa thiệp cưới"
        description={`Bạn có chắc muốn xóa thiệp /w/${wedding.slug}? Toàn bộ dữ liệu khách mời và lời chúc sẽ bị mất và không thể khôi phục.`}
      >
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => setDeleteOpen(false)}
            disabled={deleting}
          >
            Hủy
          </Button>
          <Button
            variant="danger"
            loading={deleting}
            onClick={handleConfirmDeleteWedding}
          >
            Xác nhận xóa
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

