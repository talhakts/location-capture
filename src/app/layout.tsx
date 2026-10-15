import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Location Capture — Visual Discovery & Shot Planner | Britain Off Map',
  description:
    'Local-first research, visual discovery, and shot planning tool for Britain Off Map YouTube documentary productions.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans bg-[#FAF7F2] text-[#2B2B2B]">
        {children}
      </body>
    </html>
  );
}
