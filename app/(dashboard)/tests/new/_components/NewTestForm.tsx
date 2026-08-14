"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormField } from "@/components/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface NewTestFormProps {
  skills: string[];
  goalId?: string;
}

const EXPERTISE_LEVELS = [
  { value: "NEW", label: "New to it" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "EXPERT", label: "Expert" },
];

const NewTestForm = ({ skills, goalId }: NewTestFormProps) => {
  const router = useRouter();
  const [message, setMessage] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(undefined);

    const formData = new FormData(event.currentTarget);
    const res = await fetch("/api/tests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        skill: formData.get("skill"),
        yearsOfExperience: Number(formData.get("yearsOfExperience")),
        expertiseLevel: formData.get("expertiseLevel"),
        questionCount: Number(formData.get("questionCount")),
        goalId,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      setMessage(data.message ?? "Couldn't generate a test. Try again.");
      setPending(false);
      return;
    }

    router.push(`/tests/${data.test.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {goalId && (
        <Alert>
          <AlertDescription>Passing this test will mark the linked goal as complete.</AlertDescription>
        </Alert>
      )}

      <FormField id="skill" label="Skill">
        <Select name="skill" required defaultValue={skills[0]}>
          <SelectTrigger id="skill" className="w-full">
            <SelectValue placeholder="Select a skill" />
          </SelectTrigger>
          <SelectContent>
            {skills.map((skill) => (
              <SelectItem key={skill} value={skill}>
                {skill}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField id="yearsOfExperience" label="Years of experience">
        <Input
          id="yearsOfExperience"
          name="yearsOfExperience"
          type="number"
          min={0}
          max={60}
          defaultValue={1}
          required
        />
      </FormField>

      <FormField id="expertiseLevel" label="Expertise level">
        <Select name="expertiseLevel" required defaultValue="NEW">
          <SelectTrigger id="expertiseLevel" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EXPERTISE_LEVELS.map((level) => (
              <SelectItem key={level.value} value={level.value}>
                {level.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField id="questionCount" label="Number of questions">
        <Select name="questionCount" required defaultValue="10">
          <SelectTrigger id="questionCount" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5</SelectItem>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="15">15</SelectItem>
          </SelectContent>
        </Select>
      </FormField>

      {message && (
        <Alert variant="destructive">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <Button disabled={pending} type="submit" className="w-full">
        {pending ? "Generating test..." : "Start test"}
      </Button>
    </form>
  );
};

export default NewTestForm;
