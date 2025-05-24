// // src/modules/furniture/FurnitureController.ts

// import { House } from '../../core/models/House';
// import { Furniture } from '../../core/models/Furniture';

// export class FurnitureController {
//   constructor(private readonly house: House) {}

//   /**
//    * Déplace un meuble aux coordonnées (x, y).
//    * @param furniture Le modèle du meuble à déplacer.
//    * @param x Nouvelle position en X.
//    * @param y Nouvelle position en Y.
//    */
//   moveFurniture(furniture: Furniture, x: number, y: number): void {
//     furniture.setPosition(x, y);
//   }

//   /**
//    * Change l'orientation d'un meuble.
//    * @param furniture Le modèle du meuble.
//    * @param orientation Nouvelle orientation (en degrés).
//    */
//   rotateFurniture(furniture: Furniture, orientation: number): void {
//     furniture.setOrientation(orientation);
//   }

//   /**
//    * Supprime un meuble de la maison.
//    * @param furniture Le modèle du meuble à retirer.
//    */
//   removeFurniture(furniture: Furniture): void {
//     this.house.removeFurniture(furniture);
//   }
// }
