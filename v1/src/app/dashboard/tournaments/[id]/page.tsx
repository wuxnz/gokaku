"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/trpc/react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { Bracket } from "@/components/Bracket";
import { useState } from "react";
import React from "react";

export default function TournamentDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id ?? "";
  const { data: session } = useSession();
  const utils = api.useUtils();
  const [bracketError, setBracketError] = useState<string | null>(null);

  const { data: tournament, isLoading } = api.tournament.getById.useQuery({
    id,
  });

  const joinMutation = api.tournament.join.useMutation({
    onSuccess: () => {
      utils.tournament.getById.invalidate({ id });
    },
  });

  const deleteMutation = api.tournament.delete.useMutation({
    onSuccess: () => {
      router.push("/dashboard/tournaments");
    },
    onError: (error) => {
      console.error("Failed to delete tournament", error);
    },
  });

  // Fetch matches if tournament is started
  const {
    data: matches,
    isLoading: matchesLoading,
    refetch: refetchMatches,
  } = api.match.getByTournament.useQuery(
    { tournamentId: id },
    { enabled: !!tournament && !!(tournament as any).started },
  );

  const startMutation = api.tournament.start.useMutation({
    onSuccess: () => {
      utils.tournament.getById.invalidate({ id });
      refetchMatches();
      setBracketError(null);
    },
    onError: (err) => setBracketError(err.message),
  });

  const advanceWinnerMutation = api.match.update.useMutation({
    onSuccess: () => {
      refetchMatches();
      setBracketError(null);
    },
    onError: (err) => setBracketError(err.message),
  });

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this tournament?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleJoin = () => {
    if (session?.user?.id) {
      joinMutation.mutate({ tournamentId: id });
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!tournament) {
    return <div>Tournament not found</div>;
  }

  const isCreator = tournament.creatorId === session?.user?.id;
  const isParticipant = tournament.participants?.some(
    (p) => p.id === session?.user?.id,
  );

  return (
    <div className="container mx-auto flex flex-col gap-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{tournament.name}</h1>
        <Button variant="outline" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>

      <Card className="border">
        <CardHeader>
          <CardTitle className="text-lg">Tournament Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            <strong>Size:</strong> {tournament.size} teams
          </p>
          <p>
            <strong>Bracket Type:</strong> {tournament.bracketType}
          </p>
          <p>
            <strong>Rules:</strong> {tournament.rules}
          </p>
          <p>
            <strong>Prize:</strong> {tournament.prize}
          </p>
          <p>
            <strong>Start Date:</strong>{" "}
            {tournament.startDate.toLocaleDateString()}
          </p>
          <p>
            <strong>End Date:</strong> {tournament.endDate.toLocaleDateString()}
          </p>
        </CardContent>
      </Card>

      <Card className="border">
        <CardHeader>
          <CardTitle className="text-lg">Participants</CardTitle>
        </CardHeader>
        <CardContent>
          {tournament.participants?.length > 0 ? (
            <ul className="list-disc pl-5">
              {tournament.participants.map((participant) => (
                <li key={participant.id}>{participant.user.name}</li>
              ))}
            </ul>
          ) : (
            <p>No participants yet</p>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        {isCreator && (
          <>
            {/* Start Tournament Button */}
            {!(tournament as any).started &&
              (tournament.participants?.length ?? 0) >= 2 && (
                <Button
                  onClick={() => startMutation.mutate({ id })}
                  disabled={startMutation.isPending}
                  variant="default"
                  className="text-foreground!"
                >
                  {startMutation.isPending ? "Starting..." : "Start Tournament"}
                </Button>
              )}
            <Button
              onClick={() => router.push(`/dashboard/tournaments/${id}/edit`)}
              className="text-foreground!"
            >
              Edit Tournament
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="text-foreground!"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Tournament"}
            </Button>
          </>
        )}
        {!isCreator && !isParticipant && (
          <Button
            onClick={handleJoin}
            disabled={joinMutation.isPending}
            className="text-foreground!"
          >
            {joinMutation.isPending ? "Joining..." : "Join Tournament"}
          </Button>
        )}
        {!isCreator && isParticipant && (
          <Button variant="secondary" disabled>
            Already Joined
          </Button>
        )}
      </div>

      {/* Bracket Section */}
      {!!(tournament as any).started && (
        <div className="mt-8">
          <h2 className="mb-4 text-xl font-bold">Bracket</h2>
          {matchesLoading ? (
            <div>Loading bracket...</div>
          ) : matches && matches.length > 0 ? (
            <Bracket
              matches={matches.map((m) => ({
                id: m.id,
                round: m.round,
                position: m.position,
                player1Id: m.player1Id ?? undefined,
                player2Id: m.player2Id ?? undefined,
                winnerId: m.winnerId ?? undefined,
                status: m.status,
              }))}
              participants={
                tournament.participants?.map((p) => ({
                  id: p.user.id,
                  name: p.user.name || "Unknown",
                })) ?? []
              }
              bracketType={tournament.bracketType}
              isCreator={isCreator}
              onAdvanceWinner={(matchId, winnerId) => {
                advanceWinnerMutation.mutate({
                  id: matchId,
                  winnerId,
                  status: "COMPLETED",
                });
              }}
            />
          ) : (
            <div>No matches found.</div>
          )}
          {bracketError && (
            <div className="mt-2 text-red-500">{bracketError}</div>
          )}
        </div>
      )}
    </div>
  );
}
