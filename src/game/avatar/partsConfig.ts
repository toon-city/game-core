export type PartConfig = {
  category: string;
  id?: string;
  className: string;
  order: number;
  required?: boolean;
};

export const PARTS_CONFIG: PartConfig[] = [
  { category: 'body', className: 'AvatarArms', id: 'right', order: 0, required: true },
  { category: 'body', className: 'AvatarLegs',             order: 1, required: true },
  { category: 'body', className: 'AvatarBody',             order: 2, required: true },
  { category: 'tshirt', className: 'Tshirt', order: 3, id: 'tshirt_april7' },
  { category: 'body', className: 'AvatarArms', id: 'left',  order: 4, required: true },
  { category: 'body', className: 'AvatarHead',             order: 5, required: true },
  { category: 'hair', className: 'Hair', order: 6, id: 'hair7' },
  { category: 'hat',  className: 'Hat',  order: 7, id: 'hat_april1' }
];

export function getPartsInOrder(): PartConfig[] {
  return [...PARTS_CONFIG].sort((a, b) => a.order - b.order);
}

export function getPartsByCategory(category: string): PartConfig[] {
  return PARTS_CONFIG.filter(part => part.category === category);
}

export function addPartConfig(config: PartConfig): void {
  PARTS_CONFIG.push(config);
  PARTS_CONFIG.sort((a, b) => a.order - b.order);
}