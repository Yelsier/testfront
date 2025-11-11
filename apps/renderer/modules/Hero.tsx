import Link from "../components/Link";

export default function Hero({ title }: { title: string }) {
  return <section style={{ padding: 32, height: '100vh' }}><h1>{title}</h1>
    <Link href="/about">about</Link>
    <br />
    <Link href="/">home</Link>
  </section>;
}
