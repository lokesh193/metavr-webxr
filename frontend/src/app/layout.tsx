import '@/styles/globals.css';
import { Navbar } from '@/components/ui/navbar';
import { Footer } from '@/components/ui/footer';
import { VRScene } from '@/components/webxr/VRScene';
import { Toaster } from 'sonner';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'METAVR — WebXR Sketchfab & Unity Hybrid Platform',
  description: 'Upload, manage, stream and experience 3D assets (GLB models) and Unity WebGL builds in 6DOF WebXR directly in your browser.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground flex flex-col font-sans">
        <Toaster position="top-right" theme="dark" richColors />
        <Navbar />
        <VRScene />
        <main className="flex-1 pt-24">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
