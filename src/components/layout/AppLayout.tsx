import Sidebar from './Sidebar'

interface AppLayoutProps {
  children: React.ReactNode
  header?: React.ReactNode
}

export default function AppLayout({ children, header }: AppLayoutProps) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f7' }}>
      <Sidebar />
      <div className="ml-56 min-h-screen flex flex-col">
        {header && (
          <header
            className="sticky top-0 z-30 px-8 flex items-center"
            style={{
              backgroundColor: 'rgba(245,245,247,0.92)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderBottom: '1px solid rgba(0,0,0,0.06)',
              minHeight: '56px',
            }}
          >
            {header}
          </header>
        )}
        <main className="flex-1 px-8 py-7">
          {children}
        </main>
      </div>
    </div>
  )
}
