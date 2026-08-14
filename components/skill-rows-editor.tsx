"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const EXPERTISE_LEVELS = ["NEW", "INTERMEDIATE", "EXPERT"] as const;
export type ExpertiseLevel = (typeof EXPERTISE_LEVELS)[number];
export interface SkillEntry {
  skill: string;
  expertiseLevel: ExpertiseLevel;
}
export const emptySkill: SkillEntry = { skill: "", expertiseLevel: "NEW" };

interface SkillRowsEditorProps {
  value: SkillEntry[];
  onChange: (next: SkillEntry[]) => void;
}

/** Controlled row-list editor for a person's skills — used on both the TM's own profile and the RM's per-report editor. */
export function SkillRowsEditor({ value, onChange }: SkillRowsEditorProps) {
  return (
    <div className="flex flex-col gap-3">
      {value.map((entry, index) => (
        <div key={index} className="flex gap-2">
          <Input
            placeholder="Skill (e.g. React)"
            value={entry.skill}
            onChange={(event) => onChange(value.map((s, i) => (i === index ? { ...s, skill: event.target.value } : s)))}
          />
          <Select
            value={entry.expertiseLevel}
            onValueChange={(level) =>
              onChange(value.map((s, i) => (i === index ? { ...s, expertiseLevel: level as ExpertiseLevel } : s)))
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXPERTISE_LEVELS.map((level) => (
                <SelectItem key={level} value={level}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(value.filter((_, i) => i !== index))}>
            Remove
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...value, emptySkill])}>
        Add skill
      </Button>
    </div>
  );
}
