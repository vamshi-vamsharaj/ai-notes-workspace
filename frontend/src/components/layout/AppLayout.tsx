// // frontend/src/components/layout/AppLayout.tsx
// import type { ReactNode } from "react";
// import { Sidebar } from "./Sidebar";
// import { Navbar } from "./Navbar";
// import { DeleteNoteModal } from "@/components/modals/DeleteNoteModal"; // <-- Import the modal

// interface AppLayoutProps {
//   children: ReactNode;
// }

// export function AppLayout({ children }: AppLayoutProps) {
//   return (
//     <div className="flex min-h-screen bg-black text-white">
//       <Sidebar />

//       <div className="flex flex-1 flex-col">
//         <Navbar />

//         <main className="flex-1 p-6">
//           {children}
//         </main>
//       </div>

//       {/* <-- ADD THE MODAL HERE so it actually exists in the DOM --> */}
//       <DeleteNoteModal /> 
//     </div>
//   );
// }
// frontend/src/components/layout/AppLayout.tsx
// THE KEY ARCHITECTURAL FIX:
// Old: min-h-screen → whole page scrolls, sidebar moves with content
// New: h-screen overflow-hidden → viewport-locked container
//      Sidebar: fixed height, never scrolls
//      Main: flex-1 overflow-hidden → navbar fixed, <main> independently scrollable
//
// This makes the app feel like Notion/Linear: sidebar stays put, only content scrolls.

// import type { ReactNode } from 'react'
// import { Sidebar } from './Sidebar'
// import { Navbar } from './Navbar'
// import { DeleteNoteModal } from '@/components/modals/DeleteNoteModal'

// interface AppLayoutProps {
//   children: ReactNode
// }

// export function AppLayout({ children }: AppLayoutProps) {
//   return (
//     // h-screen + overflow-hidden = viewport-locked. Nothing escapes this box.
//     <div
//       className="flex h-screen overflow-hidden"
//       style={{ background: 'var(--bg-base)' }}
//     >
//       {/* Sidebar: fixed height column, never scrolls itself */}
//       <Sidebar />

//       {/* Right column: navbar + scrollable content */}
//       <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
//         {/* Navbar: fixed height, never scrolls */}
//         <Navbar />

//         {/* Main content: THIS is the only scrollable region */}
//         {/* overflow-y-auto scoped here = sidebar + navbar always visible */}
//         <main className="flex-1 overflow-y-auto">
//           {children}
//         </main>
//       </div>

//       {/* Modal always mounted at root level so it renders above everything */}
//       <DeleteNoteModal />
//     </div>
//   )
// }
// frontend/src/components/layout/AppLayout.tsx

import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
import { DeleteNoteModal } from '@/components/modals/DeleteNoteModal'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* FIXED SIDEBAR */}
        <Sidebar />
      

      {/* RIGHT SIDE */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        
        {/* FIXED NAVBAR */}
        <Navbar />

        {/* ONLY THIS AREA SCROLLS */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

      <DeleteNoteModal />
    </div>
  )
}