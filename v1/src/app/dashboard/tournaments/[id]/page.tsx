"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/trpc/react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";

export default function TournamentDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { data: session } = useSession();
  const utils = api.useUtils();

  const { data: tournament, isLoading } = api.tournament.getById.useQuery({
    id,
  });

  const joinMutation = api.tournament.join.useMutation({
    onSuccess: () => {
      utils.tournament.getById.invalidate({ id });
    },
  });

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
                <li key={participant.id}>{participant.name}</li>
              ))}
            </ul>
          ) : (
            <p>No participants yet</p>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        {isCreator && (
          <Button
            onClick={() => router.push(`/dashboard/tournaments/${id}/edit`)}
            className="text-foreground!"
          >
            Edit Tournament
          </Button>
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
    </div>
  );
}
