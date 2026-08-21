// Pantalla provisional "En construcción" para destinos de navegación sin
// contenido implementado todavía. Se renderiza dentro del shell del panel.
export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="mx-auto max-w-[760px] px-5 pb-20 pt-16 md:px-10 md:pt-[34px]">
      <div className="rounded-[20px] border border-dashed border-[#DBCDBA] bg-[#F4ECE1] px-6 py-14 text-center">
        <div className="font-display text-[20px] font-semibold text-ink">
          {title}
        </div>
        <p className="mt-2 text-[14px] text-[#A89A8B]">En construcción</p>
      </div>
    </div>
  );
}
