import { Outlet } from 'react-router-dom';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';

export function PublicLayout() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">{<Outlet />}</main>
      <Footer />
    </>
  );
}
