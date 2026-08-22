import { ReactNode } from "react";
import Header from "./Header";
import BottomNavigation from "./BottomNavigation";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16 pb-20 overflow-x-hidden">
        {/* Responsive container: full-width on mobile, centered with max-width on tablet+ */}
        <div className="w-full px-0 md:max-w-none lg:max-w-none xl:max-w-none md:mx-0 md:px-0">
          {children}
        </div>
      </main>
      <BottomNavigation />
    </div>
  );
};

export default MainLayout;
