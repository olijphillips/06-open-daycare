# SPEC 12 — Publicaciones reales con Supabase (crear post de staff, con fotos)

> **Status:** Draft
> **Depends on:** SPEC 05, SPEC 08, SPEC 09
> **Date:** 2026-08-20
> **Objective:** Persistir en Supabase las publicaciones del staff creadas desde `/crear-publicacion` (destinatarios, tipo, descripción y fotos reales en Storage), y conectar el feed `/` a la BD para leerlas.

## Scope

**In:**

- Migración local `create_posts_tables` (`supabase/migrations/`): enum `post_type` con `mood` incluido, tablas `posts`, `post_children` y `post_photos` conforme al esquema de referencia, índices y RLS multi-tenant.
- RLS multi-tenant: `SELECT` en las 3 tablas solo para `authenticated` del mismo daycare; **sin** `INSERT`/`UPDATE` directos en `posts`/`post_children`/`post_photos` — la escritura pasa exclusivamente por la RPC `create_post` (`SECURITY DEFINER`).
- RPC `create_post` (`SECURITY DEFINER`, `set search_path = public`): valida que el usuario sea `admin`/`staff`, valida `photo_consent` de todos los destinatarios si el post lleva fotos, e inserta `posts` + `post_children` + `post_photos` en una única transacción.
- Edge Function `create-post` (`supabase/functions/create-post/index.ts`, `verify_jwt` activo): valida el JWT (staff/admin del daycare), revalida `photo_consent` e invoca la RPC `create_post` con el service role (inserciones atómicas).
- Bucket de Storage **privado** `post-photos` con RLS: `INSERT` solo `admin`/`staff`; `SELECT`/`UPDATE`/`DELETE` para usuarios del mismo daycare que el owner del objeto (via `users.daycare_id`).
- Compositor `/crear-publicacion` real: los destinatarios se cargan desde BD (niños activos del daycare del staff, unión `rooms`+`children`), el `photo_consent` se valida también en cliente para habilitar la sección FOTOS, y la subida de fotos es real.
- Flujo de publicación: el cliente genera `post_id` (`crypto.randomUUID()`), sube las fotos a Storage (`post-photos/{postId}/{i}.{ext}`, bucket privado) y llama a la Edge Function `create-post`; en éxito navega a `/` y refresca.
- Feed `/` real: pasa a server component que lee `posts` del daycare del usuario (por `author_id` → `users.daycare_id`), con autor (`users.full_name`), destinatarios (`post_children` + `children`) y fotos (`post_photos` con signed URLs de 60s).
- Post-card real: muestra autor real del staff, `publishedBy` = "publicado por vos" si `author_id == auth.uid()` (si no, el nombre del staff), `title` como nombre visible (niño único / "Anuncio general"), destinatarios y fotos reales con firma.
- Seeds de posts demo en la migración (2 con niños + 1 anuncio) para que el feed no arranque vacío.
- Eliminación de `lib/mock/feed.ts` (store en memoria, `feedPosts`, `badgeConfig`, `composerTypeConfig` migran a la capa real).
- Selector de archivos en la zona FOTOS (click en "Agregar" abre el picker, además del drag & drop); límites: máx. 6 fotos, `image/*`, ≤5MB por archivo.
- Botón "Publicar" con estado "Publicando…" y error inline si falla la subida o la BD.

**Out of scope (for future specs):**

- Edición ni borrado de publicaciones ("Editar" sigue en `#`).
- Likes y comentarios funcionales (tablas `reactions`/`comments` no se crean).
- Página de detalle de publicación.
- Gating del feed por rol `parent` ni `familia-feed` (un `parent` autenticado sigue viendo la UI de staff; el filtrado por `post_children` para padres es spec futuro).
- Reenvío/expiración de invitaciones, ni `photo_consent` editable desde la UI (queda gestionado por staff en BD).
- Tipos TypeScript generados (`database.types.ts`).
- Trigger de `updated_at`.
- Subida progresiva / resumible ni compresión de imágenes en el cliente.

## Data model

