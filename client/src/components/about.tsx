import { Badge } from "@/components/ui/badge";

export default function About() {
  const skills = [
    { name: "Cybersecurity", color: "bg-cyan-500/20 text-cyan-400" },
    { name: "AI/Machine Learning", color: "bg-green-500/20 text-green-400" },
    { name: "AI Agent Orchestration", color: "bg-purple-500/20 text-purple-400" },
    { name: "Python", color: "bg-yellow-500/20 text-yellow-400" },
    { name: "TypeScript & React", color: "bg-blue-500/20 text-blue-400" },
  ];

  return (
    <section id="about" className="py-20 bg-gradient-to-br from-black to-gray-900">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-16 gradient-text">About Me</h2>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <p className="text-lg text-gray-300 leading-relaxed">
              I'm a computer science student at Colorado Mesa University specializing in cybersecurity and applied AI, currently building deep CRM integrations and AI agent pipelines as an AI Services Intern at EggNest.ai.
            </p>
            <p className="text-lg text-gray-300 leading-relaxed">
              I lead a 6-person research team whose work on detecting malicious IoMT network traffic was published by Springer and presented at MobiSec 2025 in Sapporo, Japan. Outside the lab I preside over CMU's student House of Representatives and run the CS and Cybersecurity clubs.
            </p>
            <p className="text-lg text-gray-300 leading-relaxed">
              Whether it's analyzing network packets or orchestrating AI agent pipelines, I operate with precision, purpose, and an eye on the future.
            </p>
            <div className="flex flex-wrap gap-3">
              {skills.map((skill) => (
                <Badge 
                  key={skill.name}
                  className={`${skill.color} border-none px-3 py-1 text-sm`}
                >
                  {skill.name}
                </Badge>
              ))}
            </div>
          </div>
          <div className="relative">
            <img
              src="/headshot.jpg"
              alt="Jayden Alonzo-Estrada headshot"
              className="rounded-xl shadow-2xl w-full max-w-md mx-auto glow-green"
              loading="lazy"
            />
            <div className="absolute -bottom-6 -right-6 glass-morphism p-4 rounded-xl">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm">Currently Learning</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
