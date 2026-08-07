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
    classroom: "Soles",
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
    classroom: "Soles",
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
    classroom: "Soles",
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
    classroom: "Soles",
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
    classroom: "Soles",
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
    classroom: "Soles",
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
    classroom: "Soles",
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
    classroom: "Soles",
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
