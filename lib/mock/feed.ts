// Mock data del feed de la guardería.
// Fuente: references/pantallas/feed.dc.html (mockup de la home).
// Tipos e identificadores en inglés; slugs de id y contenido visible en español.

export type PostType = "achievement" | "activity" | "announcement";

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
  achievement: {
    bg: "#CFEBD8",
    dot: "#3E9B6C",
    text: "#3E9B6C",
    label: "LOGRO",
  },
  activity: {
    bg: "#C7E7F1",
    dot: "#2E89A6",
    text: "#2E89A6",
    label: "ACTIVIDAD",
  },
  announcement: {
    bg: "#CCD8F4",
    dot: "#4E72C8",
    text: "#4E72C8",
    label: "ANUNCIO",
  },
};

export const currentUser = {
  name: "Caro Giménez",
  role: "Maestra · Soles",
  initial: "C",
  avatarBg: "#F2937A",
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
