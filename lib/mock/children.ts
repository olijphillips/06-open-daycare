// Mock data de los niños de la guardería.
// Fuente: references/pantallas/ninos.dc.html (listado) y perfil-nino.dc.html (perfil de Mateo).
// Tipos e identificadores en inglés; slugs de id y contenido visible en español.

export type ParentStatus = "active" | "pending";
export type ParentRole = "Mamá" | "Papá";

export interface Parent {
  name: string; // "Lucía Fernández"
  role: ParentRole; // "Mamá"
  status: ParentStatus; // "active"
  initial: string; // "L"
  avatarBg: string; // "#C9B6E8" — el texto del avatar va siempre en blanco
}

// Tag de alergia/vinculación en la tarjeta de lista.
// Ausente → la tarjeta muestra un chevron ">" en su lugar.
export interface ChildTag {
  label: string; // "MANÍ" | "LACTOSA" | "VINCULAR"
  bg: string; // "#FBD8CC"
  text: string; // "#D9684A"
}

export interface Child {
  slug: string; // "mateo-fernandez" — kebab del nombre completo
  name: string; // "Mateo Fernández"
  age: number; // 3
  avatarBg: string; // "#A9D9E8"
  avatarColor: string; // "#1F7A93"
  initial: string; // "M"
  parentsCount: number; // 2
  tag?: ChildTag; // ausente → chevron
  birthDate: string; // "12 mar 2022"
  classroom: string; // "Soles"
  enrollmentDate: string; // "feb 2025"
  allergyNotes?: string; // "Alergia al maní. Evitar frutos secos..."
  allergies?: string; // "Maní, Lactosa" — etiquetas del modal de agregar
  parents: Parent[]; // []
}

export const children: Child[] = [
  {
    slug: "mateo-fernandez",
    name: "Mateo Fernández",
    age: 3,
    avatarBg: "#A9D9E8",
    avatarColor: "#1F7A93",
    initial: "M",
    parentsCount: 2,
    tag: { label: "MANÍ", bg: "#FBD8CC", text: "#D9684A" },
    birthDate: "12 mar 2022",
    classroom: "Sol",
    enrollmentDate: "feb 2025",
    allergyNotes:
      "Alergia al maní. Evitar frutos secos. Lleva inhalador en la mochila.",
    parents: [
      {
        name: "Lucía Fernández",
        role: "Mamá",
        status: "active",
        initial: "L",
        avatarBg: "#C9B6E8",
      },
      {
        name: "Diego Fernández",
        role: "Papá",
        status: "pending",
        initial: "D",
        avatarBg: "#A9C7E8",
      },
    ],
  },
  {
    slug: "sofia-mendez",
    name: "Sofía Méndez",
    age: 2,
    avatarBg: "#F4B8CC",
    avatarColor: "#C44A7A",
    initial: "S",
    parentsCount: 1,
    birthDate: "05 jul 2023",
    classroom: "Sol",
    enrollmentDate: "ene 2025",
    parents: [
      {
        name: "Carla Méndez",
        role: "Mamá",
        status: "active",
        initial: "C",
        avatarBg: "#C9B6E8",
      },
    ],
  },
  {
    slug: "benjamin-ruiz",
    name: "Benjamín Ruiz",
    age: 3,
    avatarBg: "#B9DEC4",
    avatarColor: "#3E8B62",
    initial: "B",
    parentsCount: 2,
    birthDate: "22 nov 2022",
    classroom: "Sol",
    enrollmentDate: "mar 2025",
    parents: [
      {
        name: "Paula Ruiz",
        role: "Mamá",
        status: "active",
        initial: "P",
        avatarBg: "#C9B6E8",
      },
      {
        name: "Marcos Ruiz",
        role: "Papá",
        status: "active",
        initial: "M",
        avatarBg: "#A9C7E8",
      },
    ],
  },
  {
    slug: "valentina-soto",
    name: "Valentina Soto",
    age: 2,
    avatarBg: "#F4DC8E",
    avatarColor: "#9A7B1E",
    initial: "V",
    parentsCount: 0,
    tag: { label: "VINCULAR", bg: "#F9D2DE", text: "#C56486" },
    birthDate: "18 feb 2023",
    classroom: "Sol",
    enrollmentDate: "abr 2025",
    parents: [],
  },
  {
    slug: "tomas-diaz",
    name: "Tomás Díaz",
    age: 3,
    avatarBg: "#C9B6E8",
    avatarColor: "#7B5FC0",
    initial: "T",
    parentsCount: 1,
    tag: { label: "LACTOSA", bg: "#FBD8CC", text: "#D9684A" },
    birthDate: "09 sep 2022",
    classroom: "Sol",
    enrollmentDate: "feb 2025",
    parents: [
      {
        name: "Andrea Díaz",
        role: "Mamá",
        status: "active",
        initial: "A",
        avatarBg: "#C9B6E8",
      },
    ],
  },
  {
    slug: "emma-castro",
    name: "Emma Castro",
    age: 2,
    avatarBg: "#F4B8CC",
    avatarColor: "#C44A7A",
    initial: "E",
    parentsCount: 1,
    birthDate: "14 abr 2023",
    classroom: "Sol",
    enrollmentDate: "mar 2025",
    parents: [
      {
        name: "Roberto Castro",
        role: "Papá",
        status: "active",
        initial: "R",
        avatarBg: "#A9C7E8",
      },
    ],
  },
  {
    slug: "lucas-romero",
    name: "Lucas Romero",
    age: 3,
    avatarBg: "#A9D9E8",
    avatarColor: "#1F7A93",
    initial: "L",
    parentsCount: 1,
    birthDate: "30 may 2022",
    classroom: "Sol",
    enrollmentDate: "ene 2025",
    parents: [
      {
        name: "Patricia Romero",
        role: "Mamá",
        status: "active",
        initial: "P",
        avatarBg: "#C9B6E8",
      },
    ],
  },
  {
    slug: "olivia-vega",
    name: "Olivia Vega",
    age: 2,
    avatarBg: "#B9DEC4",
    avatarColor: "#3E8B62",
    initial: "O",
    parentsCount: 1,
    birthDate: "02 oct 2023",
    classroom: "Sol",
    enrollmentDate: "abr 2025",
    parents: [
      {
        name: "Fernando Vega",
        role: "Papá",
        status: "active",
        initial: "F",
        avatarBg: "#A9C7E8",
      },
    ],
  },
];

