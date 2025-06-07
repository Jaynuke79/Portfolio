export default function Footer() {
  const footerLinks = [
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
    { label: "Sitemap", href: "#" },
  ];

  return (
    <footer className="bg-black border-t border-gray-800 py-8">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <p className="text-gray-400">
          © 2025 Jayden Alonzo-Estrada. Built with Ai tools and restless nights.
        </p>
        <div className="flex justify-center space-x-6 mt-4">
          {footerLinks.map((link) => (
            <a 
              key={link.label}
              href={link.href} 
              className="text-gray-400 hover:text-cyan-400 transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