```sql
-- Migración: supabase/migrations/<timestamp>_create_posts_tables.sql
-- SPEC 12 — Publicaciones reales del feed (staff), con fotos en Storage.

-- Enum de tipo de post. Incluye 'mood' (Ánimo), que el compositor ya muestra
-- (SPEC 05) pero el enum de referencia no tenía.
create type public.post_type as enum
  ('meal', 'nap', 'activity', 'achievement', 'photo', 'announcement', 'mood');

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.users (id),
  room_id uuid references public.rooms (id),
  type public.post_type not null,
  title text,
  body text not null,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index posts_author_id_idx on public.posts (author_id);
create index posts_published_at_idx on public.posts (published_at desc);
alter table public.posts enable row level security;

create table public.post_children (
  post_id uuid not null references public.posts (id) on delete cascade,
  child_id uuid not null references public.children (id),
  primary key (post_id, child_id)
);
create index post_children_child_id_idx on public.post_children (child_id);
alter table public.post_children enable row level security;

create table public.post_photos (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  url text not null, -- path del objeto en el bucket privado post-photos
  width int,
  height int,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index post_photos_post_id_idx on public.post_photos (post_id);
alter table public.post_photos enable row level security;

-- El feed del staff lee posts de su propio daycare. El daycare del post se
-- resuelve a través del autor (users.daycare_id). Nunca USING (true).
create policy "posts_select_authenticated" on public.posts
  for select to authenticated
  using (
    exists (
      select 1 from public.users viewer
      where viewer.id = auth.uid()
        and exists (
          select 1 from public.users author
          where author.id = posts.author_id
            and author.daycare_id = viewer.daycare_id
        )
    )
  );

create policy "post_children_select_authenticated" on public.post_children
  for select to authenticated
  using (
    exists (
      select 1 from public.posts p
      where p.id = post_children.post_id
        and exists (
          select 1 from public.users viewer
          where viewer.id = auth.uid()
            and exists (
              select 1 from public.users author
              where author.id = p.author_id
                and author.daycare_id = viewer.daycare_id
            )
        )
    )
  );

create policy "post_photos_select_authenticated" on public.post_photos
  for select to authenticated
  using (
    exists (
      select 1 from public.posts p
      where p.id = post_photos.post_id
        and exists (
          select 1 from public.users viewer
          where viewer.id = auth.uid()
            and exists (
              select 1 from public.users author
              where author.id = p.author_id
                and author.daycare_id = viewer.daycare_id
            )
        )
    )
  );

-- Sin políticas INSERT/UPDATE/DELETE en posts/post_children/post_photos:
-- la escritura es exclusiva de la RPC create_post (SECURITY DEFINER).

-- RPC transaccional: valida rol + photo_consent e inserta post + niños + fotos.
create or replace function public.create_post(
  p_post_id uuid,
  p_type public.post_type,
  p_title text,
  p_body text,
  p_room_id uuid,
  p_child_ids uuid[],
  p_photo_paths text[]
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_daycare_id uuid;
begin
  select u.daycare_id into v_daycare_id
  from public.users u
  where u.id = v_uid and u.role in ('admin', 'staff');
  if v_daycare_id is null then
    raise exception 'FORBIDDEN';
  end if;

  if p_photo_paths is not null and cardinality(p_photo_paths) > 0 then
    if exists (
      select 1 from public.children c
      where c.id = any(p_child_ids)
        and (c.photo_consent = false or c.status <> 'active')
    ) then
      raise exception 'PHOTO_CONSENT_DENIED';
    end if;
  end if;

  insert into public.posts (id, author_id, room_id, type, title, body, published_at)
  values (p_post_id, v_uid, p_room_id, p_type, p_title, p_body, now());

  if p_child_ids is not null and cardinality(p_child_ids) > 0 then
    insert into public.post_children (post_id, child_id)
    select p_post_id, unnest(p_child_ids);
  end if;

  if p_photo_paths is not null and cardinality(p_photo_paths) > 0 then
    insert into public.post_photos (post_id, url, position)
    select p_post_id, unnest(p_photo_paths), generate_subscripts(p_photo_paths, 1);
  end if;

  return p_post_id;
end;
$$;

revoke execute on function public.create_post(uuid, public.post_type, text, text, uuid, uuid[], text[]) from public;
grant execute on function public.create_post(uuid, public.post_type, text, text, uuid, uuid[], text[]) to authenticated;

-- Bucket privado de fotos de posts.
insert into storage.buckets (id, name, public)
values ('post-photos', 'post-photos', false)
on conflict (id) do nothing;

-- INSERT en el bucket solo para admin/staff del daycare.
create policy "post_photos_insert_staff" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'post-photos'
    and exists (
      select 1 from public.users
      where users.id = auth.uid() and users.role in ('admin', 'staff')
    )
  );

-- SELECT: usuarios del mismo daycare que el owner del objeto.
create policy "post_photos_select_daycare" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'post-photos'
    and exists (
      select 1 from public.users owner_u
      where owner_u.id = objects.owner
        and exists (
          select 1 from public.users viewer
          where viewer.id = auth.uid()
            and viewer.daycare_id = owner_u.daycare_id
        )
    )
  );

-- UPDATE/DELETE: staff del mismo daycare que el owner (los archivos los crea el
-- staff, que comparte daycare; el owner no se reasigna).
create policy "post_photos_update_staff" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'post-photos'
    and exists (
      select 1 from public.users owner_u
      where owner_u.id = objects.owner
        and exists (
          select 1 from public.users editor
          where editor.id = auth.uid()
            and editor.role in ('admin', 'staff')
            and editor.daycare_id = owner_u.daycare_id
        )
    )
  );
create policy "post_photos_delete_staff" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'post-photos'
    and exists (
      select 1 from public.users owner_u
      where owner_u.id = objects.owner
        and exists (
          select 1 from public.users deleter
          where deleter.id = auth.uid()
            and deleter.role in ('admin', 'staff')
            and deleter.daycare_id = owner_u.daycare_id
        )
    )
  );
```

