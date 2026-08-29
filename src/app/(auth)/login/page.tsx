import { LoginForm } from "./login-form";

export const metadata = { robots: { index: false } };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const destinoSeguro = next && next.startsWith("/") && !next.startsWith("//") ? next : undefined;
  return <LoginForm next={destinoSeguro} />;
}
