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
    calendlyLink: '',
    zoomLink: '',
    resume: null
  });
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);

  const totalSteps = 4;

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
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would submit the data to a backend
    console.log('Form submitted:', formData);
    // Redirect to dashboard or confirmation page
    window.location.href = '/dashboard'; // Or use react-router navigate
  };

  return (
    <div className="min-h-screen bg-[#F9F6F3] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="container mx-auto flex justify-between items-center">
          <a href="/" className="flex items-center">
            <img 
              src="/lovable-uploads/ce207080-f6c2-430d-9621-79d32ab08655.png" 
              alt="Convrt.ai Logo" 
              className="h-8"
            />
          </a>
          <button className="text-convrt-dark-blue/60 text-sm hover:text-convrt-purple">
            Need help?
          </button>
        </div>
      </header>

      <div className="flex-1 container mx-auto max-w-4xl py-12 px-6">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-convrt-dark-blue">
              Step {step} of {totalSteps}
            </span>
            <span className="text-sm font-medium text-convrt-purple">
              {Math.round((step / totalSteps) * 100)}% Complete
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-convrt-purple rounded-full transition-all duration-300 ease-in-out" 
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
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-convrt-purple/10 text-convrt-purple mb-4">
                  <Sparkles className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Let's Get Started</span>
                </div>
                <h1 className="text-3xl font-bold text-convrt-dark-blue mb-4">
                  Welcome to <span className="text-convrt-purple">Convrt.ai</span>
                </h1>
                <p className="text-convrt-dark-blue/80 max-w-lg mx-auto">
                  First, let's connect your Google account to access your contacts and calendar. This will help us provide you with the best experience.
                </p>
              </div>

              <div className="flex flex-col items-center justify-center py-8">
                <button 
                  className="flex items-center justify-center gap-3 w-full max-w-sm bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg py-3 px-4 shadow-sm transition-all duration-200"
                  onClick={() => setIsGoogleConnected(true)}
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

                {isGoogleConnected && (
                  <div className="mt-6 flex items-center text-green-600 bg-green-50 px-4 py-2 rounded-full">
                    <Check className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">Google account connected successfully!</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-8">
                <button 
                  className="button-primary flex items-center"
                  onClick={nextStep}
                  disabled={!isGoogleConnected}
                >
                  Continue
                  <ChevronRight className="ml-2 h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Basic Information */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-convrt-dark-blue mb-2">Personal Information</h2>
                <p className="text-convrt-dark-blue/70">
                  Tell us a bit about yourself so we can personalize your experience.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-convrt-dark-blue mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-convrt-purple/50 focus:border-convrt-purple"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <button 
                  className="border border-gray-300 text-convrt-dark-blue font-medium py-3 px-6 rounded-lg transition-all hover:bg-gray-50"
                  onClick={prevStep}
                >
                  Back
                </button>
                <button 
                  className="button-primary flex items-center"
                  onClick={nextStep}
                  disabled={!formData.fullName}
                >
                  Continue
                  <ChevronRight className="ml-2 h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Scheduling Links */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-convrt-dark-blue mb-2">Scheduling Information</h2>
                <p className="text-convrt-dark-blue/70">
                  Add your scheduling links to make it easy for prospects to connect with you.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="calendlyLink" className="block text-sm font-medium text-convrt-dark-blue mb-1">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-convrt-purple" />
                      Calendly Link
                    </div>
                  </label>
                  <input
                    type="url"
                    id="calendlyLink"
                    name="calendlyLink"
                    value={formData.calendlyLink}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-convrt-purple/50 focus:border-convrt-purple"
                    placeholder="https://calendly.com/yourname"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This will be used to schedule meetings with your prospects.
                  </p>
                </div>

                <div>
                  <label htmlFor="zoomLink" className="block text-sm font-medium text-convrt-dark-blue mb-1">
                    <div className="flex items-center">
                      <Video className="h-4 w-4 mr-2 text-convrt-purple" />
                      Zoom Link
                    </div>
                  </label>
                  <input
                    type="url"
                    id="zoomLink"
                    name="zoomLink"
                    value={formData.zoomLink}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-convrt-purple/50 focus:border-convrt-purple"
                    placeholder="https://zoom.us/j/yourpersonallink"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Your personal meeting room link for virtual meetings.
                  </p>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <button 
                  className="border border-gray-300 text-convrt-dark-blue font-medium py-3 px-6 rounded-lg transition-all hover:bg-gray-50"
                  onClick={prevStep}
                >
                  Back
                </button>
                <button 
                  className="button-primary flex items-center"
                  onClick={nextStep}
                >
                  Continue
                  <ChevronRight className="ml-2 h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Resume Upload */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-convrt-dark-blue mb-2">Upload Your Resume</h2>
                <p className="text-convrt-dark-blue/70">
                  Your resume helps us understand your expertise and industry focus.
                </p>
              </div>

              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  {!formData.resume ? (
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-convrt-purple/10 rounded-full flex items-center justify-center mb-4">
                        <Upload className="h-8 w-8 text-convrt-purple" />
                      </div>
                      <p className="text-convrt-dark-blue font-medium mb-2">
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
                    <div className="bg-convrt-purple/5 p-4 rounded-lg flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-convrt-purple/10 rounded-lg flex items-center justify-center mr-3">
                          <Check className="h-5 w-5 text-convrt-purple" />
                        </div>
                        <div className="text-left">
                          <p className="text-convrt-dark-blue font-medium">{formData.resume.name}</p>
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

              <div className="flex justify-between mt-8">
                <button 
                  className="border border-gray-300 text-convrt-dark-blue font-medium py-3 px-6 rounded-lg transition-all hover:bg-gray-50"
                  onClick={prevStep}
                >
                  Back
                </button>
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
        <div className="mt-8 text-center text-sm text-convrt-dark-blue/60">
          Having trouble? <a href="#" className="text-convrt-purple hover:underline">Contact our support team</a>
        </div>
      </div>
    </div>
  );
};

export default OnboardingComponent;