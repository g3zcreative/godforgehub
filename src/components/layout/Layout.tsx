import { Navbar } from "./Navbar";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border py-8 mt-12">
        <div className="container text-center text-sm text-muted-foreground">
          <p className="font-display font-semibold text-foreground mb-2">
            Godforge<span className="text-primary">Hub</span>
          </p>
          <p>A community information hub for Godforge by Fateless Games.</p>
          <p className="mt-1">Godforge Hub is not affiliated with Fateless Games.</p>
        </div>
      </footer>
    </div>
  );
}
