
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Menu, X } from 'lucide-react';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <nav 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-4 px-6",
        isScrolled 
          ? "bg-white/80 backdrop-blur-lg shadow-sm" 
          : "bg-transparent"
      )}
    >
      <div className="container max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <a href="/" className="flex items-center">
            <img 
              src="/lovable-uploads/ce207080-f6c2-430d-9621-79d32ab08655.png" 
              alt="Convrt.ai Logo" 
              className="h-8 md:h-10"
            />
          </a>
        </div>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-8">
          <a href="#how-it-works" className="text-convrt-dark-blue/80 hover:text-convrt-dark-blue font-medium transition-colors">
            How It Works
          </a>
          <a href="#testimonials" className="text-convrt-dark-blue/80 hover:text-convrt-dark-blue font-medium transition-colors">
            Case Studies
          </a>
          <a href="#product" className="text-convrt-dark-blue/80 hover:text-convrt-dark-blue font-medium transition-colors">
            Product
          </a>
          <a href="#pricing" className="text-convrt-dark-blue/80 hover:text-convrt-dark-blue font-medium transition-colors">
            Pricing
          </a>
          <a href="#cta" className="button-primary">
            Get Started
          </a>
        </div>
        
        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-convrt-dark-blue" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg py-4 px-6">
          <div className="flex flex-col space-y-4">
            <a 
              href="#how-it-works" 
              className="text-convrt-dark-blue/80 hover:text-convrt-dark-blue font-medium transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              How It Works
            </a>
            <a 
              href="#testimonials" 
              className="text-convrt-dark-blue/80 hover:text-convrt-dark-blue font-medium transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Case Studies
            </a>
            <a 
              href="#product" 
              className="text-convrt-dark-blue/80 hover:text-convrt-dark-blue font-medium transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Product
            </a>
            <a 
              href="#pricing" 
              className="text-convrt-dark-blue/80 hover:text-convrt-dark-blue font-medium transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Pricing
            </a>
            <a 
              href="#cta" 
              className="button-primary w-full text-center"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Get Started
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
