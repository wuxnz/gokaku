import React, { useState } from "react";
import {
  SingleEliminationBracket,
  DoubleEliminationBracket,
  Match,
  SVGViewer,
  createTheme,
} from "@g-loot/react-tournament-brackets";

// Types for match and participant
export interface BracketParticipant {
  id: string;
  name: string;
}

export interface BracketMatch {
  id: string;
  round: number;
  position: number;
  player1Id?: string;
  player2Id?: string;
  player1?: BracketParticipant;
  player2?: BracketParticipant;
  winnerId?: string;
  status: string;
}

interface BracketProps {
  matches: BracketMatch[];
  participants: BracketParticipant[];
  bracketType: string;
  isCreator: boolean;
  onAdvanceWinner: (matchId: string, winnerId: string) => void;
}

export const Bracket: React.FC<BracketProps> = ({
  matches,
  participants,
  bracketType,
  isCreator,
  onAdvanceWinner,
}) => {
  const [finalWinner, setFinalWinner] = useState<BracketParticipant | null>(
    null,
  );

  // Find the final match (highest round number)
  const finalRound = Math.max(...matches.map((m) => m.round), 0);
  const finalMatches = matches.filter((m) => m.round === finalRound);
  const tournamentFinished = finalMatches.some(
    (m) => m.status === "COMPLETED" && m.winnerId,
  );
  const winnerId = tournamentFinished
    ? finalMatches.find((m) => m.status === "COMPLETED" && m.winnerId)?.winnerId
    : undefined;
  const winner = participants.find((p) => p.id === winnerId) || null;

  // Map matches to the format expected by @g-loot/react-tournament-brackets
  const mappedMatches = matches.map((match) => ({
    id: match.id,
    name: `Match ${match.round}-${match.position}`,
    nextMatchId: null, // This can be calculated for more advanced logic
    tournamentRoundText: `Round ${match.round}`,
    startTime: "",
    state: {
      status: match.status === "COMPLETED" ? "DONE" : "RUNNING",
    },
    participants: [
      match.player1Id
        ? {
            id: match.player1Id,
            name:
              participants.find((p) => p.id === match.player1Id)?.name || "TBD",
            isWinner: match.winnerId === match.player1Id,
            resultText: match.winnerId === match.player1Id ? "W" : "",
          }
        : { id: "bye1", name: "BYE", isWinner: false, resultText: "" },
      match.player2Id
        ? {
            id: match.player2Id,
            name:
              participants.find((p) => p.id === match.player2Id)?.name || "TBD",
            isWinner: match.winnerId === match.player2Id,
            resultText: match.winnerId === match.player2Id ? "W" : "",
          }
        : { id: "bye2", name: "BYE", isWinner: false, resultText: "" },
    ],
  }));

  const DarkTheme = createTheme({
    textColor: { main: "#FFFFFF", highlighted: "#FFFFFF", dark: "#FFFFFF" },
    matchBackground: { wonColor: "#5de464", lostColor: "#1d1d1d" },
    score: {
      background: { wonColor: "#0a0a0a", lostColor: "#0a0a0a" },
    },
    border: {
      color: "#0a0a0a",
      highlightedColor: "#0a0a0a",
    },
    roundHeader: { backgroundColor: "#0a0a0a", fontColor: "#FFFFFF" },
    connectorColor: "#0a0a0a",
    connectorColorHighlight: "#0a0a0a",
    svgBackground: "#0a0a0a",
  });

  // Winner selection dialog
  const handleMatchClick = (match: any) => {
    console.log("Match clicked:", match); // Debug log
    if (!isCreator || match.state.status === "DONE") return;
    const p1 = match.participants[0];
    const p2 = match.participants[1];
    if (!p1 || !p2) return;
    const winnerName = window.prompt(
      `Who won this match? Enter "1" for ${p1.name}, "2" for ${p2.name}`,
    );
    let winnerId: string | undefined;
    if (winnerName === "1") winnerId = p1.id;
    if (winnerName === "2") winnerId = p2.id;
    if (winnerId) {
      onAdvanceWinner(match.id, winnerId);
    }
  };

  // Show winner if tournament is finished
  return (
    <div className="bracket min-h-[400px] w-full">
      {tournamentFinished && winner ? (
        <div className="mb-4 text-center text-2xl font-bold text-green-400">
          Winner: {winner.name} 🏆
        </div>
      ) : null}
      {bracketType === "DOUBLE_ELIMINATION" ? (
        <DoubleEliminationBracket
          theme={DarkTheme}
          matches={mappedMatches}
          onMatchClick={handleMatchClick}
          svgWrapper={({
            children,
            ...props
          }: {
            children: React.ReactNode;
          }) => (
            <SVGViewer width={800} height={800} {...props}>
              {children}
            </SVGViewer>
          )}
        />
      ) : (
        <SingleEliminationBracket
          theme={DarkTheme}
          matches={mappedMatches}
          onMatchClick={handleMatchClick}
          svgWrapper={({
            children,
            ...props
          }: {
            children: React.ReactNode;
          }) => (
            <SVGViewer width={800} height={800} {...props}>
              {children}
            </SVGViewer>
          )}
        />
      )}
    </div>
  );
};
