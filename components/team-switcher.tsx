"use client";

import { useUser } from "@clerk/nextjs";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface Team {
  id: string;
  name: string;
  displayName: string;
}

// Mock teams for now - you can replace this with actual team data from your database
const mockTeams: Team[] = [
  { id: "team-1", name: "team-1", displayName: "Team Alpha" },
  { id: "team-2", name: "team-2", displayName: "Team Beta" },
  { id: "team-3", name: "team-3", displayName: "Team Gamma" },
];

interface TeamSwitcherProps {
  selectedTeamId: string;
  onTeamChange: (teamId: string) => void;
}

export function TeamSwitcher({ selectedTeamId, onTeamChange }: TeamSwitcherProps) {
  const { user } = useUser();
  const [open, setOpen] = useState(false);

  const selectedTeam = mockTeams.find(team => team.id === selectedTeamId) || mockTeams[0];

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-between">
          <span className="truncate">{selectedTeam.displayName}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {mockTeams.map((team) => (
          <DropdownMenuItem
            key={team.id}
            onClick={() => {
              onTeamChange(team.id);
              setOpen(false);
            }}
            className={selectedTeamId === team.id ? "bg-muted" : ""}
          >
            {team.displayName}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 