import { Footer } from "@/components/footer";

export default function Layout(props: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      {props.children}
      <Footer />
    </div>
  );
}
