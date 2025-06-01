import { FurnitureBase } from "../models/FurnitureBase";

export class FurnitureBaseManager {
    private static instance: FurnitureBaseManager;
    private readonly furnitureBases: Map<number, FurnitureBase> = new Map();

    private constructor() {}

    public static getInstance(): FurnitureBaseManager {
        if (!FurnitureBaseManager.instance) {
            FurnitureBaseManager.instance = new FurnitureBaseManager();
        }
        return FurnitureBaseManager.instance;
    }

    public addFurnitureBase(furniture: FurnitureBase): void {
        this.furnitureBases.set(furniture.id, furniture);
    }

    public getFurnitureBase(id: number): FurnitureBase | null {
        return this.furnitureBases.get(id) ?? null;
    }

    public removeFurnitureBase(id: number): void {
        this.furnitureBases.delete(id);
    }

    public getAllFurnitureBases(): FurnitureBase[] {
        return Array.from(this.furnitureBases.values());
    }
}