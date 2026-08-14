"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface Question {
  id: string;
  question: string;
  options: string[];
  userAnswer: string | null;
  isCorrect: boolean | null;
  correctAnswer: string | null;
  explanation: string | null;
}

interface TestRunnerProps {
  testId: string;
  completed: boolean;
  score: number | null;
  questionCount: number;
  questions: Question[];
}

const TestRunner = ({ testId, completed, score, questionCount, questions: initialQuestions }: TestRunnerProps) => {
  const [result, setResult] = useState<{ completed: boolean; score: number | null; questions: Question[] }>({
    completed,
    score,
    questions: initialQuestions,
  });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (Object.keys(answers).length !== result.questions.length) {
      setMessage("Answer every question before submitting.");
      return;
    }
    setPending(true);
    setMessage(undefined);

    const res = await fetch(`/api/tests/${testId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answers: Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer })),
      }),
    });
    const data = await res.json();
    setPending(false);

    if (!res.ok) {
      setMessage(data.message ?? "Something went wrong.");
      return;
    }

    setResult({ completed: true, score: data.result.score, questions: data.result.questions });
  }

  if (result.completed) {
    return (
      <div className="flex flex-col gap-6">
        <p className="text-lg font-semibold">
          Score: {result.score}/{questionCount}
        </p>
        <ol className="flex flex-col gap-4">
          {result.questions.map((q, i) => (
            <li key={q.id}>
              <Card>
                <CardContent>
                  <p className="font-medium mb-2">
                    {i + 1}. {q.question}
                  </p>
                  <p className="text-sm mb-1 flex items-center gap-2">
                    Your answer: {q.userAnswer ?? "—"}
                    <Badge variant={q.isCorrect ? "default" : "destructive"}>{q.isCorrect ? "Correct" : "Incorrect"}</Badge>
                  </p>
                  {!q.isCorrect && (
                    <div className="text-sm mt-2 bg-muted p-2 rounded">
                      <p>
                        Correct answer: <span className="font-medium">{q.correctAnswer}</span>
                      </p>
                      <p className="text-muted-foreground mt-1">{q.explanation}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <ol className="flex flex-col gap-4">
        {result.questions.map((q, i) => (
          <li key={q.id}>
            <Card>
              <CardContent>
                <p className="font-medium mb-2">
                  {i + 1}. {q.question}
                </p>
                <RadioGroup
                  value={answers[q.id]}
                  onValueChange={(value) => setAnswers((prev) => ({ ...prev, [q.id]: value }))}
                >
                  {q.options.map((option) => (
                    <div key={option} className="flex items-center gap-2">
                      <RadioGroupItem value={option} id={`${q.id}-${option}`} />
                      <Label htmlFor={`${q.id}-${option}`} className="text-sm font-normal">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>

      {message && (
        <Alert variant="destructive">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <Button disabled={pending} type="submit" className="w-full">
        {pending ? "Submitting..." : "Submit answers"}
      </Button>
    </form>
  );
};

export default TestRunner;
