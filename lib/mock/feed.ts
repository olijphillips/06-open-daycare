// Mock data del feed de la guardería.
// Fuente: references/pantallas/feed.dc.html (mockup de la home).
// Tipos e identificadores en inglés; slugs de id y contenido visible en español.

// Tipos de publicación del feed (SPEC 01) + tipos del compositor (SPEC 05).
export type PostType =
  | "meal" // Comida
  | "nap" // Siesta
  | "activity" // Actividad
  | "achievement" // Logro
  | "mood" // Ánimo
  | "photo" // Foto
  | "announcement"; // Anuncio

export interface FeedPost {
  id: string;
  type: PostType;
  authorName: string; // "Mateo" | "Anuncio general"
  authorInitial?: string; // "M" — ausente para "announcement" (usa ícono megáfono)
  avatarBg: string; // "#A9D9E8"
  avatarColor: string; // "#1F7A93"
  time: string; // "14:20"
  publishedBy: string; // "publicado por vos"
  audience: string; // "Para: familia de Mateo" | "Para: toda la sala"
  text: string;
  likes: number;
  comments: number;
  photo?: { caption: string }; // presente solo en el post de tipo "activity"
}

export const badgeConfig: Record<
  PostType,
  { bg: string; dot: string; text: string; label: string }
> = {
  meal: {
    bg: "#9A7B1E",
    dot: "#F4DC8E",
    text: "#FFFFFF",
    label: "COMIDA",
  },
  nap: {
    bg: "#E7DCF6",
    dot: "#7B5FC0",
    text: "#7B5FC0",
    label: "SIESTA",
  },
  activity: {
    bg: "#C7E7F1",
    dot: "#2E89A6",
    text: "#2E89A6",
    label: "ACTIVIDAD",
  },
  achievement: {
    bg: "#CFEBD8",
    dot: "#3E9B6C",
    text: "#3E9B6C",
    label: "LOGRO",
  },
  mood: {
    bg: "#F9D2DE",
    dot: "#C56486",
    text: "#C56486",
    label: "ÁNIMO",
  },
  photo: {
    bg: "#FBD8CC",
    dot: "#D9684A",
    text: "#D9684A",
    label: "FOTO",
  },
  announcement: {
    bg: "#CCD8F4",
    dot: "#4E72C8",
    text: "#4E72C8",
    label: "ANUNCIO",
  },
};

// Píldoras del compositor (SPEC 05): label visible + colores de crear-publicacion.dc.html.
export const composerTypeConfig: Record<
  PostType,
  { label: string; bg: string; text: string }
> = {
  meal: { label: "Comida", bg: "#9A7B1E", text: "#FFFFFF" },
  nap: { label: "Siesta", bg: "#E7DCF6", text: "#7B5FC0" },
  activity: { label: "Actividad", bg: "#2E89A6", text: "#FFFFFF" },
  achievement: { label: "Logro", bg: "#CFEBD8", text: "#3E9B6C" },
  mood: { label: "Ánimo", bg: "#F9D2DE", text: "#C56486" },
  photo: { label: "Foto", bg: "#FBD8CC", text: "#D9684A" },
  announcement: { label: "Anuncio", bg: "#CCD8F4", text: "#4E72C8" },
};

export const classroom = { name: "Soles", childrenCount: 12 };

export const feedPosts: FeedPost[] = [
  {
    id: "mateo-logro-orinal",
    type: "achievement",
    authorName: "Mateo",
    authorInitial: "M",
    avatarBg: "#A9D9E8",
    avatarColor: "#1F7A93",
    time: "14:20",
    publishedBy: "publicado por vos",
    audience: "Para: familia de Mateo",
    text: "¡Usó el orinal solito por primera vez! Estaba feliz de contárselo a todos. Un gran paso.",
    likes: 3,
    comments: 1,
  },
  {
    id: "mateo-actividad-temperas",
    type: "activity",
    authorName: "Mateo",
    authorInitial: "M",
    avatarBg: "#A9D9E8",
    avatarColor: "#1F7A93",
    time: "09:40",
    publishedBy: "publicado por vos",
    audience: "Para: familia de Mateo",
    text: "Pintamos con témperas esta mañana. Mateo eligió el azul para todo y se concentró un montón mezclando colores.",
    likes: 5,
    comments: 2,
    photo: { caption: "Foto · pintando con témperas" },
  },
  {
    id: "anuncio-salida-parque",
    type: "announcement",
    authorName: "Anuncio general",
    avatarBg: "#CCD8F4",
    avatarColor: "#4E72C8",
    time: "07:50",
    publishedBy: "publicado por vos",
    audience: "Para: toda la sala",
    text: "El viernes salimos al parque por la mañana. Recuerden mandar gorra y una botellita de agua.",
    likes: 8,
    comments: 0,
  },
];

// Store en memoria del feed (SPEC 05): el compositor agrega posts aquí.
// Sin persistencia: al recargar la página se vuelve al arreglo inicial.
let posts: FeedPost[] = feedPosts;
const listeners = new Set<() => void>();

export function getPosts(): FeedPost[] {
  return posts;
}

// Snapshot estable para el server-render de useSyncExternalStore (SPEC 05).
export function getInitialPosts(): FeedPost[] {
  return feedPosts;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function addPost(post: FeedPost): void {
  posts = [post, ...posts];
  listeners.forEach((listener) => listener());
}
