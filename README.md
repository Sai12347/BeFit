# BeFittttt
# BeFit: Daily Diet Adjustment System

BeFit is a web application that helps users track their daily nutrition and adjust their meal plans based on their goals.

**Live demo:** [add your deployed link here]

## Features

- User sign-up and login with authentication
- Personal profile with health details and fitness goals
- Daily nutrition tracking (calories and macros)
- Meal plans that adjust to the user's daily intake and goals
- Responsive interface that works on desktop and mobile

> Edit this list so it matches exactly what your app does. Delete anything that isn't built yet.

## Tech Stack

| Layer | Technology |
|---|---|
| Front end | React, TypeScript, Vite |
| Styling | Tailwind CSS |
| Database and auth | Supabase (schema in `supabase/migrations`) |
| Tooling | ESLint, PostCSS |

## Project Structure

```
BeFit/
├── src/                  # React components, pages and logic
├── supabase/migrations/  # Database schema migrations
├── index.html
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm
- A free [Supabase](https://supabase.com) project

### Installation

```bash
git clone https://github.com/Sai12347/BeFit.git
cd BeFit
npm install
```

### Environment variables

Create a `.env` file in the project root:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Never commit your `.env` file. It is already listed in `.gitignore`.

### Database setup

Run the SQL files in `supabase/migrations` in order using the Supabase SQL editor or the Supabase CLI.

### Run locally

```bash
npm run dev
```

Open the local address printed in the terminal, usually `http://localhost:5173`.

### Build for production

```bash
npm run build
```

## Screenshots

Add two or three screenshots here, for example:

```
![Dashboard](screenshots/dashboard.png)
```

## Roadmap

- [ ] Add unit and integration tests
- [ ] Add CI to run lint and build on every push
- [ ] Add accessibility checks (WCAG)
- [ ] Deploy to a public URL

## Author

**Sivasaikrishna Chenchu**
[LinkedIn](https://linkedin.com/in/siva-sai-krishna-580045275) | [GitHub](https://github.com/Sai12347)

