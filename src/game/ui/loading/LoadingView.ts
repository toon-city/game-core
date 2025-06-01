import { Container, Graphics } from "pixi.js";
import { LoadingContainer } from "./components/LoadingContainer";

export class LoadingView extends Container {
    private message: string = "Chargement en cours...";
    private progress: number | null = 0;
    

    constructor() {
        super();
        this.draw();
    }

    private draw(): void {
        this.removeChildren();
        const height = 800;
        const width = 800;

        const bg = new Graphics()
            .rect(0, 0, width, height)
            .fill(0x81c9e7);
        this.addChild(bg);

        const loadingContainer = new LoadingContainer(this.message, this.progress);
        loadingContainer.x = (width - loadingContainer.width) / 2;
        loadingContainer.y = (height - loadingContainer.height) / 2;
        
        this.addChild(loadingContainer);
    }

    public setMessage(message: string): void {
        this.message = message;
        this.draw();
    }

    public setProgress(progress: number | null): void {
        this.progress = progress;
        this.draw();
    }
}