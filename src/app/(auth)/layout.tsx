export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <p className="mb-8 text-center text-label uppercase tracking-widest text-text-tertiary">
          Sabre Logs
        </p>
        {children}
      </div>
    </div>
  );
}
