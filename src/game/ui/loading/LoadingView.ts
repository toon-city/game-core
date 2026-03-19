import { Container, Graphics } from "pixi.js";
import { LoadingContainer } from "./components/LoadingContainer";

export class LoadingView extends Container {
    private readonly loadingContainer: LoadingContainer;
    

    constructor() {
        super();
        this.loadingContainer = new LoadingContainer("Chargement en cours", null);
    }

    public draw(width = 800, height = 600): void {
        this.removeChildren();

        const bg = new Graphics()
            .rect(0, 0, width, height)
            .fill(0x81c9e7);
        this.addChild(bg);

        this.loadingContainer.x = (width - this.loadingContainer.width) / 2;
        this.loadingContainer.y = (height - this.loadingContainer.height) / 2;

        this.addChild(this.loadingContainer);
    }

    public setMessage(message: string): void {
        this.loadingContainer.setMessage(message);
    }

    public setProgress(progress: number | null): void {
        this.loadingContainer.setProgress(progress);
    }
}