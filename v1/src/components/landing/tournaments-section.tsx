import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export function TournamentsSection() {
  // Mock data - in real app this would come from API
  const tournaments = [
    {
      id: 1,
      name: "Summer Championship",
      date: "June 15-18, 2025",
      prize: "$10,000",
      participants: 32,
      game: "Valorant",
      status: "Upcoming",
    },
    {
      id: 2,
      name: "Spring Invitational",
      date: "May 20-22, 2025",
      prize: "$5,000",
      participants: 16,
      game: "League of Legends",
      status: "Ongoing",
    },
    {
      id: 3,
      name: "Winter Clash",
      date: "December 10-12, 2025",
      prize: "$7,500",
      participants: 24,
      game: "CS:GO",
      status: "Upcoming",
    },
  ];

  const statusVariants = {
    Upcoming: "bg-blue-500",
    Ongoing: "bg-green-500",
    Completed: "bg-gray-500",
  };

  return (
    <section>
      <div className="container mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex w-full flex-col items-center">
            <h2 className="text-3xl font-bold md:text-4xl">
              Upcoming Tournaments
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Join the competition in these exciting upcoming events
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/tournaments">View All</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((tournament) => (
            <Card
              key={tournament.id}
              className="transition-shadow hover:shadow-lg"
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {tournament.name}
                  <Badge
                    className={
                      statusVariants[
                        tournament.status as keyof typeof statusVariants
                      ]
                    }
                  >
                    {tournament.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      Game:
                    </span>
                    <span className="font-medium">{tournament.game}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      Date:
                    </span>
                    <span className="font-medium">{tournament.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      Prize:
                    </span>
                    <span className="font-medium">{tournament.prize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      Participants:
                    </span>
                    <span className="font-medium">
                      {tournament.participants}
                    </span>
                  </div>
                  <Button asChild className="mt-4 w-full">
                    <Link href={`/dashboard/tournaments/${tournament.id}`}>
                      View Details
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
