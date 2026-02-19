import './globals.css';
import { Navbar } from '@/components/ui/Navbar';

export const metadata = {
  title: 'Task Manager',
  description: 'Personal AI-Powered Kanban Task Manager',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
