import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, MapPin } from "lucide-react";

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    setTimeout(() => {
      toast({
        title: "Message Sent!",
        description: "Thank you for your message. I'll get back to you soon.",
      });
      setIsSubmitting(false);
      (e.target as HTMLFormElement).reset();
    }, 1000);
  };

  const contactInfo = [
    {
      icon: Mail,
      text: "jjalonzo-estra@mavs.coloradomesa.edu",
      color: "text-cyan-400"
    },
    {
      icon: Phone,
      text: "+1 (808) 491-5116",
      color: "text-green-400"
    },
    {
      icon: MapPin,
      text: "Grand Junction, CO",
      color: "text-purple-400"
    }
  ];

  const socialLinks = [
    { icon: "fab fa-linkedin", href: "#", color: "text-cyan-400 hover:text-cyan-300" },
    { icon: "fab fa-github", href: "#", color: "text-white hover:text-gray-300" },
    { icon: "fab fa-twitter", href: "#", color: "text-cyan-400 hover:text-blue-300" },
    { icon: "fab fa-youtube", href: "#", color: "text-red-400 hover:text-red-300" },
  ];

  return (
    <section id="contact" className="py-20 bg-gradient-to-br from-gray-900 to-black">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-16 gradient-text">Get In Touch</h2>
        
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h3 className="text-2xl font-semibold mb-6 text-white">Let's Connect</h3>
            <p className="text-gray-300 mb-8 leading-relaxed">
              I'm always interested in discussing cybersecurity, new opportunities, 
              collaborating on innovative projects, or just nerding out on any topics.
              Feel free to reach out!
            </p>
            
            <div className="space-y-4">
              {contactInfo.map((info, index) => {
                const IconComponent = info.icon;
                return (
                  <div key={index} className="flex items-center">
                    <IconComponent className={`${info.color} mr-4 h-5 w-5`} />
                    <span className="text-gray-300">{info.text}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex space-x-6 mt-8">
              {socialLinks.map((link, index) => (
                <a 
                  key={index}
                  href={link.href} 
                  className={`${link.color} text-2xl transition-colors duration-200`}
                >
                  <i className={link.icon}></i>
                </a>
              ))}
            </div>
          </div>

          <Card className="glass-morphism border-gray-800 rounded-xl">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="name" className="block text-sm font-medium mb-2 text-gray-300">
                    Name
                  </Label>
                  <Input 
                    id="name"
                    type="text" 
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:border-cyan-500 focus:outline-none transition-colors text-white" 
                    placeholder="Your Name" 
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-300">
                    Email
                  </Label>
                  <Input 
                    id="email"
                    type="email" 
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:border-cyan-500 focus:outline-none transition-colors text-white" 
                    placeholder="your@email.com" 
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="subject" className="block text-sm font-medium mb-2 text-gray-300">
                    Subject
                  </Label>
                  <Input 
                    id="subject"
                    type="text" 
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:border-cyan-500 focus:outline-none transition-colors text-white" 
                    placeholder="Subject" 
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="message" className="block text-sm font-medium mb-2 text-gray-300">
                    Message
                  </Label>
                  <Textarea 
                    id="message"
                    rows={4} 
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:border-cyan-500 focus:outline-none transition-colors resize-none text-white" 
                    placeholder="Your message..." 
                    required 
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-cyan-500 to-green-500 text-black py-3 rounded-lg font-semibold hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
