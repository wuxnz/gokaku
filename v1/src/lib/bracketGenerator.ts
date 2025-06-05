import { type Tournament, type User } from "@prisma/client";

export function generateBracket(
  tournament: Tournament & { participants: User[] },
  bracketType: string,
) {
  const participants = [...tournament.participants];
  const matches = [];

  // Single elimination bracket generation
  if (bracketType === "SINGLE_ELIMINATION") {
    const numRounds = Math.ceil(Math.log2(participants.length));
    let currentRound = 1;
    let currentPosition = 1;

    // Create first round matches
    while (participants.length > 1) {
      const player1 = participants.shift();
      const player2 = participants.length > 0 ? participants.pop() : null;

      matches.push({
        tournamentId: tournament.id,
        round: currentRound,
        position: currentPosition++,
        player1Id: player1?.id,
        player2Id: player2?.id,
        status: player2 ? "SCHEDULED" : "BYE",
      });
    }

    // Create subsequent rounds
    for (let round = 2; round <= numRounds; round++) {
      const matchesInRound = Math.pow(2, numRounds - round);
      for (let pos = 1; pos <= matchesInRound; pos++) {
        matches.push({
          tournamentId: tournament.id,
          round: round,
          position: pos,
          status: "SCHEDULED",
        });
      }
    }
  }

  // Add other bracket types here (DOUBLE_ELIMINATION, ROUND_ROBIN)

  return matches;
}
