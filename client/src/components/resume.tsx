import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Eye } from "lucide-react";

export default function Resume() {
  const handleDownload = () => {
    // Create a download link for the resume PDF
    const link = document.createElement('a');
    link.href = '/resume.pdf';
    link.download = 'Alex_Chen_Resume.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const education = {
    degree: "Bachelor of Science - Computer Science",
    university: "University of Technology",
    period: "Expected 2025 • GPA: 3.8/4.0",
    concentration: "Cybersecurity Concentration"
  };

  const experiences = [
    {
      title: "Security Intern",
      company: "CyberTech Solutions",
      period: "Summer 2023",
      description: "Vulnerability assessments and penetration testing"
    },
    {
      title: "IT Support Assistant",
      company: "University IT Department",
      period: "2022 - Present",
      description: "Network troubleshooting and security monitoring"
    }
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
                <h3 className="text-2xl font-semibold mb-2 text-white">Alex Chen - Resume</h3>
                <p className="text-gray-300">Computer Science Student • Cybersecurity Focus</p>
                <p className="text-sm text-gray-400 mt-2">Last updated: December 2023</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={handleDownload}
                  className="bg-cyan-500 hover:bg-cyan-400 text-black px-6 py-3 rounded-lg font-semibold transition-all duration-300"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
                <Button 
                  variant="outline"
                  className="border-green-500 text-green-400 hover:bg-green-500 hover:text-black px-6 py-3 rounded-lg font-semibold transition-all duration-300"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Quick View
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
