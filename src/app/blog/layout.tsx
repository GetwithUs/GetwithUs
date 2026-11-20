import UtmCapture from "@/components/forms/UtmCapture";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import WhatsAppFab from "@/components/layout/WhatsAppFab";

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
      <WhatsAppFab />
      <UtmCapture />
    </>
  );
}
