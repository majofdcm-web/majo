import { hashPin } from "@/lib/pin";
import type {
  Ingredient,
  ModifierGroup,
  Product,
  Table,
  User,
} from "@/lib/types";

/** Usuarios de prueba. El PIN real nunca se guarda así; aquí solo mostramos
 * cuál es para que Majo pueda probar cada rol. En la base de datos se guarda
 * cifrado (ver lib/pin.ts). */
export const DEMO_PINS: { name: string; role: User["role"]; pin: string }[] = [
  { name: "Majo", role: "admin", pin: "1111" },
  { name: "Gerente", role: "gerente", pin: "2222" },
  { name: "Caja", role: "caja", pin: "3333" },
  { name: "Mesero 1", role: "mesero", pin: "4444" },
  { name: "Mesero 2", role: "mesero", pin: "5555" },
  { name: "Barra", role: "barra", pin: "6666" },
];

export function seedUsers(): User[] {
  return DEMO_PINS.map((u, i) => ({
    id: `u${i + 1}`,
    name: u.name,
    role: u.role,
    pinHash: hashPin(u.pin),
  }));
}

export const MODIFIER_GROUPS: ModifierGroup[] = [
  {
    id: "tam",
    name: "Tamaño",
    type: "one",
    required: true,
    options: [
      { name: "Chico", priceDelta: 0 },
      {
        name: "Grande",
        priceDelta: 7,
        recipe: [
          ["cafe", 0.009],
          ["leche", 0.1],
        ],
      },
    ],
  },
  {
    id: "leche",
    name: "Leche",
    type: "one",
    required: true,
    options: [
      { name: "Entera", priceDelta: 0 },
      { name: "Deslactosada", priceDelta: 0 },
      {
        name: "Avena",
        priceDelta: 15,
        recipe: [
          ["avena", 0.25],
          ["leche", -0.25],
        ],
      },
    ],
  },
  {
    id: "extra",
    name: "Extras",
    type: "many",
    required: false,
    options: [
      { name: "Shot extra", priceDelta: 12, recipe: [["cafe", 0.009]] },
      { name: "Jarabe", priceDelta: 10, recipe: [["jarabe", 0.03]] },
      { name: "Sin azúcar", priceDelta: 0 },
      { name: "Para llevar", priceDelta: 0 },
    ],
  },
];

export function seedIngredients(): Ingredient[] {
  const rows: [string, string, string, number, string, Ingredient["area"], number, number][] = [
    ["cafe", "Café en grano", "kg", 380, "Andrés", "Barra", 4.5, 2],
    ["leche", "Leche entera", "L", 24, "Sam's Club", "Barra", 24, 10],
    ["avena", "Leche de avena", "L", 60, "Sam's Club", "Barra", 8, 4],
    ["choco", "Chocolate en polvo", "kg", 150, "Andrés", "Barra", 2, 1],
    ["frappe", "Polvo para frappé", "kg", 220, "Andrés", "Barra", 2.5, 1],
    ["jarabe", "Jarabe de sabor", "L", 120, "Mercado Libre", "Barra", 3, 1],
    ["hielo", "Hielo", "kg", 6, "Otro", "Barra", 20, 10],
    ["limon", "Limón", "kg", 30, "Libni Areli Monroy", "Cocina", 3, 3],
    ["totopo", "Totopos", "kg", 60, "Sam's Club", "Cocina", 4, 2],
    ["jitomate", "Jitomate", "kg", 28, "Libni Areli Monroy", "Cocina", 2, 5],
    ["crema", "Crema", "kg", 90, "Sam's Club", "Cocina", 2, 1],
    ["queso", "Queso", "kg", 160, "Sam's Club", "Cocina", 3, 1.5],
    ["frijol", "Frijol", "kg", 40, "Sam's Club", "Cocina", 4, 2],
    ["bolillo", "Bolillo", "pz", 5, "Jimena Gómez", "Cocina", 30, 15],
    ["jamon", "Jamón", "kg", 180, "La Michoacana", "Cocina", 1.5, 1],
    ["pancasa", "Pan de casa", "pz", 32, "Jimena Gómez", "Almacén", 14, 10],
    ["aguacate", "Aguacate", "kg", 70, "Libni Areli Monroy", "Cocina", 1, 4],
    ["lechuga", "Lechuga", "pz", 20, "Libni Areli Monroy", "Cocina", 4, 3],
    ["cerveza", "Cerveza", "pz", 22, "Sam's Club", "Almacén", 48, 24],
    ["mezcal", "Mezcal", "L", 600, "Otro", "Almacén", 3, 1],
  ];
  return rows.map(([id, name, unit, cost, supplier, area, stock, min]) => ({
    id,
    name,
    unit,
    cost,
    supplier,
    area,
    stock,
    min,
  }));
}

export function seedProducts(): Product[] {
  const rows: [string, string, string, number, Product["recipe"], string[]][] = [
    ["americano", "Americano", "Café caliente", 40, [["cafe", 0.018]], ["tam", "extra"]],
    ["latte", "Latte", "Café caliente", 55, [["cafe", 0.018], ["leche", 0.25]], ["tam", "leche", "extra"]],
    ["capu", "Capuchino", "Café caliente", 55, [["cafe", 0.018], ["leche", 0.22]], ["tam", "leche", "extra"]],
    ["mocha", "Mocha", "Café caliente", 62, [["cafe", 0.018], ["leche", 0.22], ["choco", 0.025]], ["tam", "leche", "extra"]],
    ["frappe", "Frappé", "Bebidas frías", 75, [["cafe", 0.018], ["leche", 0.2], ["frappe", 0.04], ["hielo", 0.25]], ["leche", "extra"]],
    ["limonada", "Limonada", "Bebidas frías", 45, [["limon", 0.15], ["hielo", 0.2]], []],
    ["chilaq", "Chilaquiles", "Desayunos", 120, [["totopo", 0.15], ["jitomate", 0.2], ["crema", 0.05], ["queso", 0.04]], []],
    ["mollete", "Molletes", "Desayunos", 95, [["bolillo", 2], ["frijol", 0.1], ["queso", 0.06]], []],
    ["sandw", "Sándwich de jamón", "Desayunos", 95, [["bolillo", 1], ["jamon", 0.08], ["queso", 0.03], ["jitomate", 0.04]], []],
    ["pancasa", "Pan de casa", "Pan", 64, [["pancasa", 1]], []],
    ["ensalada", "Ensalada", "Comida", 110, [["lechuga", 0.5], ["aguacate", 0.1], ["jitomate", 0.08], ["queso", 0.03]], []],
    ["cerveza", "Cerveza", "Bar", 55, [["cerveza", 1]], []],
    ["mezcal", "Mezcal", "Bar", 85, [["mezcal", 0.045]], []],
  ];
  return rows.map(([id, name, category, price, recipe, modifierGroupIds]) => ({
    id,
    name,
    category,
    price,
    recipe,
    modifierGroupIds,
  }));
}

export const SUPPLIERS = [
  "Libni Areli Monroy",
  "Sam's Club",
  "La Michoacana",
  "Andrés",
  "Jimena Gómez",
  "Mercado Libre",
  "Otro",
] as const;

export function seedTables(): Table[] {
  const names = [
    "Mesa 1", "Mesa 2", "Mesa 3", "Mesa 4", "Mesa 5", "Mesa 6", "Mesa 7", "Mesa 8",
    "Barra", "Terraza 1", "Terraza 2", "Para llevar",
  ];
  return names.map((name, i) => ({ id: `t${i}`, name, orderId: null }));
}