```sql
-- Migración: supabase/migrations/<timestamp>_seed_posts.sql
-- Seeds de posts demo: autor admin (existe por SPEC 07/08) y niños de la sala Sol.

insert into public.posts (author_id, room_id, type, title, body, published_at)
select
  (select id from public.users where email = 'admin@opendaycare.com'),
  (select r.id from public.rooms r where r.name = 'Sol'),
  x.type::public.post_type, x.title, x.body, now() - x.age_hours * interval '1 hour'
from (values
  ('achievement', 'Mateo', '¡Usó el orinal solito por primera vez! Estaba feliz de contárselo a todos. Un gran paso.', 2),
  ('activity', 'Mateo', 'Pintamos con témperas esta mañana. Mateo eligió el azul para todo y se concentró un montón mezclando colores.', 6),
  ('announcement', 'Anuncio general', 'El viernes salimos al parque por la mañana. Recuerden mandar gorra y una botellita de agua.', 8)
) as x(type, title, body, age_hours);

insert into public.post_children (post_id, child_id)
select p.id, c.id
from public.posts p
join public.children c on c.full_name = 'Mateo Fernández'
where p.title = 'Mateo' and p.type in ('achievement', 'activity');
```

Capa de datos (app):

```ts
// lib/data/posts.ts
export type PostType =
  | "meal" | "nap" | "activity" | "achievement"
  | "mood" | "photo" | "announcement";

export interface FeedPost {
  id: string; // uuid de BD
  type: PostType;
  authorName: string; // title del post ("Mateo" | "Anuncio general")
  authorInitial?: string; // inicial del autor real (staff) para el avatar
  authorBg: string;
  authorColor: string;
  publishedByName: string; // full_name del staff que publicó
  publishedBySelf: boolean; // true si author_id == auth.uid()
  publishedAt: string; // "14:20"
  audience: string; // "Para: familia de Mateo" | "Para: toda la sala"
  text: string; // body
  photos: string[]; // signed URLs (vacío si no hay fotos)
  likes: number; // 0
  comments: number; // 0
}

export interface PhotoRef {
  path: string; // "post-photos/{postId}/{i}.{ext}"
  signedUrl: string;
}
```

Convenciones:

