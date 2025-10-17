// ... imports ...
import AppLayout from '../components/shared/AppLayout';

export default function RootLayout({ children }: { children: React.ReactNode; }) {
  return (
    <html lang="en">
      <body>
        <AppLayout>
          {children}  {/* This is the line that wraps all your pages */}
        </AppLayout>
      </body>
    </html>
  );
}