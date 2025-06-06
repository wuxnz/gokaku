import React from "react";
import {
  SingleEliminationBracket,
  Match,
  SVGViewer,
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
  // Map matches to the format expected by @g-loot/react-tournament-brackets
  const mappedMatches = matches.map((match) => ({
    id: match.id,
    name: `Match ${match.round}-${match.position}`,
    nextMatchId: null, // This can be calculated for more advanced logic
    tournamentRoundText: `Round ${match.round}`,
    startTime: "",
    state: {
      // You can use match.status for more detailed state
      status: match.status === "COMPLETED" ? "DONE" : "RUNNING",
      // ...
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

  if (bracketType === "DOUBLE_ELIMINATION") {
    return <div>Double elimination bracket coming soon!</div>;
  }

  return (
    <div style={{ width: "100%", minHeight: 400 }}>
      <SingleEliminationBracket
        matches={mappedMatches}
        matchComponent={(props) => (
          <Match
            {...props}
            onMatchClick={
              isCreator && props.match.state.status !== "DONE"
                ? () => {
                    // Show winner selection UI or call onAdvanceWinner directly
                    const winnerId = window.prompt(
                      `Enter winner's player ID for this match:`,
                    );
                    if (winnerId) {
                      onAdvanceWinner(props.match.id, winnerId);
                    }
                  }
                : undefined
            }
          />
        )}
        svgWrapper={SVGViewer}
      />
    </div>
  );
};