- `authorName` visible = `posts.title` (nombre de niño si único, "Anuncio general" si varios / toda la sala); si `title` fuera null se cae a `full_name` del staff.
- `audience` se calcula en la capa de datos desde `post_children`: "Para: familia de <nombre>" (1), "Para: familias de <a>, <b> y <c>" (varios), "Para: toda la sala" (sin `post_children`).
- `publishedBy` visible = "publicado por vos" si `publishedBySelf`; si no, `publishedBy <full_name del staff>`.
- `publishedAt` se formatea a `HH:MM` local. Avatar del staff: `initial` = primera letra de `full_name`; colores vía `avatarColorFor` (`lib/auth/profile.ts`).
- `likes`/`comments` = 0 (tablas de reacciones/comentarios no existen aún).
- Las fotos se leen con signed URLs (`supabase.storage.from("post-photos").createSignedUrl(path, 60)`) en el server component; el compositor las sube con el client (`storage.from("post-photos").upload`).

## Implementation plan

1. **Migración BD `create_posts_tables`.** `supabase migration new create_posts_tables` → SQL del data model (enum, 3 tablas, RLS, RPC, bucket + policies) → `supabase migration up` (local) → `supabase db push` (remoto). _Test:_ `list_tables` muestra `posts`/`post_children`/`post_photos`; `get_advisors` (security) sin avisos nuevos por ACL; el bucket `post-photos` existe y es privado.
2. **Migración BD `seed_posts`.** `supabase migration new seed_posts` → SQL de los 3 posts demo + sus `post_children` → push. _Test:_ `execute_sql` sobre `posts` devuelve 3 filas con autor admin y 2 `post_children` (Mateo).
3. **`lib/data/posts.ts`.** Tipo `PostType`, `FeedPost`, `PhotoRef` y `fetchFeedPosts(uid)` (query posts + join users author + post_children + children + post_photos; signed URLs; mapeo a `FeedPost`). _Test:_ `npm run build` sin errores de tipos.
4. **`app/page.tsx` a server component.** Lee `getUser()`, `fetchFeedPosts`, renderiza `PostCard` con datos reales; conserva `ComposerTrigger`, header, contador y sección "PUBLICADO HOY"; elimina `useSyncExternalStore` y el store de `lib/mock/feed`. _Test:_ `/` lista los 3 posts demo desde BD.
5. **`components/feed/post-card.tsx` real.** Acepta `FeedPost` real; avatar con inicial del staff (o megáfono si `announcement`), `publishedByName`/`publishedBySelf`, fotos reales con `next/image` (o `img`) desde signed URL, `audience`, badge por tipo. _Test:_ render de los 3 posts demo.
6. **`lib/mock/feed.ts` → capa real.** Mover `badgeConfig` y `composerTypeConfig` a `lib/data/posts.ts` (o un módulo de configuración UI) y eliminar el archivo mock; actualizar imports (`post-card`, `post-badge`, `create-post`). _Test:_ `npm run build` sin imports colgando.
7. **Compositor: destinatarios desde BD.** `create-post.tsx` pasa a recibir los niños por prop (server component `/crear-publicacion/page.tsx` los carga con `fetchChildrenByDaycare`): children activos del daycare del staff (join `rooms`+`children`), con `photo_consent`. _Test:_ el compositor lista los 8 niños reales de Sol.
8. **Compositor: `photo_consent` y selección.** Validar en cliente que todos los destinatarios seleccionados tengan `photo_consent = true` si hay fotos adjuntas; si alguno no, deshabilitar Publicar con mensaje inline. _Test:_ elegir un niño sin consentimiento + foto → no se puede publicar.
9. **Compositor: selector de archivos + límites.** El recuadro "Agregar" abre un `<input type="file" accept="image/*" multiple>` (además del drag & drop); validar ≤6 fotos y ≤5MB; mantener `URL.createObjectURL` para preview. _Test:_ soltar y elegir archivos; exceder límites muestra error.
10. **Compositor: publicación real.** Al Publicar: `crypto.randomUUID()` para `postId`, subir cada archivo a `post-photos/{postId}/{i}.{ext}`, llamar a la Edge Function `create-post` (`POST {url}/functions/v1/create-post` con `Authorization: Bearer <access_token>`) con `{ postId, type, title, body, childIds, photoPaths, roomId }`; botón "Publicando…" deshabilitado; error inline mapeado (FORBIDDEN, PHOTO_CONSENT_DENIED, red/storage); en éxito `router.push("/")` + `router.refresh()`. Si la función falla tras subir fotos, borrar los objetos subidos (best-effort). _Test:_ publicar con y sin fotos → el post aparece en `/` y persiste al recargar.
11. **Edge Function `create-post`.** `supabase functions new create-post` → `index.ts` con `createClient` (service role) + `supabase.rpc("create_post", …)`; `verify_jwt` activo en el deploy. _Test:_ deploy vía MCP; llamada con JWT de `staff@` inserta; JWT de `parent` devuelve FORBIDDEN.
12. **Verificación.** `npm run lint` + `npm run build`; flujos manuales: publicar con/sin fotos (persiste), feed desde BD, `photo_consent` bloqueante, RLS (parent no puede publicar ni ver otro daycare), signed URLs visibles.

