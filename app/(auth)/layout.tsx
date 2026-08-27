import Image from "next/image";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="flex min-h-screen w-full justify-between font-inter">
      {children}
      <div className="auth-asset">
        <div>
          <Image
            // src="/icons/auth-image.svg"
            src="/icons/test.png"
            alt="Auth Image"
            width={600}
            height={600}
            className="rounded-xl border border-zinc-200/80 shadow-lg shadow-zinc-200/50"
          />
        </div>
      </div>
    </main>
  );
}
