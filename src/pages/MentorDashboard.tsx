import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Map, Briefcase, Users, ArrowUpRight, Sparkles, BarChart2, MessageSquare, Coffee, BookOpen, MapPin, ChevronRight } from 'lucide-react';

// Radar Chart component for the skills hexagon
const RadarHexagon = ({ skills }) => {
  const numberOfSkills = skills.length;
  const angleStep = (2 * Math.PI) / numberOfSkills;
  const size = 180;
  const center = size / 2;
  const radius = center - 10;
  
  // Generate points for the outer hexagon
  const outerPoints = skills.map((_, i) => {
    const angle = i * angleStep - Math.PI / 2; // Start from top
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle)
    };
  });
  
  // Generate points for the data polygon
  const dataPoints = skills.map((skill, i) => {
    const angle = i * angleStep - Math.PI / 2; // Start from top
    const dataRadius = (skill.value / 10) * radius;
    return {
      x: center + dataRadius * Math.cos(angle),
      y: center + dataRadius * Math.sin(angle)
    };
  });
  
  // Create a polygon string for the data area
  const dataPolygon = dataPoints.map(point => `${point.x},${point.y}`).join(' ');
  
  // Create a polygon string for the outer hexagon
  const outerPolygon = outerPoints.map(point => `${point.x},${point.y}`).join(' ');
  
  return (
    <div className="relative w-full max-w-md mx-auto">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
        {/* Outer hexagon */}
        <polygon 
          points={outerPolygon} 
          fill="none" 
          stroke="#333" 
          strokeWidth="1"
        />
        
        {/* Axis lines */}
        {outerPoints.map((point, i) => (
          <line 
            key={`axis-${i}`}
            x1={center}
            y1={center}
            x2={point.x}
            y2={point.y}
            stroke="#333"
            strokeWidth="0.5"
            strokeOpacity="0.5"
          />
        ))}
        
        {/* Data polygon */}
        <polygon 
          points={dataPolygon} 
          fill="#6936F5" 
          fillOpacity="0.3" 
          stroke="#6936F5" 
          strokeWidth="2"
        />
        
        {/* Data points */}
        {dataPoints.map((point, i) => (
          <circle 
            key={`data-point-${i}`}
            cx={point.x}
            cy={point.y}
            r="3"
            fill="#6936F5"
          />
        ))}
      </svg>
      
      {/* Labels */}
      {skills.map((skill, i) => {
        const angle = i * angleStep - Math.PI / 2; // Start from top
        const labelRadius = radius + 20;
        const x = center + labelRadius * Math.cos(angle);
        const y = center + labelRadius * Math.sin(angle);
        
        // Calculate text anchor based on position
        let textAnchor = "middle";
        if (x < center - 20) textAnchor = "end";
        if (x > center + 20) textAnchor = "start";
        
        return (
          <div 
            key={`label-${i}`}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 text-xs font-medium text-convrt-dark-blue"
            style={{
              left: `${(x / size) * 100}%`,
              top: `${(y / size) * 100}%`,
              textAlign: textAnchor === "middle" ? "center" : textAnchor === "start" ? "left" : "right",
              width: "80px"
            }}
          >
            {skill.label}
          </div>
        );
      })}
    </div>
  );
};

// MentorCard component for upcoming meetings
const MentorCard = ({ mentor }) => {
  return (
    <div className="p-3 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-convrt-purple/10 flex items-center justify-center text-convrt-purple font-medium flex-shrink-0">
        {mentor.name.split(' ').map(n => n[0]).join('')}
      </div>
      <div className="flex-grow min-w-0">
        <h4 className="font-medium text-convrt-dark-blue text-sm truncate">{mentor.name}</h4>
        <div className="flex items-center text-xs text-gray-600 gap-3">
          <div className="flex items-center">
            <Calendar className="w-3 h-3 mr-1 text-convrt-purple" />
            <span>{mentor.date}</span>
          </div>
          <div className="flex items-center">
            <Clock className="w-3 h-3 mr-1 text-convrt-purple" />
            <span>{mentor.time}</span>
          </div>
        </div>
      </div>
      <div className="flex-shrink-0">
        {mentor.tags.map((tag, i) => (
          <span key={i} className="inline-block px-2 py-0.5 bg-convrt-purple/10 text-convrt-purple text-xs rounded-full mr-1">
            {tag}
          </span>
        )).slice(0, 1)}
      </div>
    </div>
  );
};

// QuestionCard component for questions to ask
const QuestionCard = ({ question }) => {
  return (
    <div className="py-2 px-3 bg-white rounded-lg border border-gray-100">
      <div className="flex gap-1 mb-1">
        <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
          {question.category}
        </span>
      </div>
      <p className="text-xs text-convrt-dark-blue">{question.text}</p>
    </div>
  );
};

