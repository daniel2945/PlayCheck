import GameCard from "../components/GameCard";

export default function GamesCatalog({ setView }) {
  const mockGames = [
    { id: 1, title: "Cyberpunk 2077" },
    { id: 2, title: "Elden Ring" },
    { id: 3, title: "Hogwarts Legacy" },
    { id: 4, title: "Starfield" },
    { id: 5, title: "Red Dead Redemption 2" },
    { id: 6, title: "Spider-Man Remastered" },
  ];

  return (
    <div className="px-6 py-12 max-w-6xl mx-auto">
      <h2 className="text-3xl text-[#e8eaed] mb-8 font-medium">
        Games Catalog
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {mockGames.map((game) => (
          <GameCard key={game.id} title={game.title} setView={setView} />
        ))}
      </div>
    </div>
  );
}
