import { MailPackageList } from '@/components/admin/mail-package-list'

export default function AdminPanelsPage() {
  return (
    <div className="space-y-6 pt-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mail Scanning Panel</h1>
        <p className="text-muted-foreground mt-3">
          Review and manage mail scanning submissions from panelists.
        </p>
      </div>
      
      <MailPackageList />
    </div>
  )
} 