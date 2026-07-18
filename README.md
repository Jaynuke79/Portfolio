# Cybersecurity Portfolio

A modern, responsive digital portfolio built with React and TypeScript, showcasing cybersecurity expertise and projects.

## 🚀 Live Demo

Visit the live portfolio: [j2a3e.com](https://j2a3e.com)

## 🛠️ Technologies Used

- React 18 with TypeScript
- Tailwind CSS for styling
- Lucide React for icons
- Vite for build tooling

## 📱 Features

- **Responsive Design**: Optimized for all devices
- **Dark Theme**: Cybersecurity-inspired color scheme
- **Smooth Animations**: Professional transitions and effects
- **Interactive Navigation**: Smooth scrolling between sections
- **Live Project Showcase**: Cards are driven by a curated repo list enriched from the GitHub API — stars, language, last-pushed date, links, and auto-updating OpenGraph images — with a baked snapshot as offline fallback
- **Skills Display**: Technical competencies and certifications
- **Contact Form**: Professional contact interface

## 🏗️ Deployment to GitHub Pages

This portfolio is configured for automatic deployment to GitHub Pages using GitHub Actions.

### Setup Instructions:

1. **Fork or Clone** this repository to your GitHub account

2. **Enable GitHub Pages**:
   - Go to your repository settings
   - Navigate to "Pages" in the left sidebar
   - Set source to "GitHub Actions"

3. **Push to Main Branch**:
   - Any push to the `main` branch will trigger automatic deployment
   - A daily scheduled run also rebuilds the site so the baked GitHub project data stays fresh
   - The workflow will build and deploy your site

4. **Access Your Site**:
   - Your portfolio will be available at: `https://[your-username].github.io/[repository-name]` (this repo deploys to the custom domain `j2a3e.com` via a CNAME written in the workflow)

## 📝 Customization

To personalize this portfolio with your information, edit these files:

### Personal Information
- `client/src/components/hero.tsx` - Name, title, and intro
- `client/src/components/contact.tsx` - Contact details and social links
- `client/index.html` - Page title and meta descriptions

### Content Sections
- `client/src/components/about.tsx` - Bio and background
- `client/src/components/projects.tsx` - Project details and descriptions
- `client/src/components/skills.tsx` - Technical skills and certifications
- `client/src/components/resume.tsx` - Education and experience

### Project Showcase
- `client/src/lib/featured-projects.ts` - Which repos appear, their order, and per-project overrides

### Resume File
- Replace `public/Jayden_Alonzo-Estrada_Resume.pdf` with your actual resume (keep the filename in sync with `client/src/components/resume.tsx`)

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Type-check
npm run check

# Refresh the baked GitHub project snapshot
npm run fetch-projects

# Build for production (outputs to docs/)
npm run build
```

## 📦 Project Structure

```
├── client/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # React hooks
│   │   ├── lib/            # Utilities, featured-project config, GitHub data
│   │   └── index.css       # Global styles
│   └── index.html          # HTML template
├── public/                 # Static assets (resume PDF, robots.txt, sitemap)
├── scripts/                # Build-time scripts (GitHub data fetch, password hashing)
├── .github/
│   └── workflows/
│       └── deploy.yml      # GitHub Actions workflow
└── docs/                   # Built files for GitHub Pages
```

## 🎨 Color Scheme

The portfolio uses a cybersecurity-inspired dark theme:
- Primary: Cyber Blue (#00D9FF)
- Secondary: Cyber Green (#00FF94)
- Accent: Cyber Purple (#A855F7)
- Background: Dark Gray (#0A0A0A)

## 📄 License

This project is open source and available under the MIT License.