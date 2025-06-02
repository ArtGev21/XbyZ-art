import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from '@/components/ui/toaster';

export const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    service: "",
    business: "",
    message: ""
  });

  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {

      const googleFormUrl = "https://docs.google.com/forms/d/e/1FAIpQLSedg3nwjv0QGSirNVk9zrG9UZn7OrxuD-eaIl6tswaT5IWOYw/formResponse";
      // Create form data for submission
      const formDataEncoded = new URLSearchParams();
      formDataEncoded.append('entry.2005620554', formData.name);
      formDataEncoded.append('entry.1045781291', formData.email);
      formDataEncoded.append('entry.512427089', formData.service);
      formDataEncoded.append('entry.902341154', formData.business);
      formDataEncoded.append('entry.839337160', formData.message);

      // Submit to Google Forms
      await fetch(googleFormUrl, {
        method: 'POST',
        body: formDataEncoded,
        mode: 'no-cors'
      });

      // const res = await fetch("/api/contact", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(formData)
      // });

      setFormData({
        name: '',
        email: '',
        service: '',
        business: '',
        message: ''
      });

      // Show success message
      toast({
        title: "Message Sent! 🎉",
        description: "We've received your tour request and will contact you within 24 hours."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit form. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-custom-light-gray min-h-screen flex justify-center" id="contact">
      <div className="max-w-[1500px] w-full px-4 sm:px-6 lg:px-8 ">
        <div className="text-center mb-24 mt-20">
          <h2 className="text-4xl font-bold text-custom-dark-maroon">
            Have More Questions? We've Got You!
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          {/* Left Box */}
          <div className="bg-white/90 backdrop-blur-md p-8 rounded-2xl shadow-lg text-custom-rich-black">
            <h3 className="text-2xl font-semibold text-custom-dark-maroon mb-6">Contact Information</h3>

            {/* Contact Details 2x2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10 text-sm font-medium">
              <div className="flex items-start gap-3">
                <MapPin className="w-7 h-7 text-custom-dark-maroon" />
                <span className="">5250 Lankershim Blvd, North Hollywood, CA 91601</span>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-custom-dark-maroon" />
                <span>(844) 500-0005</span>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-custom-dark-maroon" />
                <span>info@xbyzeth.com</span>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-custom-dark-maroon" />
                <span>Mon – Fri, 9:00 AM – 5:00 PM</span>
              </div>
            </div>

            {/* Embedded Map */}
            <div className="rounded-lg overflow-hidden shadow-md bg-black">
              <iframe
                title="Google Map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3303.700792520806!2d-118.37084108478216!3d34.16538368056765!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80c2953fc2975e8f%3A0xe7ef9a9db389a3a7!2s5250%20Lankershim%20Blvd%2C%20North%20Hollywood%2C%20CA%2091601!5e0!3m2!1sen!2sus!4v1717098765432"
                width="100%"
                height="250"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-[340px] border-none"
              />
            </div>
          </div>

          {/* Right Box: Contact Form */}
          <div className="bg-white/90 backdrop-blur-md p-8 rounded-2xl shadow-lg">
            <h2 className="text-2xl font-semibold text-custom-dark-maroon mb-6">Get in Touch</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-custom-dark-maroon mb-1">Full Name*</label>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-custom-dark-maroon mb-1">Email*</label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="service" className="block text-sm font-medium text-custom-dark-maroon mb-1">
                  Service*
                </label>
                <select
                  id="service"
                  name="service"
                  value={formData.service}
                  onChange={handleChange}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-dark-maroon focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select a service</option>
                  <option value="Accounting Guidance">Accounting Guidance</option>
                  <option value="Taxation Guidance">Taxation Guidance</option>
                  <option value="Trademark Guidance">Trademark Guidance</option>
                </select>
              </div>
              <div>
                <label htmlFor="business" className="block text-sm font-medium text-custom-dark-maroon mb-1">Business Name*</label>
                <Input
                  type="text"
                  id="business"
                  name="business"
                  value={formData.business}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-custom-dark-maroon mb-1">Business Description*</label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={5}
                  required
                />
              </div>
              <div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-custom-dark-maroon text-custom-light-gray hover:bg-custom-deep-maroon px-6 py-3 text-base font-semibold hover:scale-105 transition-all duration-300"
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
                {status === "sent" && (
                  <p className="mt-2 text-green-600 text-sm">Message sent successfully!</p>
                )}
                {status === "error" && (
                  <p className="mt-2 text-red-600 text-sm">Something went wrong. Please try again.</p>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};