
import { Facebook, Twitter, Linkedin, Instagram, X } from "lucide-react";
import { XMarkIcon } from '@heroicons/react/24/solid';

export const Footer = () => {
  return (
    <footer className="bg-custom-medium-gray text-custom-dark-maroon" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <img src="/Logo-cropped.png" alt="XByzeth Logo" className="h-10 mb-4" />
            <p className="text-custom-dark-gray mb-4">
              Your trusted partner for business formation and compliance solutions.
            </p>
            <div className="flex space-x-4">
              <a href="https://www.facebook.com/people/XBYZ/61575614310979/#" className="text-custom-dark-gray hover:text-white transition-colors" aria-label="Facebook" rel="noopener noreferrer" target="_blank">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://x.com/i/flow/login?redirect_after_login=%2Fxbyzeth" className="text-custom-dark-gray hover:text-white transition-colors" aria-label="X" rel="noopener noreferrer" target="_blank">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24"
                  className="w-5 h-5 text-current"
                  fill="currentColor"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="https://www.linkedin.com/" className="text-custom-dark-gray hover:text-white transition-colors" aria-label="LinkedIn" rel="noopener noreferrer" target="_blank">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="https://www.instagram.com/xbyzeth/" className="text-custom-dark-gray hover:text-white transition-colors" aria-label="Instagram" rel="noopener noreferrer" target="_blank">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* <div>
            <h4 className="text-custom-dark-maroon font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-gray-400" role="list">
              <li><a href="#" className="hover:text-white transition-colors">Business Formation</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Registered Agent</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Tax Services</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Business Compliance</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-custom-dark-maroon font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-gray-400" role="list">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Our Team</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-custom-dark-maroon font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-custom-dark-gray" role="list">
              <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div> */}
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-custom-dark-gray">
          <p>&copy; {new Date().getFullYear()} X<span className="text-custom-dark-maroon font-normal">by</span>Z. All rights reserved.</p>
          <div className="mt-2 text-center">
            Website Developed by{' '}
            <a
              href="https://www.citrusappslab.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-custom-dark-gray hover:text-custom-dark-maroon transition-colors duration-200"
            >
              Citrus Apps Lab
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
