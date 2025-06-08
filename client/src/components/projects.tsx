import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Github } from "lucide-react";

export default function Projects() {
  const projects = [
    {
      title: "AutoMenu",
      description: "A C++ class that takes in functions and automatically displays them in a cli menu.",
      image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
      alt: "Network security monitoring dashboard",
      technologies: ["C++"],
      techColors: ["bg-blue-600/20 text-blue-400", "bg-green-600/20 text-green-400", "bg-purple-600/20 text-purple-400"],
      titleColor: "text-cyan-400"
    },
    {
      title: "Machine Learning Research Lead",
      description: "Author of the paper: The Effect of Increased Dimensionality on Detecting Malicious Packets using Machine Learning on IoMT WiFi network traffic.",
      image: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
      alt: "Cybersecurity encryption interface",
      technologies: ["Juypyter Notebook","Sklearn","Pandas","Numpy"],
      techColors: ["bg-blue-600/20 text-blue-400", "bg-green-600/20 text-green-400", "bg-red-600/20 text-red-400"],
      titleColor: "text-green-400"
    },
    {
      title: "Pokemon Detector Webapp",
      description: "Trained and hosted ",
      image: "https://images.unsplash.com/photo-1563206767-5b18f218e8de?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
      alt: "Cybersecurity threat analysis dashboard",
      technologies: ["Python", "Docker", "Security"],
      techColors: ["bg-yellow-600/20 text-yellow-400", "bg-purple-600/20 text-purple-400", "bg-red-600/20 text-red-400"],
      titleColor: "text-purple-400"
    },
    {
      title: "Incident Response Platform",
      description: "Developed an automated incident response system for cybersecurity teams. Includes threat intelligence integration and response playbooks.",
      image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
      alt: "Data center cybersecurity infrastructure",
      technologies: ["Django", "REST API", "MITRE ATT&CK"],
      techColors: ["bg-blue-600/20 text-blue-400", "bg-green-600/20 text-green-400", "bg-orange-600/20 text-orange-400"],
      titleColor: "text-yellow-400"
    },
    {
      title: "Blockchain Security Audit",
      description: "Conducted security audits of smart contracts using Solidity and various testing frameworks. Identified and documented critical vulnerabilities.",
      image: "https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
      alt: "Software development and cybersecurity coding",
      technologies: ["Solidity", "Truffle", "Web3"],
      techColors: ["bg-purple-600/20 text-purple-400", "bg-yellow-600/20 text-yellow-400", "bg-blue-600/20 text-blue-400"],
      titleColor: "text-pink-400"
    },
    {
      title: "SIEM Integration Tool",
      description: "Built a custom SIEM integration platform for log aggregation and threat detection. Features real-time monitoring and automated alerting.",
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
      alt: "Cybersecurity team collaboration workspace",
      technologies: ["ELK Stack", "Python", "Splunk"],
      techColors: ["bg-red-600/20 text-red-400", "bg-blue-600/20 text-blue-400", "bg-green-600/20 text-green-400"],
      titleColor: "text-green-400"
    }
  ];

  return (
    <section id="projects" className="py-20 bg-black">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-16 gradient-text">Featured Projects</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <Card 
              key={index}
              className="glass-morphism border-gray-800 hover:scale-105 transition-all duration-300 group hover:glow-blue"
            >
              <CardContent className="p-6">
                <img 
                  src={project.image}
                  alt={project.alt}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                  loading="lazy"
                />
                <h3 className={`text-xl font-semibold mb-3 ${project.titleColor}`}>
                  {project.title}
                </h3>
                <p className="text-gray-300 mb-4 text-sm leading-relaxed">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.technologies.map((tech, techIndex) => (
                    <Badge 
                      key={tech}
                      className={`${project.techColors[techIndex]} border-none text-xs`}
                    >
                      {tech}
                    </Badge>
                  ))}
                </div>
                <div className="flex space-x-4">
                  <Button
                    variant="link"
                    className="text-cyan-400 hover:text-cyan-300 p-0 h-auto font-medium"
                  >
                    <Github className="mr-1 h-4 w-4" />
                    Code
                  </Button>
                  <Button
                    variant="link"
                    className="text-green-400 hover:text-green-300 p-0 h-auto font-medium"
                  >
                    <ExternalLink className="mr-1 h-4 w-4" />
                    Demo
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
