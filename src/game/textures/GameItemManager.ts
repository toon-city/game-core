import { Assets, Texture } from "pixi.js";
import { FurnitureBaseManager } from "../../core/manager/FurnitureBaseManager";
import { FurnitureBase } from "../../core/models/FurnitureBase";
import { AssetBaseUrl } from "../../core/AssetBaseUrl";

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
            const uri = AssetBaseUrl.resolve(`furnitures/${file}.json`);
            try {
                await Assets.load(uri);
                const furnitureBaseData = Assets.get(uri).data;
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
            const uri = AssetBaseUrl.resolve(`textures/floors/${file}`);
            try {
                const texture = await Assets.load(uri);
                this.floorTextures.set(id, texture);
            } catch (error) {
                console.error(`Error loading floor texture with id ${id} from file ${file}:`, error);
                return null;
            }
        }

        return this.floorTextures.get(id) || null;
    }
}