// Busca un niño por su slug. Usado por /kids/[slug] (con notFound() si no existe).
export function getChildBySlug(slug: string): Child | undefined {
  return children.find((child) => child.slug === slug);
}

// Salas disponibles de la guardería. Fuente: decisión del usuario en SPEC 04.
export const classrooms = ["Sol", "Tierra", "Luna"];

// Paleta de avatares para niños nuevos (bg + color de texto).
const avatarPalette: Array<{ bg: string; color: string }> = [
  { bg: "#A9D9E8", color: "#1F7A93" },
  { bg: "#F4B8CC", color: "#C44A7A" },
  { bg: "#B9DEC4", color: "#3E8B62" },
  { bg: "#F4DC8E", color: "#9A7B1E" },
  { bg: "#C9B6E8", color: "#7B5FC0" },
];

// Meses en español corto para birthDate / enrollmentDate.
const shortMonths = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

// Slugs kebab-case a partir del nombre completo ("Martina López" → "martina-lopez").
export function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Calcula la edad en años desde una fecha en formato dd/mm/aaaa.
export function ageFromBirthDate(birthDate: string): number {
  const [day, month, year] = birthDate.split("/").map(Number);
  if (!day || !month || !year) return 0;
  const today = new Date();
  let age = today.getFullYear() - year;
  const monthDiff = today.getMonth() + 1 - month;
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < day)) age -= 1;
  return Math.max(0, age);
}

// Construye un Child nuevo a partir de los datos del modal.
// La inicial del avatar va siempre en blanco (mismo criterio que Parent.avatarBg).
export function buildNewChild(input: {
  name: string;
  birthDate: string; // "dd/mm/aaaa"
  classroom: string;
  allergies?: string;
  medicalNotes?: string;
}): Child {
  const [day, month, year] = input.birthDate.split("/").map(Number);
  const palette = avatarPalette[children.length % avatarPalette.length];
  const now = new Date();
  const initial = input.name.trim().charAt(0).toUpperCase() || "?";
  const birthDateShort = `${day} ${shortMonths[month - 1]} ${year}`;
  const enrollmentDate = `${shortMonths[now.getMonth()]} ${now.getFullYear()}`;
  const allergies = input.allergies?.trim() || undefined;
  const medicalNotes = input.medicalNotes?.trim() || undefined;

  return {
    slug: slugify(input.name),
    name: input.name.trim(),
    age: ageFromBirthDate(input.birthDate),
    avatarBg: palette.bg,
    avatarColor: palette.color,
    initial,
    parentsCount: 0,
    birthDate: birthDateShort,
    classroom: input.classroom,
    enrollmentDate,
    ...(allergies ? { allergies } : {}),
    ...(medicalNotes ? { allergyNotes: medicalNotes } : {}),
    parents: [],
  };
}
