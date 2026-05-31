import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col flex-1">
      <Navbar />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        {children}
      </main>
      <Footer />
    </div>
  )
}
