import { useState } from 'react';
import { Upload, Trash2 } from 'lucide-react';
import { api, useApp } from '../lib/api';
import type { MediaItem } from '../data/demoData';
export async function uploadFile(file: File) {
  if (file.size > 8 * 1024 * 1024) throw new Error('Файл должен быть не больше 8 МБ.');
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(new Error('Не удалось прочитать файл.'));
    reader.readAsDataURL(file);
  });
  return api<{ id: string; url: string; type: MediaItem['type']; title: string }>(
    '/uploads',
    'POST',
    { name: file.name.slice(0, 120), mime: file.type, base64 },
  );
}
export function ImageField({
  label,
  value,
  onChange,
  onUploadState,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onUploadState?: (busy: boolean) => void;
}) {
  const { notice } = useApp();
  const [busy, setBusy] = useState(false);
  return (
    <div className="image-field">
      <label>
        {label}
        <input
          type="url"
          value={value.startsWith('/uploads/') ? '' : value}
          placeholder={
            value.startsWith('/uploads/') ? 'Файл загружен' : 'https://… или загрузите файл'
          }
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
      {value && <img src={value} alt={label} className="image-preview" />}
      <label className={`ghost-btn upload-label ${busy ? 'disabled' : ''}`}>
        <Upload size={16} />
        {busy ? 'Загрузка…' : 'Загрузить изображение'}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (!file) return;
            setBusy(true);
            onUploadState?.(true);
            try {
              onChange((await uploadFile(file)).url);
            } catch (e) {
              notice((e as Error).message, true);
            } finally {
              setBusy(false);
              onUploadState?.(false);
            }
          }}
        />
      </label>
      {value && (
        <button type="button" className="link-btn" onClick={() => onChange('')}>
          Убрать изображение
        </button>
      )}
    </div>
  );
}
export function MediaEditor({
  items,
  onChange,
  onUploadState,
}: {
  items: MediaItem[];
  onChange: (items: MediaItem[]) => void;
  onUploadState?: (busy: boolean) => void;
}) {
  const { notice } = useApp();
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<MediaItem['type']>('audio');
  const add = (item: MediaItem) => {
    if (items.length >= 12) {
      notice('Можно добавить до 12 работ.', true);
      return;
    }
    onChange([...items, item]);
  };
  return (
    <section className="media-editor">
      <h2>Портфолио</h2>
      <p className="muted">
        До 12 работ. Файлы до 8 МБ: JPEG, PNG, WebP, MP3, WAV, OGG, MP4, WebM. После добавления
        сохраните профиль или группу.
      </p>
      {items.map((m, i) => (
        <div className="media-edit-row" key={m.id}>
          <label>
            Название работы
            <input
              value={m.title}
              maxLength={120}
              onChange={(e) =>
                onChange(items.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))
              }
            />
          </label>
          <span className="tag">{m.type}</span>
          <a className="link-btn" href={m.url} target="_blank" rel="noopener noreferrer">
            Проверить ↗
          </a>
          <button
            className="icon-btn danger"
            type="button"
            aria-label={`Удалить ${m.title}`}
            onClick={() => onChange(items.filter((_, j) => j !== i))}
          >
            <Trash2 size={17} />
          </button>
        </div>
      ))}
      <label className="ghost-btn upload-label">
        <Upload size={16} />
        {busy ? 'Загрузка…' : 'Загрузить работу'}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,audio/mpeg,audio/wav,audio/ogg,video/mp4,video/webm"
          disabled={busy || items.length >= 12}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (!file) return;
            setBusy(true);
            onUploadState?.(true);
            try {
              const result = await uploadFile(file);
              add({ ...result, description: '' });
            } catch (e) {
              notice((e as Error).message, true);
            } finally {
              setBusy(false);
              onUploadState?.(false);
            }
          }}
        />
      </label>
      <div className="media-url-grid">
        <label>
          Название по ссылке
          <input
            value={title}
            maxLength={120}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Название работы"
          />
        </label>
        <label>
          Тип
          <select value={type} onChange={(e) => setType(e.target.value as MediaItem['type'])}>
            <option value="audio">Аудио</option>
            <option value="video">Видео</option>
            <option value="image">Изображение</option>
          </select>
        </label>
        <label>
          Прямая ссылка
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…/track.mp3"
          />
        </label>
        <button
          type="button"
          className="ghost-btn"
          disabled={busy || !title.trim() || !url.trim()}
          onClick={() => {
            try {
              const parsed = new URL(url);
              if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
              add({
                id: crypto.randomUUID(),
                title: title.trim(),
                type,
                url: parsed.href,
                description: '',
              });
              setTitle('');
              setUrl('');
            } catch {
              notice('Укажите прямую ссылку http или https.', true);
            }
          }}
        >
          Добавить ссылку
        </button>
      </div>
    </section>
  );
}
