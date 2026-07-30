import React from 'react';
import SectionCard from '../SectionCard';

interface QuestionStat {
  question: string;
  count: number;
}

interface TopQuestionsProps {
  data: { questions: QuestionStat[] } | null;
  loading: boolean;
}

export default function TopQuestions({ data, loading }: TopQuestionsProps) {
  const questions = data?.questions || [];

  return (
    <SectionCard
      title="Most Asked Questions"
      description="Common questions asked by users to the AI models"
      icon="forum"
      loading={loading}
    >
      <div className="flex-1 overflow-y-auto max-h-[400px] space-y-3">
        {questions.length > 0 ? (
          questions.map((q, idx) => (
            <div 
              key={idx}
              className="bg-bg-secondary/40 border border-border-primary rounded-lg p-4 flex justify-between items-start gap-4 hover:border-border-secondary transition-colors"
            >
              <div className="flex gap-3">
                <span className="text-text-accent font-mono text-xs mt-0.5">Q{idx + 1}.</span>
                <p className="text-sm text-text-primary italic">"{q.question}"</p>
              </div>
              <div className="shrink-0 flex flex-col items-end">
                <span className="text-[10px] text-text-secondary uppercase tracking-wider">Times Asked</span>
                <span className="text-sm font-bold text-accent-indigo-light font-mono mt-0.5">{q.count}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="h-full flex items-center justify-center text-text-secondary text-sm">
            No user questions found in chat history.
          </div>
        )}
      </div>
    </SectionCard>
  );
}
