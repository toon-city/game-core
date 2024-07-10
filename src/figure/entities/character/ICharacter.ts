import { Application, Sprite } from "pixi.js";
import { IBodyPart } from "../../api/character/body_part/IBodyPart";
import { CharacterLegs } from "./body_part/CharacterLegs";

/**
 * Represents a character in the game.
 */
export interface ICharacter {
    app: Application;
    socle: Sprite | null;
    legs: CharacterLegs | null;
    leftArm: Sprite | null;
    rightArm: Sprite | null;
    head: Sprite | null;
    body: IBodyPart[];
    isWalking: boolean;

    /**
     * Makes the character walk.
     */
    walk(): void;

    /**
     * Stops the character from walking.
     */
    stopWalk(): void;

    /**
     * Sets the skin color of the character.
     * @param color - The color value to set.
     */
    setSkinColor(color: number): void;

    /**
     * Changes the direction of the character based on the arrow keys.
     * @param directions - A 4-byte number representing the arrow keys state. Each bit, starting from the most significant bit, corresponds respectively to the up arrow, down arrow, left arrow, and right arrow.
     */
    changeDirection(directions: number): void;
}