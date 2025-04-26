import React, { useState } from 'react';
import { 
  Calendar, 
  Check, 
  ChevronRight, 
  Sparkles, 
  Upload, 
  Video, 
  X
} from 'lucide-react';

const OnboardingComponent = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    resume: null,
    additionalDetails: ''
  });
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);

  const totalSteps = 2; // Only 2 steps: Google Connect and Resume Upload

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFormData(prev => ({
        ...prev,
        resume: e.target.files![0]
      }));
    }
  };

  const nextStep = () => {
    // Skip directly to resume upload if connected to Google
    if (isGoogleConnected && formData.fullName && step === 1) {
      setStep(2); // Go directly to resume upload
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if resume is uploaded (required)
    if (!formData.resume) {
      alert('Please upload your resume to continue');
      return;
    }
    
    // In a real app, this would submit the data to a backend
    console.log('Form submitted:', formData);
    // Redirect to dashboard or confirmation page
    window.location.href = '/dashboard'; // Or use react-router navigate
  };

  return (
    <div className="min-h-screen bg-[#F9F6F3] flex flex-col">
      {/* Simplified Navbar for Onboarding */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="container mx-auto flex justify-start items-center">
          <a href="/" className="flex items-center gap-2">
            <img 
              src="src/assets/logo.png" 
              alt="project dave logo" 
              className="h-12 md:h-14"
            />
            <span className="font-medium text-project-dave-dark-blue text-lg">project dave</span>
          </a>
        </div>
      </header>

      <div className="flex-1 container mx-auto max-w-4xl py-12 px-6">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-project-dave-dark-blue">
              Step {step} of {totalSteps}
            </span>
            <span className="text-sm font-medium text-project-dave-purple">
              {Math.round((step / totalSteps) * 100)}% Complete
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-project-dave-purple rounded-full transition-all duration-300 ease-in-out" 
              style={{ width: `${(step / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
          {/* Step 1: Welcome and Google OAuth */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-project-dave-purple/10 text-project-dave-purple mb-4">
                  <Sparkles className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Let's Get Started</span>
                </div>
                <h1 className="text-3xl font-bold text-project-dave-dark-blue mb-4">
                  Welcome to <span className="text-project-dave-purple">project dave</span>
                </h1>
                <p className="text-project-dave-dark-blue/80 max-w-lg mx-auto">
                  Enter your name and connect to your Google account.
                </p>
              </div>

              <div className="flex flex-col items-center justify-center space-y-4 py-8">
                {/* Name input field */}
                <div className="w-full max-w-sm">
                  <label htmlFor="fullName" className="block text-sm font-medium text-project-dave-dark-blue mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-project-dave-purple/50 focus:border-project-dave-purple"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                
                {/* Connect with Google button - now goes directly to resume page */}
                <button 
                  onClick={() => {
                    if (formData.fullName) {
                      setIsGoogleConnected(true);
                      setStep(2); // Go directly to resume page
                    }
                  }}
                  className={`flex items-center justify-center gap-3 w-full max-w-sm bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg py-3 px-4 shadow-sm transition-all duration-200 ${!formData.fullName ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <svg viewBox="0 0 24 24" width="24" height="24" className="mr-2">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="font-medium">Connect with Google</span>
                </button>
                
              </div>
            </div>
          )}

          {/* Step 2: Resume Upload (was previously Step 4) */}

          {/* Step 3: Scheduling Links - COMMENTED OUT
          Step 3 has been removed to simplify the onboarding process
          */}

          {/* Step 2: Resume Upload */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-project-dave-dark-blue mb-2">Upload Your Resume <span className="text-red-500">*</span></h2>
                <p className="text-project-dave-dark-blue/70">
                  Your resume helps us understand your expertise and industry focus.
                </p>
              </div>

              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  {!formData.resume ? (
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-project-dave-purple/10 rounded-full flex items-center justify-center mb-4">
                        <Upload className="h-8 w-8 text-project-dave-purple" />
                      </div>
                      <p className="text-project-dave-dark-blue font-medium mb-2">
                        Drag and drop your resume here
                      </p>
                      <p className="text-gray-500 text-sm mb-4">
                        or click to browse (PDF, DOCX, up to 5MB)
                      </p>
                      <label className="button-outline cursor-pointer">
                        <span>Browse Files</span>
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileChange}
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="bg-project-dave-purple/5 p-4 rounded-lg flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-project-dave-purple/10 rounded-lg flex items-center justify-center mr-3">
                          <Check className="h-5 w-5 text-project-dave-purple" />
                        </div>
                        <div className="text-left">
                          <p className="text-project-dave-dark-blue font-medium">{formData.resume.name}</p>
                          <p className="text-xs text-gray-500">
                            {Math.round(formData.resume.size / 1024)} KB
                          </p>
                        </div>
                      </div>
                      <button 
                        className="text-gray-500 hover:text-red-500"
                        onClick={() => setFormData(prev => ({ ...prev, resume: null }))}
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Details Textarea (Optional) */}
              <div className="space-y-2 mt-6">
                <label htmlFor="additionalDetails" className="block text-sm font-medium text-project-dave-dark-blue">
                  Additional Details (Optional)
                </label>
                <textarea
                  id="additionalDetails"
                  name="additionalDetails"
                  value={formData.additionalDetails}
                  onChange={(e) => setFormData(prev => ({ ...prev, additionalDetails: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-project-dave-purple/50 focus:border-project-dave-purple"
                  rows={4}
                  placeholder="Share any additional information that might help us understand your goals better"
                ></textarea>
              </div>

              <div className="flex justify-end mt-8">
                <button 
                  className="button-primary flex items-center"
                  onClick={handleSubmit}
                >
                  Complete Setup
                  <ChevronRight className="ml-2 h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-8 text-center text-sm text-project-dave-dark-blue/60">
          Having trouble? <a href="mailto:danielwu28@g.ucla.edu" className="text-project-dave-purple hover:underline">Contact our support team</a>
        </div>
      </div>
    </div>
  );
};

export default OnboardingComponent;