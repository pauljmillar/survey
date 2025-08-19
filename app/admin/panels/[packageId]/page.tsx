import { MailPackageDetail } from '@/components/admin/mail-package-detail'

interface MailPackagePageProps {
  params: {
    packageId: string
  }
}

export default function MailPackagePage({ params }: MailPackagePageProps) {
  return (
    <div className="pt-12">
      <MailPackageDetail packageId={params.packageId} />
    </div>
  )
} 