"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import type { FeedPost, PostType } from "@/lib/mock/feed";
import { addPost, composerTypeConfig } from "@/lib/mock/feed";
import { children, slugify } from "@/lib/mock/children";

// Ícono "+" del recuadro "Agregar".
function PlusIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#C5503A"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

// Ícono "X" para quitar una miniatura.
function CloseIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

// Niños de la sala del maestro (SPEC 05): sala Sol del mock de children.ts.
const classroomChildren = children.filter((child) => child.classroom === "Sol");

const typeKeys = Object.keys(composerTypeConfig) as PostType[];

// Hora actual en formato HH:MM (24h).
function nowTime(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

// Primer nombre de un niño ("Mateo Fernández" → "Mateo").
function firstNameOf(childName: string): string {
  return childName.split(" ")[0];
}

// Compositor de publicación (SPEC 05), fiel a references/pantallas/crear-publicacion.dc.html.
export function CreatePost() {
  const router = useRouter();
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [type, setType] = useState<PostType | null>(null);
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  // Ref con las URLs de preview vigentes para revocarlas al desmontar.
  const photoUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    photoUrlsRef.current = photos;
  }, [photos]);

  // Libera las URLs de objeto creadas con URL.createObjectURL al desmontar.
  useEffect(() => {
    return () => {
      photoUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const hasRecipient = isAllSelected || selectedSlugs.length > 0;
  const canPublish = hasRecipient && description.trim().length > 0;

  function isChildSelected(slug: string): boolean {
    // En modo "Toda la sala" los chips individuales se ven desmarcados.
    return !isAllSelected && selectedSlugs.includes(slug);
  }

  // Marca/desmarca un niño. En modo "Toda la sala" sale del modo y selecciona solo ese niño.
  function toggleChild(slug: string) {
    if (isAllSelected) {
      setSelectedSlugs([slug]);
      setIsAllSelected(false);
      return;
    }
    const next = selectedSlugs.includes(slug)
      ? selectedSlugs.filter((current) => current !== slug)
      : [...selectedSlugs, slug];
    // Al seleccionar el último niño se activa "Toda la sala" y se desmarcan los chips.
    if (next.length === classroomChildren.length) {
      setSelectedSlugs([]);
      setIsAllSelected(true);
      return;
    }
    setSelectedSlugs(next);
  }

  // Toggle de "Toda la sala": activa si no está, desactiva (sin destinatarios) si ya está.
  function toggleAll() {
    if (isAllSelected) {
      setIsAllSelected(false);
      setSelectedSlugs([]);
    } else {
      setIsAllSelected(true);
      setSelectedSlugs([]);
    }
  }

  // Pinta las imágenes soltadas como miniaturas (solo preview, sin subir nada).
  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragOver(false);
    const files = Array.from(event.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/"),
    );
    if (files.length === 0) return;
    const urls = files.map((file) => URL.createObjectURL(file));
    setPhotos((current) => [...current, ...urls]);
  }

  // Quita una miniatura y libera su objeto URL.
  function removePhoto(url: string) {
    URL.revokeObjectURL(url);
    setPhotos((current) => current.filter((photo) => photo !== url));
  }

  // Construye el FeedPost y lo agrega al feed en memoria.
  function handlePublish() {
    if (!canPublish) return;
    const typeKey = type ?? "publicacion";
    const trimDescription = description.trim();
    const firstNames = selectedSlugs.map(
      (slug) => firstNameOf(children.find((child) => child.slug === slug)?.name ?? ""),
    );

    let authorName: string;
    let authorInitial: string | undefined;
    let avatarBg: string;
    let avatarColor: string;
    let audience: string;
    let id: string;

    if (selectedSlugs.length === 1 && !isAllSelected) {
      const child = children.find((current) => current.slug === selectedSlugs[0]);
      const firstName = firstNameOf(child?.name ?? "");
      authorName = firstName;
      authorInitial = child?.initial;
      avatarBg = child?.avatarBg ?? "#CCD8F4";
      avatarColor = child?.avatarColor ?? "#4E72C8";
      audience = `Para: familia de ${firstName}`;
      id = `${slugify(firstName)}-${typeKey}-${Date.now()}`;
    } else if (isAllSelected) {
      authorName = "Anuncio general";
      authorInitial = undefined;
      avatarBg = "#CCD8F4";
      avatarColor = "#4E72C8";
      audience = "Para: toda la sala";
      id = `${typeKey}-sala-${Date.now()}`;
    } else {
      authorName = "Anuncio general";
      authorInitial = undefined;
      avatarBg = "#CCD8F4";
      avatarColor = "#4E72C8";
      audience = `Para: familias de ${firstNames.slice(0, -1).join(", ")} y ${
        firstNames[firstNames.length - 1]
      }`;
      id = `${typeKey}-sala-${Date.now()}`;
    }

    const post: FeedPost = {
      id,
      type: type ?? "activity",
      authorName,
      authorInitial,
      avatarBg,
      avatarColor,
      time: nowTime(),
      publishedBy: "publicado por vos",
      audience,
      text: trimDescription,
      likes: 0,
      comments: 0,
      ...(photos.length > 0 ? { photo: { caption: `Foto · ${trimDescription}` } } : {}),
    };

    addPost(post);
    router.push("/");
  }

  return (
    <div className="flex min-h-screen items-start justify-center px-6 py-10">
      <div className="w-full max-w-[580px] overflow-hidden rounded-[24px] border border-[#ECE0D0] bg-[#FBF4EC] shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#ECE0D0] px-[26px] py-5">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-[15px] font-bold text-[#94887B]"
          >
            Cancelar
          </button>
          <span className="font-display text-[18px] font-semibold text-ink">
            Nueva publicación
          </span>
          <button
            type="button"
            onClick={handlePublish}
            disabled={!canPublish}
            className={`text-[15px] font-extrabold ${
              canPublish ? "text-accent" : "cursor-not-allowed opacity-40"
            }`}
          >
            Publicar
          </button>
        </div>

        {/* Cuerpo */}
        <div className="px-[26px] py-6">
          {/* PARA */}
          <div className="mb-[10px] text-[12px] font-extrabold uppercase tracking-[0.7px] text-[#94887B]">
            Para
          </div>
          <div className="mb-[22px] flex flex-wrap gap-[9px]">
            {classroomChildren.map((child) => (
              <button
                key={child.slug}
                type="button"
                onClick={() => toggleChild(child.slug)}
                className={`flex items-center gap-2 rounded-full border-[1.5px] py-[6px] pl-[6px] pr-[14px] text-[14px] font-bold transition-colors ${
                  isChildSelected(child.slug)
                    ? "border-ink bg-ink text-white"
                    : "border-[#ECE0D0] bg-surface text-[#6E6359]"
                }`}
              >
                <span
                  className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full font-display text-[13px] font-semibold"
                  style={{ background: child.avatarBg, color: child.avatarColor }}
                >
                  {child.initial}
                </span>
                {firstNameOf(child.name)}
              </button>
            ))}
            <button
              type="button"
              onClick={toggleAll}
              className={`rounded-full border-[1.5px] px-4 py-[6px] text-[14px] font-bold transition-colors ${
                isAllSelected
                  ? "border-ink bg-ink text-white"
                  : "border-[#ECE0D0] bg-surface text-[#6E6359]"
              }`}
            >
              Toda la sala
            </button>
          </div>

          {/* TIPO */}
          <div className="mb-[10px] text-[12px] font-extrabold uppercase tracking-[0.7px] text-[#94887B]">
            Tipo
          </div>
          <div className="mb-[22px] flex flex-wrap gap-[9px]">
            {typeKeys.map((key) => {
              const config = composerTypeConfig[key];
              const isActive = type === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setType(isActive ? null : key)}
                  className={`rounded-full border-2 px-4 py-2 text-[13.5px] font-extrabold transition-colors ${
                    isActive ? "border-ink" : "border-transparent"
                  }`}
                  style={{ background: config.bg, color: config.text }}
                >
                  {config.label}
                </button>
              );
            })}
          </div>

          {/* DESCRIPCIÓN */}
          <div className="mb-[10px] text-[12px] font-extrabold uppercase tracking-[0.7px] text-[#94887B]">
            Descripción
          </div>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Contá cómo le fue hoy…"
            aria-label="Descripción"
            className="mb-[22px] min-h-[120px] w-full resize-y rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[14px] text-[15px] leading-[1.5] text-ink outline-none placeholder:text-[#B6A99B] focus:border-primary"
          />

          {/* FOTOS */}
          <div className="mb-[10px] text-[12px] font-extrabold uppercase tracking-[0.7px] text-[#94887B]">
            Fotos
          </div>
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`flex flex-wrap gap-3 rounded-[14px] p-2 transition-colors ${
              isDragOver ? "bg-[#F4ECE1]" : ""
            }`}
          >
            {photos.map((url) => (
              <div key={url} className="relative h-[96px] w-[96px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt="Vista previa"
                  className="h-full w-full rounded-[14px] border border-[#ECE0D0] object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(url)}
                  aria-label="Quitar foto"
                  className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-white shadow"
                >
                  <CloseIcon />
                </button>
              </div>
            ))}
            <div className="flex h-[96px] w-[96px] flex-col items-center justify-center gap-[6px] rounded-[14px] border-[1.5px] border-dashed border-[#DBCDBA] bg-[#F4ECE1] text-[#B0A290]">
              <PlusIcon />
              <span className="text-[12px]">Agregar</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
