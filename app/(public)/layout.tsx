import { Navbar } from '@frontend/components/layout/navbar';
import { Footer } from '@frontend/components/layout/footer';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
