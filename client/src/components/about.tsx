import { Badge } from "@/components/ui/badge";

export default function About() {
  const skills = [
    { name: "Cybersecurity", color: "bg-cyan-500/20 text-cyan-400" },
    { name: "Ai/Machine Learning", color: "bg-green-500/20 text-green-400" },
    // { name: "Network Security", color: "bg-purple-500/20 text-purple-400" },
    { name: "Python", color: "bg-yellow-500/20 text-yellow-400" },
  ];

  return (
    <section id="about" className="py-20 bg-gradient-to-br from-black to-gray-900">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-16 gradient-text">About Me</h2>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <p className="text-lg text-gray-300 leading-relaxed">
              I'm an advanced computer science student specializing in cybersecurity and applied Ai at Colorado Mesa University. Driven by a passion for what I do, I "cut through fluff" of a situation and tackle complex challenges head-on with practical application in mind.
            </p>
            <p className="text-lg text-gray-300 leading-relaxed">
              With a solid foundation in C++ and Python, I'm committed to staying ahead of curve by constantly challenging myself to expand my domain of expertise. 
            </p>
            <p className="text-lg text-gray-300 leading-relaxed">
              Whether it's analyzing network packets or engineering robust Ai systems, my main focus is to operate with precision, purpose, and an eye on the future.

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
              src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400" 
              alt="Modern tech workspace setup with cybersecurity tools" 
              className="rounded-xl shadow-2xl w-full glow-green"
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
