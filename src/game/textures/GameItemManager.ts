import { Assets, Texture } from "pixi.js";
import { FurnitureBaseManager } from "../../core/manager/FurnitureBaseManager";
import { FurnitureBase } from "../../core/models/FurnitureBase";
import { AssetBaseUrl } from "@toon-live/game-avatar";

/**
 * Where a floor/wall texture item's image actually lives — a single source
 * of truth for both GameItemManager's own Assets.load call below and
 * GameCore.applyTexture, which needs this same string to hand to
 * Wall/Area.setTexture (AreaView/WallView's autorun re-resolves it via
 * `Texture.from(url)`, which only hits Pixi's cache instead of re-fetching
 * if it's the EXACT string Assets.load was called with here).
 *
 * `file` is a flat filename (e.g. "brique_rouge.jpg") — unlike furniture's
 * `{spriteKey}/{spritePath}.json` convention, these are plain images with no
 * per-item subfolder; spriteKey isn't part of the path at all.
 */
export function resolveFloorTextureUrl(file: string): string {
    return AssetBaseUrl.resolve(`textures/floors/${file}`);
}
export function resolveWallTextureUrl(file: string): string {
    return AssetBaseUrl.resolve(`textures/walls/${file}`);
}

export class GameItemManager {
    private static instance: GameItemManager;
    private readonly furnitureBaseManager = FurnitureBaseManager.getInstance();
    private readonly floorTextures: Map<number, Texture> = new Map();
    private readonly wallTextures: Map<number, Texture> = new Map();

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
            const uri = resolveFloorTextureUrl(file);
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

    /** Same idea as getFloorTexture, for ItemSubType.WALLPAPER items ("textures/walls/{file}"). */
    public async getWallTexture(id: number, file: string): Promise<Texture | null> {
        if (!this.wallTextures.has(id)) {
            const uri = resolveWallTextureUrl(file);
            try {
                const texture = await Assets.load(uri);
                this.wallTextures.set(id, texture);
            } catch (error) {
                console.error(`Error loading wall texture with id ${id} from file ${file}:`, error);
                return null;
            }
        }

        return this.wallTextures.get(id) || null;
    }
}
