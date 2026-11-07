import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-24 md:px-8">
      <p className="rotulo">Erro 404</p>
      <h1 className="mt-2 font-serif text-[clamp(3rem,10vw,9rem)] leading-[0.9]">Esse par saiu de linha.</h1>
      <Link href="/loja" className="btn btn-tinta mt-10">
        Ver o que tem hoje
      </Link>
    </div>
  );
}
