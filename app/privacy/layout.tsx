import { Footer } from "@/components/footer";

export default function Layout(props: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      {props.children}
      <Footer 
        builtBy="Your Company"
        builtByLink="https://yourcompany.com"
        githubLink="https://github.com/yourcompany"
        twitterLink="https://twitter.com/yourcompany"
        linkedinLink="https://linkedin.com/company/yourcompany"
      />
    </div>
  );
}
