// Título de página: el mismo tamaño en todas las pantallas de la app.
export default function PageTitle({ children, id }) {
  return (
    <h1 className="text-balance text-3xl text-foreground sm:text-4xl" id={id}>
      {children}
    </h1>
  );
}