// EventCard component for upcoming networking events
const EventCard = ({ event }) => {
  return (
    <div className="flex items-center gap-3 py-2 px-3 bg-white rounded-lg border border-gray-100">
      <div className="w-10 h-10 rounded-lg bg-convrt-purple/10 flex items-center justify-center text-convrt-purple font-medium flex-shrink-0">
        <Calendar className="w-5 h-5" />
      </div>
      <div className="flex-grow min-w-0">
        <div className="flex justify-between items-center">
          <h4 className="font-medium text-convrt-dark-blue text-sm truncate">{event.name}</h4>
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
            event.type === 'Virtual' 
              ? 'bg-blue-100 text-blue-600' 
              : 'bg-green-100 text-green-600'
          }`}>
            {event.type}
          </span>
        </div>
        <div className="flex items-center text-xs text-gray-600 gap-2">
          <span>{event.date}</span>
          <span>•</span>
          <span>{event.time}</span>
        </div>
      </div>
    </div>
  );
};

const MentorDashboard = () => {
  // Sample data
  const skillsData = [
    { label: "Referrals", value: 7 },
    { label: "Dream Companies", value: 6 },
    { label: "Career Trajectory", value: 8 },
    { label: "Location", value: 5 },
    { label: "Role Interest", value: 9 },
    { label: "Longevity", value: 4 },
  ];
  
  const upcomingMeetings = [
    {
      name: "Sarah Johnson",
      role: "Engineering Manager",
      company: "TechCorp",
      date: "May 3",
      time: "3:30 PM",
      location: "Zoom",
      tags: ["Engineering"]
    },
    {
      name: "Michael Chen",
      role: "Product Designer",
      company: "DesignHub",
      date: "May 5",
      time: "11:00 AM",
      location: "Blue Bottle",
      tags: ["Design"]
    },
    {
      name: "Priya Patel",
      role: "Data Scientist",
      company: "DataViz",
      date: "May 8",
      time: "2:00 PM",
      location: "Google Meet",
      tags: ["Data"]
    }
  ];
  
  const suggestedQuestions = [
    {
      text: "What were some pivotal decisions that shaped your career trajectory?",
      category: "Career Growth",
      relevanceScore: 95,
    },
    {
      text: "How do you balance technical depth with leadership responsibilities?",
      category: "Leadership",
      relevanceScore: 87,
    },
    {
      text: "What indicators do you look for when evaluating company culture?",
      category: "Job Search",
      relevanceScore: 92,
    },
    {
      text: "How did you transition from individual contributor to management?",
      category: "Career Transition",
      relevanceScore: 89,
    }
  ];
  
  const upcomingEvents = [
    {
      name: "Tech Innovators Meetup",
      organizer: "Bay Area Tech Network",
      date: "May 10",
      time: "6:00 PM",
      location: "SoMa Hub",
      type: "In-Person",
    },
    {
      name: "Women in STEM Panel",
      organizer: "TechWomen Community",
      date: "May 12",
      time: "5:30 PM",
      type: "Virtual",
    },
    {
      name: "Product Management Workshop",
      organizer: "Product School",
      date: "May 15",
      time: "1:00 PM",
      location: "Downtown",
      type: "In-Person",
    }
  ];
  
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <h1 className="text-xl font-bold text-convrt-dark-blue">Networking Dashboard</h1>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-12 gap-4">
          {/* Left Column */}
          <div className="col-span-12 md:col-span-4 space-y-4">
            {/* Top Stats */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <div className="text-xl font-semibold text-convrt-dark-blue">15</div>
                  <p className="text-gray-600 text-xs">Coffee Chats</p>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-convrt-dark-blue">8</div>
                  <p className="text-gray-600 text-xs">Connections</p>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-convrt-dark-blue">5</div>
                  <p className="text-gray-600 text-xs">Industries</p>
                </div>
              </div>
            </div>
            
            {/* Network Strength Hexagon */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <h2 className="text-md font-bold text-convrt-dark-blue mb-2">Networking Strength</h2>
              <RadarHexagon skills={skillsData} />
            </div>
            
            {/* Questions to Ask */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-md font-bold text-convrt-dark-blue">Questions to Ask</h2>
                <button className="text-xs text-convrt-purple hover:text-convrt-purple-hover flex items-center">
                  View All <ChevronRight className="w-3 h-3 ml-1" />
                </button>
              </div>
              
              <div className="space-y-2">
                {suggestedQuestions.slice(0, 3).map((question, index) => (
                  <QuestionCard key={index} question={question} />
                ))}
              </div>
            </div>
          </div>
          
          {/* Middle Column */}
          <div className="col-span-12 md:col-span-4 space-y-4">
            {/* Upcoming Meetings */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-md font-bold text-convrt-dark-blue">Upcoming Meetings</h2>
                <button className="text-xs text-convrt-purple hover:text-convrt-purple-hover flex items-center">
                  View All <ChevronRight className="w-3 h-3 ml-1" />
                </button>
              </div>
              
              <div className="space-y-2">
                {upcomingMeetings.map((mentor, index) => (
                  <MentorCard key={index} mentor={mentor} />
                ))}
              </div>
            </div>
            
            {/* Industry Insights */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <h2 className="text-md font-bold text-convrt-dark-blue mb-3">Industry Insights</h2>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-700">Technology</span>
                  <div className="w-32 h-2 bg-gray-100 rounded-full">
                    <div className="h-full bg-convrt-purple rounded-full" style={{ width: '70%' }}></div>
                  </div>
                  <span className="text-xs text-convrt-purple">70%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-700">Finance</span>
                  <div className="w-32 h-2 bg-gray-100 rounded-full">
                    <div className="h-full bg-convrt-purple rounded-full" style={{ width: '45%' }}></div>
                  </div>
                  <span className="text-xs text-convrt-purple">45%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-700">Healthcare</span>
                  <div className="w-32 h-2 bg-gray-100 rounded-full">
                    <div className="h-full bg-convrt-purple rounded-full" style={{ width: '30%' }}></div>
                  </div>
                  <span className="text-xs text-convrt-purple">30%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-700">Education</span>
                  <div className="w-32 h-2 bg-gray-100 rounded-full">
                    <div className="h-full bg-convrt-purple rounded-full" style={{ width: '25%' }}></div>
                  </div>
                  <span className="text-xs text-convrt-purple">25%</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column */}
          <div className="col-span-12 md:col-span-4 space-y-4">
            {/* Upcoming Events */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-md font-bold text-convrt-dark-blue">Networking Events</h2>
                <button className="text-xs text-convrt-purple hover:text-convrt-purple-hover flex items-center">
                  View All <ChevronRight className="w-3 h-3 ml-1" />
                </button>
              </div>
              
              <div className="space-y-2">
                {upcomingEvents.map((event, index) => (
                  <EventCard key={index} event={event} />
                ))}
              </div>
            </div>
            
            {/* Action Items */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <h2 className="text-md font-bold text-convrt-dark-blue mb-3">Action Items</h2>
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="w-5 h-5 rounded-full border border-convrt-purple/50 flex items-center justify-center mr-2 text-convrt-purple flex-shrink-0">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-700">Follow up with Michael about UX resources</span>
                </div>
                <div className="flex items-center">
                  <div className="w-5 h-5 rounded-full border border-gray-200 mr-2 flex-shrink-0"></div>
                  <span className="text-xs text-gray-700">Register for Tech Innovators Meetup</span>
                </div>
                <div className="flex items-center">
                  <div className="w-5 h-5 rounded-full border border-gray-200 mr-2 flex-shrink-0"></div>
                  <span className="text-xs text-gray-700">Send thank you note to Sarah</span>
                </div>
                <div className="flex items-center">
                  <div className="w-5 h-5 rounded-full border border-gray-200 mr-2 flex-shrink-0"></div>
                  <span className="text-xs text-gray-700">Update LinkedIn profile with new skills</span>
                </div>
              </div>
            </div>
            
            {/* Recommended Mentors */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <h2 className="text-md font-bold text-convrt-dark-blue mb-3">Recommended Mentors</h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-convrt-purple/10 flex items-center justify-center text-convrt-purple font-medium mr-2">AK</div>
                    <div>
                      <div className="text-xs font-medium text-convrt-dark-blue">Alex Kim</div>
                      <div className="text-xs text-gray-600">Product Manager at TechCorp</div>
                    </div>
                  </div>
                  <button className="text-xs px-2 py-1 bg-convrt-purple/10 text-convrt-purple rounded">Connect</button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-convrt-purple/10 flex items-center justify-center text-convrt-purple font-medium mr-2">JL</div>
                    <div>
                      <div className="text-xs font-medium text-convrt-dark-blue">Jamie Lee</div>
                      <div className="text-xs text-gray-600">Engineering Lead at DataCorp</div>
                    </div>
                  </div>
                  <button className="text-xs px-2 py-1 bg-convrt-purple/10 text-convrt-purple rounded">Connect</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorDashboard;