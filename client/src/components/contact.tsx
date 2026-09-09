import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, MapPin } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/icons";
import Reveal from "@/components/reveal";
import emailjs from '@emailjs/browser';

const HONEYPOT_FIELD = "website";
const MIN_FILL_TIME_MS = 3000;

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const mountedAt = useRef(Date.now());

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;

    const honeypot = form.elements.namedItem(HONEYPOT_FIELD) as HTMLInputElement | null;
    const filledTooFast = Date.now() - mountedAt.current < MIN_FILL_TIME_MS;
    if (honeypot?.value || filledTooFast) {
      form.reset();
      toast({
        title: "Message Sent!",
        description: "Thank you for your message. I'll get back to you soon.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await emailjs.sendForm(
        'service_ybl7r1f',
        'template_zbihedb',
        e.target as HTMLFormElement,
        's4koIaxc-EHwml43g'
      );

      toast({
        title: "Message Sent!",
        description: "Thank you for your message. I'll get back to you soon.",
      });
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error('EmailJS error:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again or contact me directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    { icon: Mail, label: "Email", text: "jjalonzo-estra@mavs.coloradomesa.edu", href: "mailto:jjalonzo-estra@mavs.coloradomesa.edu" },
    { icon: MapPin, label: "Location", text: "Grand Junction, CO" },
  ];

  const socialLinks = [
    { icon: LinkedinIcon, label: "LinkedIn", href: "https://www.linkedin.com/in/jayae/" },
    { icon: GithubIcon, label: "GitHub", href: "https://github.com/Jaynuke79" },
  ];

  return (
    <section id="contact" className="scroll-mt-20 border-t border-border py-24">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 md:grid-cols-12 lg:px-8">
        <Reveal className="md:col-span-5">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Contact</h2>
          <p className="mt-3 max-w-[45ch] text-lg leading-relaxed text-muted-foreground">
            Open to conversations about cybersecurity, new opportunities, collaboration, or
            just nerding out on any topic.
          </p>

          <ul className="mt-8 space-y-3">
            {contactInfo.map((info) => (
              <li key={info.label} className="flex items-center gap-3 text-muted-foreground">
                <info.icon className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
                <span className="sr-only">{info.label}:</span>
                {info.href ? (
                  <a href={info.href} className="break-all underline-offset-4 hover:text-foreground hover:underline">
                    {info.text}
                  </a>
                ) : (
                  <span>{info.text}</span>
                )}
              </li>
            ))}
          </ul>

          <ul className="mt-8 flex items-center gap-4">
            {socialLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                >
                  <link.icon className="h-5 w-5" />
                </a>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal className="md:col-span-7">
          <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-border bg-card p-6 sm:p-8">
            <div className="absolute left-[-9999px] h-px w-px overflow-hidden" aria-hidden="true">
              <label htmlFor={HONEYPOT_FIELD}>Leave this field empty</label>
              <input id={HONEYPOT_FIELD} name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="from_name" type="text" autoComplete="name" required className="h-11" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="from_email" type="email" autoComplete="email" required className="h-11" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" name="subject" type="text" required className="h-11" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" name="message" rows={5} required className="resize-y" />
            </div>
            <Button type="submit" size="lg" disabled={isSubmitting} className="h-12 w-full px-6 active:scale-[0.98] sm:w-auto">
              {isSubmitting ? "Sending..." : "Send message"}
            </Button>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
