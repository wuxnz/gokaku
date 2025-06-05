import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/server/auth";
import type { User } from "@prisma/client";
import { CalendarDays, Trophy, Users } from "lucide-react";
import { db } from "@/server/db";

import type { Session } from "next-auth";

// Define extended user type to include additional fields
interface ExtendedUser extends User {
  tournaments?: { id: string }[];
  winnerMatches?: { id: string }[];
  organizedTournaments?: { id: string }[];
}

// Reusable error component
function ErrorMessage({ title, message }: { title: string; message: string }) {
  return (
    <div className="container mx-auto py-8">
      <div className="rounded-lg bg-red-50 p-4 text-center text-red-500">
        <p>{title}</p>
        <p className="mt-2 text-sm">{message}</p>
      </div>
    </div>
  );
}

export default async function ProfilePage() {
  let session: Session | null = null;

  try {
    session = await auth();
  } catch (error) {
    return (
      <ErrorMessage
        title="Authentication Error"
        message="Failed to load session. Please try again later."
      />
    );
  }

  if (!session) {
    return (
      <ErrorMessage
        title="Authentication Required"
        message="Please sign in to view your profile"
      />
    );
  }

  const user = session.user;
  if (!user) {
    return (
      <ErrorMessage
        title="User Profile Not Found"
        message="Please check your account or try again later"
      />
    );
  }

  // Handle loading state
  if (!user) return <div>Loading profile...</div>;

  const extendedUser = user as ExtendedUser;

  // Memoize stats calculation
  // Fetch actual stats from database
  const [tournamentsJoined, matchesWon, tournamentsOrganized] =
    await Promise.all([
      db.tournament.count({
        where: {
          participants: {
            some: {
              id: user.id,
            },
          },
        },
      }),
      db.match.count({
        where: {
          winnerId: user.id,
        },
      }),
      db.tournament.count({
        where: {
          organizerId: user.id,
        },
      }),
    ]);

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <ProfileCard
          user={{
            id: extendedUser.id,
            name: extendedUser.name,
            email: extendedUser.email,
            emailVerified: extendedUser.emailVerified,
            image: extendedUser.image,
          }}
        />
        <StatsCard
          tournaments={tournamentsJoined}
          wins={matchesWon}
          organized={tournamentsOrganized}
        />
      </div>
    </div>
  );
}

function ProfileCard({ user }: { user: User }) {
  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          {user.image && (
            <img
              src={user.image}
              alt={user.name || "User"}
              className="size-20 rounded-full"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatsCard({
  tournaments,
  wins,
  organized,
}: {
  tournaments: number;
  wins: number;
  organized: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistics</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <StatItem
          icon={<Users className="size-5" />}
          label="Tournaments Joined"
          value={tournaments}
        />
        <StatItem
          icon={<Trophy className="size-5" />}
          label="Matches Won"
          value={wins}
        />
        <StatItem
          icon={<CalendarDays className="size-5" />}
          label="Tournaments Organized"
          value={organized}
        />
      </CardContent>
    </Card>
  );
}

function StatItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-medium">{label}</span>
      </div>
      <span className="text-lg font-bold">{value}</span>
    </div>
  );
}
