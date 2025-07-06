import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Eye } from "lucide-react";

export default function Resume() {
  const handleDownload = () => {
    // Create a download link for the resume PDF
    const link = document.createElement('a');
    link.href = '/Jayden_Alonzo-Estrada_Resume.pdf';
    link.download = 'Jayden_Alonzo-Estrada_Resume.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const education = {
    degree: "Bachelor of Science - Computer Science",
    university: "Colorado Mesa University",
    period: "Expected 2027 • GPA: 3.56/4.0",
    concentration: "Cybersecurity Focus"
  };

  const experiences = [
    {
      title: "Engineering Intern",
      company: "Fiore Industries",
      period: "Summer 2024",
      description: "Microcontroller programming, radio to optical systems, and general business management"
    },
    {
      title: "Software Engineering Intern",
      company: "JGMS Government Services",
      period: "Summer 2025",
      description: "R/D on a custom RAG pipeline and project management"
    },
    {
      title: "Student Research Lead",
      company: "Colorado Mesa University",
      period: "2023 - Present",
      description: "Lead a group of student reserachers on topics like cybersecurity and machine learning"
    },
  ];

  return (
    <section id="resume" className="py-20 bg-black">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold mb-8 gradient-text">Resume</h2>
        <p className="text-xl text-gray-300 mb-12">
          Download my complete resume to learn more about my experience and qualifications.
        </p>

        <Card className="glass-morphism border-gray-800 rounded-2xl p-8 mb-8">
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="text-left mb-6 md:mb-0">
                <h3 className="text-2xl font-semibold mb-2 text-white">Jayden Alonzo-Estrada - Resume</h3>
                <p className="text-gray-300">Computer Science Student • Cybersecurity Focus</p>
                <p className="text-sm text-gray-400 mt-2">Last updated: Feb 2025</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-green-500 text-black hover:scale-105 transition-all duration-300"
                asChild
              >
                <a href="https://drive.google.com/drive/folders/1Jgee_UwcyYSaiMYEvPsW3_bbYSC6pExa?usp=sharing" target="_blank" rel="noopener noreferrer">
                  <Download className="mr-2 h-4 w-4" />
                  Download Resume
                </a>
              </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-8 text-left">
          <Card className="glass-morphism border-gray-800">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4 text-cyan-400 flex items-center">
                <i className="fas fa-graduation-cap mr-3"></i>Education
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-white">{education.degree}</h4>
                  <p className="text-green-400">{education.university}</p>
                  <p className="text-sm text-gray-400">{education.period}</p>
                  <p className="text-sm text-gray-300 mt-1">{education.concentration}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-morphism border-gray-800">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4 text-green-400 flex items-center">
                <i className="fas fa-briefcase mr-3"></i>Experience
              </h3>
              <div className="space-y-4">
                {experiences.map((exp, index) => (
                  <div key={index}>
                    <h4 className="font-semibold text-white">{exp.title}</h4>
                    <p className="text-cyan-400">{exp.company}</p>
                    <p className="text-sm text-gray-400">{exp.period}</p>
                    <p className="text-sm text-gray-300 mt-1">{exp.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}