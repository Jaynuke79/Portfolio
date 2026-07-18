import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function Skills() {
  const skillCategories = [
    {
      title: "Programming Languages",
      icon: "fas fa-code",
      color: "text-cyan-400",
      skills: [
        { name: "Python", level: 90, color: "bg-cyan-500" },
        { name: "TypeScript & React", level: 85, color: "bg-blue-500" },
        { name: "C / C++", level: 75, color: "bg-purple-500" },
      ]
    },
    {
      title: "Cybersecurity",
      icon: "fas fa-shield-alt",
      color: "text-green-400",
      skills: [
        { name: "Network Security", level: 90, color: "bg-green-500" },
        { name: "Zero Trust Principles", level: 85, color: "bg-cyan-500" },
        { name: "SecOps", level: 80, color: "bg-purple-500" },
        { name: "AuthN & AuthZ Systems", level: 80, color: "bg-red-500" },
      ]
    },
    {
      title: "AI & Backend",
      icon: "fas fa-robot",
      color: "text-purple-400",
      skills: [
        { name: "AI Agent Orchestration", level: 90, color: "bg-purple-500" },
        { name: "AI/ML Modeling", level: 85, color: "bg-cyan-500" },
        { name: "Backend Services & REST APIs", level: 85, color: "bg-green-500" },
        { name: "Testing & Evaluation Automation", level: 80, color: "bg-blue-500" },
      ]
    }
  ];

  const certifications = [
    { name: "Published Researcher", status: (
        <>
          Springer — MobiSec 2025 <br />
          Sapporo, Japan
        </>
      ), icon: "fas fa-book", color: "text-purple-400" },
    { name: "Security+", status: "In Progress", icon: "fas fa-certificate", color: "text-cyan-400" },
    { name: "CTF Competitor", status: (
        <>
          Top 15 in RazorHack 2024 <br />
          Top 10 in Cybersecurity Challenge SHPE 2024
        </>
      ), icon: "fas fa-trophy", color: "text-green-400" },
    { name: "Student Leadership", status: (
        <>
          ASG House Speaker <br />
          President, CS & Cybersecurity Clubs
        </>
      ), icon: "fas fa-users", color: "text-yellow-400" },
  ];

  return (
    <section id="skills" className="py-20 bg-gradient-to-br from-gray-900 to-black">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-16 gradient-text">Technical Skills</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {skillCategories.map((category, index) => (
            <Card key={index} className="glass-morphism border-gray-800">
              <CardContent className="p-6">
                <h3 className={`text-xl font-semibold mb-6 ${category.color} flex items-center`}>
                  <i className={`${category.icon} mr-3`}></i>
                  {category.title}
                </h3>
                <div className="space-y-4">
                  {category.skills.map((skill) => (
                    <div key={skill.name} className="skill-item">
                      <div className="flex justify-between mb-2">
                        <span className="text-white font-medium">{skill.name}</span>
                        <span className={category.color}>{skill.level}%</span>
                      </div>
                      <Progress 
                        value={skill.level} 
                        className="h-2 bg-gray-700"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Certifications */}
        <div className="mt-16">
          <h3 className="text-2xl font-semibold text-center mb-8 text-white">Certifications & Achievements</h3>
          <div className="flex flex-wrap justify-center gap-6">
            {certifications.map((cert, index) => (
              <Card key={index} className="glass-morphism border-gray-800 text-center p-4 min-w-[150px]">
                <CardContent className="p-0">
                  <i className={`${cert.icon} ${cert.color} text-2xl mb-2`}></i>
                  <div className="text-sm font-medium text-white">{cert.name}</div>
                  <div className="text-xs text-gray-400">{cert.status}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
