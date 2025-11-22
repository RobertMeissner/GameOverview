export class Game {
    public name: string = "";
    public steam_app_id: number = 0;
    public steam_thumbnail_url: string = ""

    constructor(public readonly id: string) {
        console.log(id)
    }

    static create(name: string): Game {
        if (!name.trim()) throw new Error("name is required");

        const id = Game.generateHash(name)
        const game = new Game(id);
        game.name = name
        return game
    }

    private static generateHash(name: string): string {
        return name
    }
}