## Acceptance criteria

- [ ] `public.post_type` existe con `mood` entre sus valores.
- [ ] `public.posts`, `public.post_children` y `public.post_photos` existen con RLS; `get_advisors` (security) no reporta avisos nuevos.
- [ ] La RPC `public.create_post` existe, es `SECURITY DEFINER` con `set search_path = public`, y su ACL no expone `EXECUTE` a `PUBLIC`.
- [ ] El bucket `post-photos` existe, es privado (`public = false`) y sus políticas no usan `USING (true)`.
- [ ] El feed `/` lista los 3 posts demo desde BD con autor (admin), destinatarios (Mateo) y badge correctos.
- [ ] Publicar un post con destinatarios + descripción (sin fotos) lo inserta en `posts` + `post_children` y aparece al inicio de `/` tras recargar.
- [ ] Publicar un post con fotos sube los archivos a `post-photos/{postId}/{i}` (bucket privado), inserta `post_photos` con los paths y el feed las muestra con signed URLs.
- [ ] Los destinatarios del compositor salen de la BD (niños activos del daycare del staff), no del mock.
- [ ] Con un destinatario sin `photo_consent` y una foto adjunta, "Publicar" queda bloqueado con mensaje inline; la RPC también rechaza con `PHOTO_CONSENT_DENIED`.
- [ ] "Agregar" en FOTOS abre el selector de archivos; no se pueden adjuntar más de 6 fotos ni archivos de más de 5MB (error inline).
- [ ] El botón muestra "Publicando…" y queda deshabilitado durante la publicación; un fallo de red/BD muestra error inline y no navega.
- [ ] Un `parent` autenticado no puede publicar (FORBIDDEN) ni ver posts de otro daycare.
- [ ] El post publicado por el staff logueado muestra "publicado por vos"; el resto muestra el nombre del staff.
- [ ] `lib/mock/feed.ts` fue eliminado y no queda ningún import de él en la app.
- [ ] `npm run lint` pasa sin errores.
- [ ] `npm run build` pasa (typecheck).

## Decisions

