import React, { useState, useRef, useEffect } from 'react';
import { Send, Eye, Brain, Lightbulb, CheckCircle, XCircle } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'vlm';
  content: string;
  timestamp: Date;
}

interface Challenge {
  id: string;
  question: string;
  correct_answer: string;
  image_static_url: string;
}

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
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [questionsAsked, setQuestionsAsked] = useState(0);
  const [trace, setTrace] = useState<{question: string, vlm_answer: string}[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/challenges')
      .then(res => res.json())
      .then(data => {
        setChallenges(data);
        if (data.length > 0) setCurrentChallenge(data[0]);
      });
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim() || isAnswered || !currentChallenge) return;
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setQuestionsAsked(prev => prev + 1);
    // Simulate VLM processing time (replace with real API if needed)
    setTimeout(() => {
      const vlmResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'vlm',
        content: 'I am analyzing the image and question...',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, vlmResponse]);
      setTrace(prev => [...prev, { question: inputMessage, vlm_answer: vlmResponse.content }]);
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

  const submitAnswer = async () => {
    if (!userAnswer.trim() || isAnswered || !currentChallenge) return;
    const isCorrect = userAnswer.trim().toUpperCase() === currentChallenge.correct_answer.toUpperCase();
    setIsAnswered(true);
    const resultMessage: Message = {
      id: Date.now().toString(),
      type: 'vlm',
      content: isCorrect 
        ? `🎉 Correct! The answer is "${currentChallenge.correct_answer}". Well done!`
        : `❌ Incorrect. The correct answer was "${currentChallenge.correct_answer}".`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, resultMessage]);
    // Save trace to backend
    try {
      await fetch('/api/save-trace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challenge_id: currentChallenge.id,
          trace,
          user: 'anonymous' // or use a real user id if available
        })
      });
    } catch (e) {
      // Optionally handle error
    }
  };

  const handleChallengeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = challenges.find(c => c.id === e.target.value);
    if (selected) {
      setCurrentChallenge(selected);
      setMessages([
        {
          id: '1',
          type: 'vlm',
          content: 'Hello! I can see an image that you cannot. Ask me questions about what I see to help you answer the visual question.',
          timestamp: new Date()
        }
      ]);
      setUserAnswer('');
      setIsAnswered(false);
      setQuestionsAsked(0);
    }
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
                Questions: {questionsAsked}
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
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Challenge</label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={currentChallenge?.id || ''}
                  onChange={handleChallengeChange}
                >
                  {challenges.map((c) => (
                    <option key={c.id} value={c.id}>{`Challenge ${c.id}`}</option>
                  ))}
                </select>
              </div>
              {currentChallenge && (
                <>
                  <div className="bg-blue-50 rounded-lg p-4 mb-6">
                    <img
                      src={currentChallenge.image_static_url}
                      alt="Challenge visual"
                      className="w-full h-48 object-contain rounded mb-2"
                    />
                    <p className="text-slate-800 font-medium whitespace-pre-line">{currentChallenge.question}</p>
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
                        placeholder="Enter your answer (A, B, C, D)..."
                      />
                    </div>
                    <button
                      onClick={submitAnswer}
                      disabled={!userAnswer.trim() || isAnswered}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                    >
                      {isAnswered ? (
                        <div className="flex items-center justify-center space-x-2">
                          {userAnswer.trim().toUpperCase() === currentChallenge.correct_answer.toUpperCase() ? (
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
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-[800px] flex flex-col">
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