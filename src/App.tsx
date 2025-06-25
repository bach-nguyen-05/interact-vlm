import React, { useState, useRef, useEffect } from 'react';
import { Send, Eye, Brain, Trophy, Lightbulb, CheckCircle, XCircle } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'vlm';
  content: string;
  timestamp: Date;
}

interface Challenge {
  id: string;
  question: string;
  correctAnswer: string;
  imageDescription: string;
  hints: string[];
}

const sampleChallenges: Challenge[] = [
  {
    id: '1',
    question: 'What color is the main object in the center of the image?',
    correctAnswer: 'red',
    imageDescription: 'A bright red sports car parked in front of a modern glass building',
    hints: ['The object is a vehicle', 'It\'s commonly seen on roads', 'This color is often associated with speed']
  },
  {
    id: '2',
    question: 'How many people are visible in this image?',
    correctAnswer: '3',
    imageDescription: 'Three people sitting on a park bench, two adults and one child',
    hints: ['Look for human figures', 'Count carefully', 'Some might be partially hidden']
  }
];

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'vlm',
      content: 'Hello! I can see an image that you cannot. Ask me questions about what I see to help you answer the challenge question.',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [currentChallenge] = useState<Challenge>(sampleChallenges[0]);
  const [userAnswer, setUserAnswer] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [questionsAsked, setQuestionsAsked] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateVLMResponse = (userQuestion: string): string => {
    const question = userQuestion.toLowerCase();
    const description = currentChallenge.imageDescription.toLowerCase();
    
    if (question.includes('color') || question.includes('what color')) {
      if (description.includes('red')) return 'I can see something that is predominantly red in color.';
      return 'The main colors I see are various shades, but there\'s one particularly vibrant color that stands out.';
    }
    
    if (question.includes('how many') || question.includes('count')) {
      if (description.includes('three people')) return 'I can count three distinct figures in the image.';
      return 'Let me count carefully... I see multiple items/people in the scene.';
    }
    
    if (question.includes('what is') || question.includes('what\'s')) {
      if (description.includes('car')) return 'I see a vehicle, specifically what appears to be an automobile.';
      if (description.includes('people')) return 'I see people in what looks like a casual setting.';
      return 'I can see objects and possibly people in the scene.';
    }
    
    if (question.includes('where') || question.includes('location')) {
      if (description.includes('building')) return 'The setting appears to be near a modern building structure.';
      if (description.includes('park')) return 'This looks like it could be in a park or outdoor recreational area.';
      return 'The location seems to be outdoors with some architectural elements visible.';
    }
    
    if (question.includes('size') || question.includes('big') || question.includes('small')) {
      return 'The main subject appears to be of moderate to large size relative to other elements in the image.';
    }
    
    // Default responses
    const defaultResponses = [
      'That\'s an interesting question. I can see details that might help you figure out the answer.',
      'Let me look more carefully at that aspect of the image...',
      'I notice something that might be relevant to your question.',
      'Good question! I can see elements that relate to what you\'re asking about.'
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim() || isAnswered) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setQuestionsAsked(prev => prev + 1);
    
    // Simulate VLM processing time
    setTimeout(() => {
      const vlmResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'vlm',
        content: generateVLMResponse(inputMessage),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, vlmResponse]);
    }, 1000 + Math.random() * 1000);

    setInputMessage('');
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const useHint = () => {
    if (hintsUsed >= currentChallenge.hints.length || isAnswered) return;
    
    const hint = currentChallenge.hints[hintsUsed];
    const hintMessage: Message = {
      id: Date.now().toString(),
      type: 'vlm',
      content: `💡 Hint: ${hint}`,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, hintMessage]);
    setHintsUsed(prev => prev + 1);
  };

  const submitAnswer = () => {
    if (!userAnswer.trim() || isAnswered) return;
    
    const isCorrect = userAnswer.toLowerCase().trim() === currentChallenge.correctAnswer.toLowerCase();
    setIsAnswered(true);
    
    if (isCorrect) {
      // No score update
    }
    
    const resultMessage: Message = {
      id: Date.now().toString(),
      type: 'vlm',
      content: isCorrect 
        ? `🎉 Correct! The answer is "${currentChallenge.correctAnswer}". Well done!`
        : `❌ Not quite right. The correct answer was "${currentChallenge.correctAnswer}". Better luck next time!`,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, resultMessage]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">VLM Quiz</h1>
                <p className="text-sm text-slate-600">Ask questions to solve the challenge</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-sm text-slate-600">
                Questions: {questionsAsked} | Hints: {hintsUsed}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Challenge Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Eye className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-slate-900">Challenge</h2>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <p className="text-slate-800 font-medium">{currentChallenge.question}</p>
              </div>

              {/* Answer Submission */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Your Answer
                  </label>
                  <input
                    type="text"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    disabled={isAnswered}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100"
                    placeholder="Enter your answer..."
                  />
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={submitAnswer}
                    disabled={!userAnswer.trim() || isAnswered}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {isAnswered ? (
                      <div className="flex items-center justify-center space-x-2">
                        {userAnswer.toLowerCase().trim() === currentChallenge.correctAnswer.toLowerCase() ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        <span>Submitted</span>
                      </div>
                    ) : (
                      'Submit Answer'
                    )}
                  </button>
                  
                  <button
                    onClick={useHint}
                    disabled={hintsUsed >= currentChallenge.hints.length || isAnswered}
                    className="px-4 py-2 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
                  >
                    <Lightbulb className="w-4 h-4" />
                  </button>
                </div>
                
                <p className="text-xs text-slate-500">
                  Hints remaining: {currentChallenge.hints.length - hintsUsed}
                </p>
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-[600px] flex flex-col">
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-slate-200">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <h3 className="font-semibold text-slate-900">Visual Language Model</h3>
                  <span className="text-sm text-slate-500">• Online</span>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                      message.type === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-100 text-slate-800'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.type === 'user' ? 'text-blue-100' : 'text-slate-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-6 border-t border-slate-200">
                <div className="flex space-x-3">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isAnswered}
                    className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100"
                    placeholder={isAnswered ? "Challenge completed!" : "Ask me about what I see..."}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isAnswered}
                    className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Ask specific questions about colors, objects, people, locations, etc.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;