- **Sí:** Edge Function `create-post` + RPC `create_post` transaccional — la RPC garantiza atomicidad (post + niños + fotos) y la Edge Function centraliza el uso del service role sin exponerlo al cliente.
- **No:** Inserts separados desde el cliente — dejaría publicaciones huérfanas (post sin fotos o niños) ante un fallo parcial.
- **Sí:** El cliente sube las fotos a Storage primero (con `postId` generado por `crypto.randomUUID()`) y después llama a la función — el picker/drag & drop viven en el cliente y el preview usa object URLs; la función solo guarda los paths.
- **No:** Subir los archivos dentro de la Edge Function — duplicaría el I/O y obligaría a codificar archivos en la petición.
- **Sí:** `mood` agregado al enum `post_type` — el compositor ya muestra Ánimo (SPEC 05) y sin el valor no se podía persistir.
- **Sí:** Escritura solo vía RPC (sin políticas INSERT/UPDATE en las tablas de posts) — superficie mínima y validación centralizada de rol y `photo_consent`.
- **No:** Políticas `INSERT` para `authenticated` en posts — permitiría a un `parent` insertar.
- **Sí:** RLS de `SELECT` resuelta por `users.daycare_id` del autor — el feed del staff = posts del propio daycare; nunca `USING (true)`.
- **Sí:** Bucket privado `post-photos` con signed URLs (60s) en el feed — las fotos de niños son datos sensibles y el esquema prevé `post_photos`.
- **No:** Bucket público — expondría fotos de menores sin auth.
- **Sí:** Destinatarios desde BD (niños activos del daycare del staff) — consistente con SPEC 09; el compositor deja de usar `lib/mock/children.ts`.
- **Sí:** `photo_consent` validado en cliente y revalidado en la RPC — UX inmediata + seguridad real (el cliente nunca es suficiente).
- **Sí:** `title` guarda el nombre visible ("Mateo" / "Anuncio general") y `body` la descripción — respeta el esquema de referencia.
- **No:** Calcular autor/destinatarios solo en render — el esquema define `posts.author_id` y `post_children` como fuente de verdad.
- **Sí:** `publishedBy` = "publicado por vos" cuando `author_id == auth.uid()`; si no, el nombre del staff — mantiene el aspecto del mock con datos reales.
- **Sí:** Feed `/` como server component — consistente con `/kids` (SPEC 09) y sin la complejidad de Realtime en este spec.
- **No:** Feed cliente + suscripción Realtime — se difiere; la recarga del server component es suficiente para la demo.
- **Sí:** Seeds de posts demo — el feed no arranca vacío y la verificación tiene contenido real.
- **Sí:** Eliminar `lib/mock/feed.ts` por completo — el feed ya es real; `badgeConfig`/`composerTypeConfig` pasan a la capa de datos.
- **Sí:** Selector de archivos + drag & drop y límites (6 fotos, image/*, ≤5MB) — el recuadro "Agregar" deja de ser decorativo (SPEC 05 lo dejó sin acción).
- **Sí:** Botón con estado de carga y error inline — con I/O real es necesario; el mock no tenía estados de fallo.

## Risks

| Riesgo                                                                                  | Mitigación                                                                                                            |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Post publicado sin fotos porque la subida a Storage falla a medias.                      | Subir fotos primero y recién después llamar a la función; si la función falla, borrar los objetos subidos (best-effort). |
| Fotos huérfanas en Storage si el post nunca se inserta.                                  | Limpieza best-effort desde el cliente y paths anclados al `postId` para una purga futura.                              |
| Un `parent` publica o ve otro daycare.                                                   | RLS por `users.daycare_id` + RPC que exige rol `admin`/`staff` + `verify_jwt` en la Edge Function.                     |
| `photo_consent` false y una foto adjunta (caso "toda la sala" con un niño sin consentimiento). | Validación en cliente de todos los destinatarios + `PHOTO_CONSENT_DENIED` en la RPC (defensa en profundidad).          |
| Signed URLs expiran (60s) y el feed muestra fotos rotas en navegación larga.             | Aceptado para la demo; un `refresh()` re-firma. Alternativa futura: CDN/caché con URLs firmadas largas.                 |
| La RPC se marca como mutable por advisors si falta `set search_path`.                    | `set search_path = public` explícito y ACL revocada de `PUBLIC` (mismo patrón que SPEC 07/11).                         |
| El `postId` generado en el cliente ya existe (colisión).                                 | `crypto.randomUUID()` hace la colisión inviable; la RPC inserta con ese id y fallaría devolviendo error capturable.     |
| Migraciones aplicadas a remoto no se pueden editar (el enum se crea de cero aquí).       | `post_type` se crea en esta migración (aún no existe en BD); si existiera, sería `alter type add value 'mood'`.        |

## What is **not** in this spec

- Edición ni borrado de publicaciones.
- Likes y comentarios funcionales (`reactions`/`comments`).
- Página de detalle de publicación.
- Gating del feed por rol `parent` ni `familia-feed`.
- Reenvío/expiración de invitaciones ni edición de `photo_consent` desde la UI.
- Tipos TypeScript generados (`database.types.ts`).
- Trigger de `updated_at`.
- Subida progresiva, resumible o compresión de imágenes en cliente.
