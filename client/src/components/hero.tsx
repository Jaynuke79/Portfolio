import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function Hero() {
  const [typedText, setTypedText] = useState("");
  const fullText = "Alex Chen";

  useEffect(() => {
    let i = 0;
    const typeWriter = () => {
      if (i < fullText.length) {
        setTypedText(fullText.slice(0, i + 1));
        i++;
        setTimeout(typeWriter, 100);
      }
    };
    setTimeout(typeWriter, 500);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80;
      const elementPosition = element.offsetTop - offset;
      window.scrollTo({
        top: elementPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <section id="home" className="min-h-screen flex items-center justify-center relative cyber-grid">
      <div className="absolute inset-0 bg-gradient-to-br from-black via-transparent to-black opacity-80"></div>
      <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
        <div className="animate-slide-up">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Hi, I'm <span className="gradient-text">{typedText}</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8">
            Computer Science Student & <span className="text-green-400">Cybersecurity Enthusiast</span>
          </p>
          
          <div className="mb-8 animate-float">
            <img 
              src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400" 
              alt="Modern cybersecurity workspace with multiple monitors" 
              className="rounded-xl shadow-2xl mx-auto w-full max-w-2xl glow-blue"
              loading="lazy"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => scrollToSection("projects")}
              className="bg-cyan-500 hover:bg-cyan-400 text-black px-8 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
            >
              View My Work
            </Button>
            <Button 
              variant="outline"
              onClick={() => scrollToSection("contact")}
              className="border-cyan-500 text-cyan-500 hover:bg-cyan-500 hover:text-black px-8 py-3 rounded-lg font-semibold transition-all duration-300"
            >
              Get In Touch
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
