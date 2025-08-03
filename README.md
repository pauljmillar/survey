# Next.js Multi-tenant Starter Template

A minimalistic multi-tenant Next.js starter template with minimal setup and a modular design. Bring your own backend and database.

[Demo](https://stack-template.vercel.app/)

## Landing Page

<div align="center">
<img src="./assets/landing-page.png" alt="Teams" width="600"/>
</div>

## Dashboard

<div align="center">
<img src="./assets/dashboard-overview.png" alt="Teams" width="600"/>
</div>

## Multi-tenancy (Teams)

<div align="center">
<img src="./assets/team-switcher.png" alt="Teams" width="400"/>
</div>

## Account Settings

<div align="center">
<img src="./assets/account-settings.png" alt="Teams" width="500"/>
</div>

## Getting Started

1. Clone the repository

    ```bash
    git clone git@github.com:stack-auth/stack-template.git
    ```

2. Install dependencies

    ```bash
    npm install
    ```

3. Register an account on [Stack Auth](https://stack-auth.com), copy the keys from the dashboard, and paste them into the `.env.local` file. Then, enable "client team creation" on the team settings tab.

    If you want to learn more about Stack Auth or self-host it, check out the [Docs](https://docs.stack-auth.com) and [GitHub](https://github.com/stack-auth/stack).

4. Start the development server and go to [http://localhost:3000](http://localhost:3000)

    ```bash
    npm run dev 
    ```

## Features & Tech Stack

- Next.js 14 app router
- TypeScript
- Tailwind & Shadcn UI
- Stack Auth
- Multi-tenancy (teams/orgs)
- Dark mode

## Inspired by

- [Shadcn UI](https://github.com/shadcn-ui/ui)
- [Shadcn Taxonomy](https://github.com/shadcn-ui/taxonomy)

# TopNavBar Component

## Overview

The `TopNavBar` component provides a minimalist, accessible, and responsive navigation bar for the app, matching the original repo's black/white design. It includes:
- Dark/light theme selector
- Menu options: About, Earn Points, Redeem Points
- Profile dropdown (Account settings, Toggle theme, Sign out)
- Auth buttons (Sign in/up) when logged out
- Mobile-optimized menu

## Usage

The `TopNavBar` is imported and rendered globally in `app/layout.tsx`:

```tsx
import { TopNavBar } from '@/components/top-nav-bar'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <TopNavBar />
        <div className="pt-16">{children}</div>
      </body>
    </html>
  )
}
```

## Accessibility
- All nav/menu elements are keyboard navigable and ARIA-labeled.
- Profile dropdown and mobile menu are accessible via keyboard and screen readers.

## Customization
- To add or change menu options, edit the `MENU_OPTIONS` array in `components/top-nav-bar.tsx`.
- The component uses Tailwind CSS for styling and is fully responsive.
- The theme selector uses the `ColorModeSwitcher` component.

## Mobile Support
- The mobile menu is accessible via a hamburger button and includes all menu/auth/profile options.

## Auth Integration
- Uses Clerk.dev for authentication, sign in/up, and profile dropdown.

## Minimalist Design
- Black/white color scheme with subtle transitions and focus states.
- Consistent with the original repo's minimalist look and feel.

---

For further customization or to add new menu items, update the `MENU_OPTIONS` array and adjust the JSX as needed.
