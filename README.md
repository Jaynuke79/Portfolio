# Cybersecurity Portfolio

A modern, responsive digital portfolio built with React and TypeScript, showcasing cybersecurity expertise and projects.

## 🚀 Live Demo

Visit the live portfolio: [Your GitHub Pages URL will be here]

## 🛠️ Technologies Used

- React 18 with TypeScript
- Tailwind CSS for styling
- Framer Motion for animations
- Lucide React for icons
- Vite for build tooling

## 📱 Features

- **Responsive Design**: Optimized for all devices
- **Dark Theme**: Cybersecurity-inspired color scheme
- **Smooth Animations**: Professional transitions and effects
- **Interactive Navigation**: Smooth scrolling between sections
- **Project Showcase**: Detailed project presentations
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
   - The workflow will build and deploy your site

4. **Access Your Site**:
   - Your portfolio will be available at: `https://[your-username].github.io/[repository-name]`

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

### Resume File
- Replace `public/resume.pdf` with your actual resume

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📦 Project Structure

```
├── client/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── lib/            # Utility functions
│   │   └── index.css       # Global styles
│   └── index.html          # HTML template
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

This project is open source and available under the [MIT License](LICENSE).