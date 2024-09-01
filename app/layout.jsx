import "@/styles/globals.css"

export const metadata = {
  title: "SARTHI",
  description: "Your personal Voice assistant",
};

export default function RootLayout({ children }) {
  return (
    <html className="h-full w-full" lang="en">
      <body className="h-full w-full flex justify-center bg-black">{children}</body>
    </html>
  );
}
