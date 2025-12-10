import React, { useEffect, useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { Task, AiMotivationResponse } from '../types';
import { getMorningMotivation } from '../services/geminiService';

interface Props {
  tasks: Task[];
  userName: string;
  onClose: () => void;
}

const MotivationalPopup: React.FC<Props> = ({ tasks, userName, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<AiMotivationResponse | null>(null);

  useEffect(() => {
    // Only run if it's after 6 AM and before 11 PM (just a logic check example)
    // In a real app, we check if we already showed it today.
    // For this demo, we run it on mount if tasks exist.
    const fetchMotivation = async () => {
      setLoading(true);
      const data = await getMorningMotivation(userName, tasks.slice(0, 5));
      setContent(data);
      setLoading(false);
    };

    fetchMotivation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden relative border-4 border-fun-yellow">
        <div className="bg-gradient-to-r from-fun-yellow to-orange-400 p-6 text-white text-center relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
          <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-4 backdrop-blur-md">
            <Sparkles size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-display font-bold">Good Morning, {userName}!</h2>
        </div>

        <div className="p-8 text-center space-y-6">
          {loading ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="w-8 h-8 border-4 border-fun-purple border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500 font-medium">Brewing some motivation...</p>
            </div>
          ) : (
            <>
              <p className="text-lg text-gray-700 leading-relaxed font-medium">
                {content?.message}
              </p>
              
              <div className="bg-fun-purple/10 p-4 rounded-xl border border-fun-purple/20">
                <p className="text-fun-purple italic font-display text-lg">"{content?.quote}"</p>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 bg-fun-purple hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg shadow-violet-200 transition-all transform hover:-translate-y-1 active:translate-y-0"
              >
                Let's Go! 🚀
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MotivationalPopup;