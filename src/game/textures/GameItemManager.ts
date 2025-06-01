import { Assets, Texture } from "pixi.js";
import { FurnitureBaseManager } from "../../core/manager/FurnitureBaseManager";
import { FurnitureBase } from "../../core/models/FurnitureBase";

export class GameItemManager {
    private static instance: GameItemManager;
    private readonly furnitureBaseManager = FurnitureBaseManager.getInstance();
    private readonly floorTextures: Map<number, Texture> = new Map();

    public getFurnitureBaseManager(): FurnitureBaseManager {
        return this.furnitureBaseManager;
    }

    private constructor() {}

    public static getInstance(): GameItemManager {
        if (!GameItemManager.instance) {
            GameItemManager.instance = new GameItemManager();
        }
        return GameItemManager.instance;
    }
    
    public async getFurnitureBase(id: number, type: number, file: string): Promise<FurnitureBase | null> {
        if (!this.furnitureBaseManager.getFurnitureBase(id)) {
            try {
                await Assets.load(`assets/furnitures/${file}.json`);
                const furnitureBaseData = Assets.get(`assets/furnitures/${file}.json`).data;
                this.furnitureBaseManager.addFurnitureBase(new FurnitureBase(id, type, furnitureBaseData));
            } catch (error) {
                console.error(`Error loading furniture base with id ${id} from file ${file}:`, error);
                return null;
            }
        }

        return this.furnitureBaseManager.getFurnitureBase(id);
    }

    public async getFloorTexture(id: number, file: string): Promise<Texture | null> {
        if (!this.floorTextures.has(id)) {
            try {
                const texture = await Assets.load(`assets/textures/floors/${file}`);
                this.floorTextures.set(id, texture);
            } catch (error) {
                console.error(`Error loading floor texture with id ${id} from file ${file}:`, error);
                return null;
            }
        }

        return this.floorTextures.get(id) || null;
    }
}