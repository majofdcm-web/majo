export type Role = "mesero" | "barra" | "caja" | "gerente" | "admin";

export const ROLE_LABEL: Record<Role, string> = {
  mesero: "Mesero",
  barra: "Barra / cocina",
  caja: "Caja",
  gerente: "Gerente",
  admin: "Admin (dueña)",
};

export type Permission =
  | "mesas"
  | "cobrar"
  | "autorizar"
  | "barra"
  | "gastos"
  | "corte"
  | "compras"
  | "inventario"
  | "conteo"
  | "ventasHoy"
  | "panel"
  | "nomina"
  | "contador"
  | "usuarios"
  | "personal";

export const PERMISSION_LABEL: Record<Permission, string> = {
  mesas: "Abrir mesas y tomar comandas",
  cobrar: "Cobrar e imprimir cuenta",
  autorizar: "Autorizar descuentos y cancelaciones",
  barra: "Ver comandas de barra y cocina",
  gastos: "Registrar gastos de caja",
  corte: "Hacer corte de caja",
  compras: "Órdenes de compra y recepción",
  inventario: "Ver inventario, existencias y costos de insumos",
  conteo: "Capturar conteo físico",
  ventasHoy: "Ver ventas del día",
  panel: "Panel completo: costos, márgenes y utilidad",
  nomina: "Nómina y gastos fijos",
  contador: "Paquete para el contador",
  usuarios: "Usuarios, PIN y permisos",
  personal: "Registrar comida de personal",
};

export const DEFAULT_ROLE_PERMS: Record<Role, Permission[]> = {
  mesero: ["mesas", "personal"],
  barra: ["barra", "conteo"],
  caja: ["mesas", "cobrar", "gastos", "corte", "conteo", "personal"],
  gerente: [
    "mesas",
    "cobrar",
    "autorizar",
    "barra",
    "gastos",
    "corte",
    "compras",
    "inventario",
    "conteo",
    "ventasHoy",
    "personal",
  ],
  admin: [
    "mesas",
    "cobrar",
    "autorizar",
    "barra",
    "gastos",
    "corte",
    "compras",
    "inventario",
    "conteo",
    "ventasHoy",
    "panel",
    "nomina",
    "contador",
    "usuarios",
    "personal",
  ],
};

export interface User {
  id: string;
  name: string;
  role: Role;
  /** Hash del PIN (nunca texto plano). */
  pinHash: string;
}

export type PaymentMethod = "efectivo" | "tarjeta" | "transferencia";

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta · Mercado Pago",
  transferencia: "Transferencia",
};

export const CARD_COMMISSION = 0.05;

/** Modificador de receta: cuánto suma/resta de un insumo (negativo = descuenta menos). */
export type RecipeAdjust = [ingredientId: string, qtyPerUnit: number];

export interface ModifierOption {
  name: string;
  priceDelta: number;
  /** Se suma a la receta base del producto (ej. un extra). */
  recipe?: RecipeAdjust[];
  /** Reemplaza por completo la receta base (ej. tamaño grande, o elegir baguette/ciabatta). */
  recipeOverride?: RecipeAdjust[];
  /** Para grupos "many": viene seleccionado desde el inicio (ej. ingredientes que sí trae la receta). */
  defaultChecked?: boolean;
}

export interface ModifierGroup {
  id: string;
  name: string;
  type: "one" | "many";
  required: boolean;
  options: ModifierOption[];
}

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  cost: number;
  supplier: string;
  area: "Barra" | "Cocina" | "Almacén";
  stock: number;
  min: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  recipe: RecipeAdjust[];
  modifierGroupIds: string[];
}

export interface Table {
  id: string;
  name: string;
  orderId: string | null;
}

export interface SelectedModifier {
  groupId: string;
  name: string;
  priceDelta: number;
}

export type ItemStatus = "pendiente" | "enviado" | "listo";

export interface OrderItem {
  uid: string;
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
  modifiers: SelectedModifier[];
  recipe: Record<string, number>;
  unitCost: number;
  note: string;
  status: ItemStatus;
}

export type DeliveryMode = "aqui" | "llevar";

export const DELIVERY_MODE_LABEL: Record<DeliveryMode, string> = {
  aqui: "Para comer aquí",
  llevar: "Para llevar",
};

export interface Order {
  id: string;
  tableId: string;
  waiterId: string;
  waiterName: string;
  openedAt: number;
  people: number;
  items: OrderItem[];
  /** Nombre del cliente frecuente que se sentó en esta mesa, si aplica. */
  customerName?: string;
  /** Si es para comer en el café o para llevar (define si se empaca en desechable). */
  deliveryMode: DeliveryMode;
}

export interface Sale {
  id: string;
  folio: string;
  ts: number;
  tableName: string;
  waiterName: string;
  cashierName: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  discountAuthorizedBy: string | null;
  tip: number;
  total: number;
  method: PaymentMethod;
  commission: number;
  cost: number;
  customerName?: string;
  deliveryMode: DeliveryMode;
}

export const EXPENSE_ORIGINS = [
  "Caja del turno",
  "Mercado Pago",
  "Tarjeta de débito",
  "Transferencia",
  "Dinero personal de Majo",
] as const;
export type ExpenseOrigin = (typeof EXPENSE_ORIGINS)[number];

export const EXPENSE_CATEGORIES = [
  "Insumos",
  "Limpieza",
  "Mantenimiento",
  "Servicios",
  "Música y eventos",
  "Otro",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export interface Expense {
  id: string;
  ts: number;
  description: string;
  amount: number;
  supplier: string;
  origin: ExpenseOrigin;
  category: ExpenseCategory;
  hasInvoice: boolean;
  registeredBy: string;
}

export interface Shift {
  id: string;
  openedAt: number;
  closedAt: number | null;
  fund: number;
  openedBy: string;
}

export interface CashCount {
  shiftId: string;
  closedAt: number;
  expected: number;
  counted: number;
  difference: number;
  countedBy: string;
}

/** Comida que consume el personal: descuenta inventario pero no genera venta. */
export interface StaffConsumption {
  id: string;
  ts: number;
  employeeName: string;
  items: OrderItem[];
  cost: number;
  registeredBy: string;
}
