"use client";

export default function ConnectBankButton() {
  const handleConnect = () => {
    const MonoConnect = (window as any).MonoConnect;

    const connect = new MonoConnect({
      key: process.env.NEXT_PUBLIC_MONO_PUBLIC_KEY,
      onSuccess: async (data: any) => {
        console.log("Connected:", data);

        // send to your backend API route
        await fetch("/api/mono/exchange", {
          method: "POST",
          body: JSON.stringify({ code: data.code }),
          headers: {
            "Content-Type": "application/json",
          },
        });
      },
      onClose: () => {
        console.log("Widget closed");
      },
    });

    connect.open();
  };

  return <button onClick={handleConnect}>Connect Bank</button>;
}
