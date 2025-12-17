import { Sidebar } from "@/components/Dashboard/Sidebar";
import { Header } from "@/components/Dashboard/Header";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-background font-sans antialiased">
            <Sidebar />
            <div className="flex-1 flex flex-col min-h-screen relative">
                <Header />
                <main className="flex-1 p-6 relative overflow-y-auto w-full">
                    <div className="mx-auto w-full max-w-7xl animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
