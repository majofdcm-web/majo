import "server-only";
import { randomUUID } from "node:crypto";
import { verifyPin } from "@/lib/pin";
import {
  MODIFIER_GROUPS_REAL,
  seedIngredientsReal,
  seedProductsReal,
  seedTables,
  seedUsers,
} from "@/lib/seed";
import { round2 } from "@/lib/format";
import type {
  CashCount,
  DeliveryMode,
  Expense,
  ExpenseCategory,
  ExpenseOrigin,
  Ingredient,
  ModifierGroup,
  Order,
  OrderItem,
  PaymentMethod,
  Permission,
  PhysicalCount,
  Product,
  Role,
  Sale,
  SelectedModifier,
  Shift,
  StaffConsumption,
  Table,
  User,
} from "@/lib/types";
import { DEFAULT_ROLE_PERMS } from "@/lib/types";

interface AppState {
  users: User[];
  rolePerms: Record<Role, Permission[]>;
  ingredients: Ingredient[];
  products: Product[];
  modifierGroups: ModifierGroup[];
  tables: Table[];
  orders: Record<string, Order>;
  sales: Sale[];
  expenses: Expense[];
  shift: Shift | null;
  cashCounts: CashCount[];
  staffConsumptions: StaffConsumption[];
  physicalCounts: PhysicalCount[];
  folio: number;
  loginAttempts: Record<string, { count: number; lockedUntil: number }>;
}

/** Para datos de prueba: si el producto tiene un grupo de modificadores
 * obligatorio (tamaño, tipo de pan, combo...), elige la primera opción. */
/** Grupos cuyas opciones solo cuentan si antes se eligió "Combo (+$60)" en el grupo "combo". */
const COMBO_DEPENDENT_IDS = new Set(["comboCaliente", "comboFrio"]);

function defaultSelection(st: AppState, product: Product): SelectedModifier[] {
  const sel: SelectedModifier[] = [];
  for (const gid of product.modifierGroupIds) {
    if (COMBO_DEPENDENT_IDS.has(gid)) continue; // solo aplican si se eligió "Combo"; de prueba, por defecto no.
    const group = st.modifierGroups.find((g) => g.id === gid);
    if (!group) continue;
    if (group.type === "many") {
      for (const opt of group.options) {
        if (opt.defaultChecked) sel.push({ groupId: gid, name: opt.name, priceDelta: opt.priceDelta });
      }
      continue;
    }
    if (!group.required) continue;
    const opt = group.options[0];
    if (opt) sel.push({ groupId: gid, name: opt.name, priceDelta: opt.priceDelta });
  }
  return sel;
}

/** Arma una línea de comanda usando los catálogos de `st` directamente
 * (sin pasar por `state()`, que todavía no existe mientras se arma la semilla). */
function demoLine(
  st: AppState,
  productId: string,
  qty: number,
  status: OrderItem["status"],
): OrderItem {
  const product = st.products.find((p) => p.id === productId);
  if (!product) throw new Error(`Producto de semilla no encontrado: ${productId}`);
  const modifiers = defaultSelection(st, product);
  let recipe: Record<string, number> = {};
  for (const [ing, q] of product.recipe) recipe[ing] = (recipe[ing] ?? 0) + q;
  for (const m of modifiers) {
    const group = st.modifierGroups.find((g) => g.id === m.groupId);
    const opt = group?.options.find((o) => o.name === m.name);
    if (opt?.recipeOverride) {
      recipe = {};
      for (const [ing, q] of opt.recipeOverride) recipe[ing] = (recipe[ing] ?? 0) + q;
    }
  }
  for (const m of modifiers) {
    const group = st.modifierGroups.find((g) => g.id === m.groupId);
    const opt = group?.options.find((o) => o.name === m.name);
    for (const [ing, q] of opt?.recipe ?? []) recipe[ing] = (recipe[ing] ?? 0) + q;
  }
  const unitPrice = product.price + modifiers.reduce((a, m) => a + m.priceDelta, 0);
  const unitCost = Object.entries(recipe).reduce((a, [ingId, q]) => {
    const ing = st.ingredients.find((x) => x.id === ingId);
    return a + (ing ? ing.cost * Math.max(q, 0) : 0);
  }, 0);
  return {
    uid: randomUUID(),
    productId: product.id,
    name: product.name,
    qty,
    unitPrice,
    modifiers,
    recipe,
    unitCost: round2(unitCost),
    note: "",
    status,
  };
}

function demoSale(st: AppState, input: {
  ts: number; tableName: string; waiterName: string; cashierName: string;
  items: OrderItem[]; discount?: number; tip?: number; method: PaymentMethod;
}): Sale {
  const subtotal = input.items.reduce((a, i) => a + i.unitPrice * i.qty, 0);
  const discount = input.discount ?? 0;
  const tip = input.tip ?? 0;
  const total = subtotal - discount + tip;
  const cost = input.items.reduce((a, i) => a + i.unitCost * i.qty, 0);
  st.folio += 1;
  return {
    id: randomUUID(),
    folio: `A-${st.folio}`,
    ts: input.ts,
    tableName: input.tableName,
    waiterName: input.waiterName,
    cashierName: input.cashierName,
    items: input.items,
    subtotal,
    discount,
    discountAuthorizedBy: null,
    tip,
    total,
    method: input.method,
    commission: input.method === "tarjeta" ? round2(total * 0.05) : 0,
    cost: round2(cost),
    deliveryMode: "aqui",
  };
}

function seedState(): AppState {
  const st: AppState = {
    users: seedUsers(),
    rolePerms: structuredClone(DEFAULT_ROLE_PERMS),
    ingredients: seedIngredientsReal(),
    products: seedProductsReal(),
    modifierGroups: MODIFIER_GROUPS_REAL,
    tables: seedTables(),
    orders: {},
    sales: [],
    expenses: [],
    shift: { id: randomUUID(), openedAt: Date.now() - 3 * 3600000, closedAt: null, fund: 1000, openedBy: "Caja" },
    cashCounts: [],
    staffConsumptions: [],
    physicalCounts: [],
    folio: 1000,
    loginAttempts: {},
  };

  // un par de mesas ya abiertas, para poder probar comanda y cobro de inmediato
  const order1: Order = {
    id: randomUUID(),
    tableId: st.tables[0].id,
    waiterId: "u4",
    waiterName: "Mesero 1",
    openedAt: Date.now() - 18 * 60000,
    people: 2,
    items: [
      demoLine(st, "panMasaMadre", 1, "enviado"),
      demoLine(st, "cafeLatte", 1, "enviado"),
    ],
    deliveryMode: "aqui",
  };
  st.orders[order1.id] = order1;
  st.tables[0].orderId = order1.id;

  const order2: Order = {
    id: randomUUID(),
    tableId: st.tables[2].id,
    waiterId: "u5",
    waiterName: "Mesero 2",
    openedAt: Date.now() - 6 * 60000,
    people: 3,
    items: [demoLine(st, "clasicosGringos", 2, "pendiente")],
    deliveryMode: "llevar",
  };
  st.orders[order2.id] = order2;
  st.tables[2].orderId = order2.id;

  // ventas de ejemplo del turno actual, para que el corte de caja tenga números
  const shiftStart = st.shift!.openedAt;
  st.sales.push(
    demoSale(st, {
      ts: shiftStart + 20 * 60000,
      tableName: "Mesa 5",
      waiterName: "Mesero 1",
      cashierName: "Caja",
      items: [demoLine(st, "cafeLatte", 2, "listo")],
      method: "efectivo",
    }),
    demoSale(st, {
      ts: shiftStart + 55 * 60000,
      tableName: "Mesa 8",
      waiterName: "Mesero 2",
      cashierName: "Caja",
      items: [demoLine(st, "cafeCapuchino", 1, "listo"), demoLine(st, "molletesClasicos", 1, "listo")],
      tip: 20,
      method: "tarjeta",
    }),
    demoSale(st, {
      ts: shiftStart + 90 * 60000,
      tableName: "Mesa 7",
      waiterName: "Mesero 1",
      cashierName: "Caja",
      items: [demoLine(st, "cerveza", 2, "listo")],
      method: "transferencia",
    }),
  );
  for (const sale of st.sales) deductInventoryInto(st, sale.items, -1);

  // gastos de ejemplo del turno actual
  st.expenses.push(
    {
      id: randomUUID(),
      ts: shiftStart + 40 * 60000,
      description: "Hielo",
      amount: 90,
      supplier: "Otro",
      origin: "Caja del turno",
      category: "Insumos",
      hasInvoice: false,
      registeredBy: "Caja",
    },
    {
      id: randomUUID(),
      ts: shiftStart + 70 * 60000,
      description: "Artículos de limpieza",
      amount: 80,
      supplier: "Otro",
      origin: "Caja del turno",
      category: "Limpieza",
      hasInvoice: true,
      registeredBy: "Caja",
    },
  );

  return st;
}

function deductInventoryInto(st: AppState, items: OrderItem[], sign: 1 | -1) {
  for (const item of items) {
    for (const [ingId, q] of Object.entries(item.recipe)) {
      const ing = st.ingredients.find((x) => x.id === ingId);
      if (ing) ing.stock = round2(ing.stock + sign * q * item.qty);
    }
  }
}

/** Estado en memoria del servidor de desarrollo. Se reinicia si el servidor
 * se reinicia; eso está bien para datos de prueba. `globalThis` evita que
 * Next.js lo borre con cada recarga en caliente. */
const g = globalThis as unknown as { __akiiState?: AppState };
if (!g.__akiiState) g.__akiiState = seedState();

export function state(): AppState {
  return g.__akiiState!;
}

export function resetDemoData() {
  g.__akiiState = seedState();
}

export class PermissionError extends Error {
  constructor(message = "No tienes permiso para hacer esto.") {
    super(message);
  }
}

export function can(user: User | null | undefined, perm: Permission): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  return (state().rolePerms[user.role] || []).includes(perm);
}

function requirePerm(user: User | null | undefined, perm: Permission): User {
  if (!user || !can(user, perm)) throw new PermissionError();
  return user;
}

const MAX_ATTEMPTS = 5;
const LOCK_MS = 2 * 60 * 1000;

export function loginAttemptStatus(deviceId: string): { locked: boolean; remainingMs: number } {
  const a = state().loginAttempts[deviceId];
  if (!a) return { locked: false, remainingMs: 0 };
  const remaining = a.lockedUntil - Date.now();
  return { locked: remaining > 0, remainingMs: Math.max(0, remaining) };
}

export function findUserByPin(pin: string, deviceId: string): User | null {
  const attempts = state().loginAttempts;
  let record = attempts[deviceId];
  if (record && record.lockedUntil > Date.now()) return null;

  const user = state().users.find((u) => verifyPin(pin, u.pinHash)) ?? null;
  if (user) {
    delete attempts[deviceId];
    return user;
  }

  // Si ya había un bloqueo y ya pasó, se empieza a contar de nuevo desde cero.
  const lockAlreadyExpired = record && record.lockedUntil > 0 && record.lockedUntil <= Date.now();
  if (!record || lockAlreadyExpired) record = { count: 0, lockedUntil: 0 };

  record.count += 1;
  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOCK_MS;
    record.count = 0;
  }
  attempts[deviceId] = record;
  return null;
}

/** Busca un usuario con permiso de autorizar por su PIN (para descuentos/cancelaciones). */
export function findAuthorizer(pin: string): User | null {
  const user = state().users.find((u) => verifyPin(pin, u.pinHash));
  if (!user) return null;
  return can(user, "autorizar") ? user : null;
}

export function getUser(userId: string): User | null {
  return state().users.find((u) => u.id === userId) ?? null;
}

export function listTables(): Table[] {
  return state().tables;
}

export function getOrder(orderId: string): Order | null {
  return state().orders[orderId] ?? null;
}

export function listProductsByCategory(): { category: string; products: Product[] }[] {
  const byCat = new Map<string, Product[]>();
  for (const p of state().products) {
    if (!byCat.has(p.category)) byCat.set(p.category, []);
    byCat.get(p.category)!.push(p);
  }
  return [...byCat.entries()].map(([category, products]) => ({ category, products }));
}

export function modifierGroup(id: string): ModifierGroup | undefined {
  return state().modifierGroups.find((g) => g.id === id);
}

export function listModifierGroups(): ModifierGroup[] {
  return state().modifierGroups;
}

export function lineFor(
  product: Product,
  selected: SelectedModifier[],
  qty: number,
  note: string,
): OrderItem {
  const unitPrice = product.price + selected.reduce((a, m) => a + m.priceDelta, 0);
  let recipe: Record<string, number> = {};
  for (const [ing, q] of product.recipe) recipe[ing] = (recipe[ing] ?? 0) + q;
  // Un modificador con recipeOverride (ej. tamaño, tipo de pan) reemplaza toda la receta base.
  for (const m of selected) {
    const group = modifierGroup(m.groupId);
    const opt = group?.options.find((o) => o.name === m.name);
    if (opt?.recipeOverride) {
      recipe = {};
      for (const [ing, q] of opt.recipeOverride) recipe[ing] = (recipe[ing] ?? 0) + q;
    }
  }
  // Un modificador con recipe (ej. combo, extra) se suma encima de la receta ya resuelta.
  for (const m of selected) {
    const group = modifierGroup(m.groupId);
    const opt = group?.options.find((o) => o.name === m.name);
    for (const [ing, q] of opt?.recipe ?? []) recipe[ing] = (recipe[ing] ?? 0) + q;
  }
  const unitCost = Object.entries(recipe).reduce((a, [ingId, q]) => {
    const ing = state().ingredients.find((x) => x.id === ingId);
    return a + (ing ? ing.cost * Math.max(q, 0) : 0);
  }, 0);
  return {
    uid: randomUUID(),
    productId: product.id,
    name: product.name,
    qty,
    unitPrice,
    modifiers: selected,
    recipe,
    unitCost: round2(unitCost),
    note,
    status: "pendiente",
  };
}

export function openTable(user: User, tableId: string): Order {
  requirePerm(user, "mesas");
  const table = state().tables.find((t) => t.id === tableId);
  if (!table) throw new Error("Mesa no encontrada");
  if (table.orderId) {
    const existing = state().orders[table.orderId];
    if (existing) return existing;
  }
  const order: Order = {
    id: randomUUID(),
    tableId,
    waiterId: user.id,
    waiterName: user.name,
    openedAt: Date.now(),
    people: 2,
    items: [],
    deliveryMode: "aqui",
  };
  state().orders[order.id] = order;
  table.orderId = order.id;
  return order;
}

function assertCanEditOrder(user: User, order: Order) {
  if (order.waiterId === user.id) return;
  if (can(user, "cobrar") || can(user, "autorizar")) return;
  throw new PermissionError(`Esa mesa la abrió ${order.waiterName}; no puedes editarla.`);
}

export function closeEmptyOrder(user: User, orderId: string) {
  const order = state().orders[orderId];
  if (!order) return;
  if (order.items.length > 0) return;
  assertCanEditOrder(user, order);
  const table = state().tables.find((t) => t.id === order.tableId);
  if (table) table.orderId = null;
  delete state().orders[orderId];
}

export function setOrderPeople(user: User, orderId: string, people: number) {
  const order = state().orders[orderId];
  if (!order) throw new Error("Orden no encontrada");
  assertCanEditOrder(user, order);
  order.people = Math.max(1, people);
}

export function setOrderCustomer(user: User, orderId: string, customerName: string) {
  const order = state().orders[orderId];
  if (!order) throw new Error("Orden no encontrada");
  assertCanEditOrder(user, order);
  order.customerName = customerName.trim() || undefined;
}

export function setOrderDeliveryMode(user: User, orderId: string, mode: DeliveryMode) {
  const order = state().orders[orderId];
  if (!order) throw new Error("Orden no encontrada");
  assertCanEditOrder(user, order);
  order.deliveryMode = mode;
}

export interface CustomerStat {
  name: string;
  visits: number;
  total: number;
  lastVisit: number;
}

export function listFrequentCustomers(): CustomerStat[] {
  const map = new Map<string, CustomerStat>();
  for (const s of state().sales) {
    if (!s.customerName) continue;
    const cur = map.get(s.customerName) ?? { name: s.customerName, visits: 0, total: 0, lastVisit: 0 };
    cur.visits += 1;
    cur.total = round2(cur.total + s.total);
    cur.lastVisit = Math.max(cur.lastVisit, s.ts);
    map.set(s.customerName, cur);
  }
  return [...map.values()].sort((a, b) => b.lastVisit - a.lastVisit);
}

export function addItem(
  user: User,
  orderId: string,
  productId: string,
  selected: SelectedModifier[],
  qty: number,
  note: string,
) {
  const order = state().orders[orderId];
  if (!order) throw new Error("Orden no encontrada");
  assertCanEditOrder(user, order);
  const product = state().products.find((p) => p.id === productId);
  if (!product) throw new Error("Producto no encontrado");
  order.items.push(lineFor(product, selected, qty, note));
}

export function removeItem(user: User, orderId: string, itemUid: string) {
  const order = state().orders[orderId];
  if (!order) throw new Error("Orden no encontrada");
  const item = order.items.find((i) => i.uid === itemUid);
  if (item?.status !== "pendiente") {
    // ya se envió a preparación: requiere autorización, lo revisa el caller.
  }
  assertCanEditOrder(user, order);
  order.items = order.items.filter((i) => i.uid !== itemUid);
}

export function sendToKitchen(user: User, orderId: string) {
  const order = state().orders[orderId];
  if (!order) throw new Error("Orden no encontrada");
  assertCanEditOrder(user, order);
  for (const item of order.items) {
    if (item.status === "pendiente") item.status = "enviado";
  }
}

export interface KitchenItem {
  orderId: string;
  tableId: string;
  tableName: string;
  waiterName: string;
  openedAt: number;
  uid: string;
  name: string;
  qty: number;
  modifiers: string[];
  note: string;
}

export function listKitchenItems(): KitchenItem[] {
  const out: KitchenItem[] = [];
  for (const order of Object.values(state().orders)) {
    const table = state().tables.find((t) => t.id === order.tableId);
    for (const item of order.items) {
      if (item.status !== "enviado") continue;
      out.push({
        orderId: order.id,
        tableId: order.tableId,
        tableName: table?.name ?? "—",
        waiterName: order.waiterName,
        openedAt: order.openedAt,
        uid: item.uid,
        name: item.name,
        qty: item.qty,
        modifiers: item.modifiers.map((m) => m.name),
        note: item.note,
      });
    }
  }
  return out.sort((a, b) => a.openedAt - b.openedAt);
}

export function markItemReady(user: User, orderId: string, itemUid: string) {
  requirePerm(user, "barra");
  const order = state().orders[orderId];
  if (!order) throw new Error("Orden no encontrada");
  const item = order.items.find((i) => i.uid === itemUid);
  if (!item) throw new Error("Producto no encontrado");
  item.status = "listo";
}

function deductInventory(items: OrderItem[], sign: 1 | -1 = -1) {
  for (const item of items) {
    for (const [ingId, q] of Object.entries(item.recipe)) {
      const ing = state().ingredients.find((x) => x.id === ingId);
      if (ing) ing.stock = round2(ing.stock + sign * q * item.qty);
    }
  }
}

export interface PayOrderInput {
  method: PaymentMethod;
  tip: number;
  discount: number;
  discountAuthorizerId: string | null;
}

export function payOrder(user: User, orderId: string, input: PayOrderInput): Sale {
  requirePerm(user, "cobrar");
  const order = state().orders[orderId];
  if (!order) throw new Error("Orden no encontrada");
  if (order.items.length === 0) throw new Error("La mesa no tiene productos");

  if (input.discount > 0) {
    if (!input.discountAuthorizerId) throw new PermissionError("El descuento necesita autorización.");
    const authorizer = getUser(input.discountAuthorizerId);
    if (!authorizer || !can(authorizer, "autorizar")) {
      throw new PermissionError("Ese PIN no puede autorizar descuentos.");
    }
  }

  const table = state().tables.find((t) => t.id === order.tableId);
  const subtotal = order.items.reduce((a, i) => a + i.unitPrice * i.qty, 0);
  const total = subtotal - input.discount + input.tip;
  const cost = order.items.reduce((a, i) => a + i.unitCost * i.qty, 0);
  const commission = input.method === "tarjeta" ? round2(total * 0.05) : 0;

  state().folio += 1;
  const sale: Sale = {
    id: randomUUID(),
    folio: `A-${state().folio}`,
    ts: Date.now(),
    tableName: table?.name ?? "—",
    waiterName: order.waiterName,
    cashierName: user.name,
    items: order.items,
    subtotal,
    discount: input.discount,
    discountAuthorizedBy: input.discountAuthorizerId ? getUser(input.discountAuthorizerId)?.name ?? null : null,
    tip: input.tip,
    total,
    method: input.method,
    commission,
    cost: round2(cost),
    customerName: order.customerName,
    deliveryMode: order.deliveryMode,
  };

  deductInventory(order.items, -1);
  state().sales.push(sale);
  if (table) table.orderId = null;
  delete state().orders[orderId];
  return sale;
}

export function getSale(saleId: string): Sale | null {
  return state().sales.find((s) => s.id === saleId) ?? null;
}

export function registerExpense(
  user: User,
  input: {
    description: string;
    amount: number;
    supplier: string;
    origin: ExpenseOrigin;
    category: ExpenseCategory;
    hasInvoice: boolean;
    /** Si el gasto es una compra de insumo, suma esa cantidad al inventario
     * y recalcula el costo promedio del insumo con lo pagado. */
    stockPurchase?: { ingredientId: string; quantity: number };
  },
): Expense {
  requirePerm(user, "gastos");
  const { stockPurchase, ...rest } = input;
  const expense: Expense = {
    id: randomUUID(),
    ts: Date.now(),
    registeredBy: user.name,
    ...rest,
  };
  state().expenses.push(expense);

  if (stockPurchase && stockPurchase.quantity > 0) {
    const ing = state().ingredients.find((i) => i.id === stockPurchase.ingredientId);
    if (ing) {
      const unitCost = round2(input.amount / stockPurchase.quantity);
      const previousValue = round2(ing.stock * ing.cost);
      const purchaseValue = round2(stockPurchase.quantity * unitCost);
      const newStock = round2(ing.stock + stockPurchase.quantity);
      ing.cost = newStock > 0 ? round2((previousValue + purchaseValue) / newStock) : unitCost;
      ing.stock = newStock;
    }
  }

  return expense;
}

export function listExpensesForShift(shift: Shift): Expense[] {
  const end = shift.closedAt ?? Date.now();
  return state().expenses.filter((e) => e.ts >= shift.openedAt && e.ts <= end);
}

export function getCurrentShift(): Shift | null {
  return state().shift;
}

export function openShift(user: User, fund: number): Shift {
  requirePerm(user, "corte");
  if (state().shift) throw new Error("Ya hay un turno abierto.");
  const shift: Shift = { id: randomUUID(), openedAt: Date.now(), closedAt: null, fund, openedBy: user.name };
  state().shift = shift;
  return shift;
}

export function shiftNumbers(shift: Shift) {
  const end = shift.closedAt ?? Date.now();
  const sales = state().sales.filter((s) => s.ts >= shift.openedAt && s.ts <= end);
  const byMethod = (m: PaymentMethod) => sales.filter((s) => s.method === m).reduce((a, s) => a + (s.total - s.tip), 0);
  const cashSales = byMethod("efectivo");
  const expenses = listExpensesForShift(shift);
  const cashExpenses = expenses.filter((e) => e.origin === "Caja del turno").reduce((a, e) => a + e.amount, 0);
  const tipCard = sales.filter((s) => s.method !== "efectivo").reduce((a, s) => a + s.tip, 0);
  const tipCash = sales.filter((s) => s.method === "efectivo").reduce((a, s) => a + s.tip, 0);
  const expected = shift.fund + cashSales + tipCash - cashExpenses - tipCard - tipCash;
  return {
    sales,
    expenses,
    cashSales,
    card: byMethod("tarjeta"),
    transfer: byMethod("transferencia"),
    cashExpenses,
    tipCard,
    tipCash,
    expected: round2(expected),
    commission: round2(sales.reduce((a, s) => a + s.commission, 0)),
  };
}

export function closeShift(user: User, counted: number): CashCount {
  requirePerm(user, "corte");
  const shift = state().shift;
  if (!shift) throw new Error("No hay turno abierto.");
  const { expected } = shiftNumbers(shift);
  shift.closedAt = Date.now();
  const count: CashCount = {
    shiftId: shift.id,
    closedAt: shift.closedAt,
    expected,
    counted,
    difference: round2(counted - expected),
    countedBy: user.name,
  };
  state().cashCounts.push(count);
  state().shift = null;
  return count;
}

export function listUsers(): User[] {
  return state().users;
}

export function listRolePerms(): Record<Role, Permission[]> {
  return state().rolePerms;
}

export function setRolePermission(user: User, role: Role, perm: Permission, enabled: boolean) {
  requirePerm(user, "usuarios");
  if (role === "admin") return; // el admin siempre tiene todo
  const current = new Set(state().rolePerms[role] ?? []);
  if (enabled) current.add(perm);
  else current.delete(perm);
  state().rolePerms[role] = [...current];
}

export interface StaffConsumptionItemInput {
  productId: string;
  selected: SelectedModifier[];
  qty: number;
  note: string;
}

export function registerStaffConsumption(
  user: User,
  employeeName: string,
  items: StaffConsumptionItemInput[],
): StaffConsumption {
  requirePerm(user, "personal");
  const name = employeeName.trim();
  if (!name) throw new Error("Falta elegir quién comió.");
  if (items.length === 0) throw new Error("Agrega al menos un producto.");

  const lines = items.map((it) => {
    const product = state().products.find((p) => p.id === it.productId);
    if (!product) throw new Error("Producto no encontrado.");
    return lineFor(product, it.selected, it.qty, it.note);
  });

  deductInventory(lines, -1);
  const cost = round2(lines.reduce((a, i) => a + i.unitCost * i.qty, 0));
  const record: StaffConsumption = {
    id: randomUUID(),
    ts: Date.now(),
    employeeName: name,
    items: lines,
    cost,
    registeredBy: user.name,
  };
  state().staffConsumptions.push(record);
  return record;
}

export function listStaffConsumptions(limit = 30): StaffConsumption[] {
  return [...state().staffConsumptions].sort((a, b) => b.ts - a.ts).slice(0, limit);
}

export function listIngredients(): Ingredient[] {
  return [...state().ingredients].sort((a, b) => a.name.localeCompare(b.name, "es"));
}

export interface IngredientPatch {
  cost?: number;
  supplier?: string;
  area?: Ingredient["area"];
  min?: number;
  stock?: number;
}

export function updateIngredient(user: User, ingredientId: string, patch: IngredientPatch) {
  requirePerm(user, "inventario");
  const ing = state().ingredients.find((i) => i.id === ingredientId);
  if (!ing) throw new Error("Insumo no encontrado");
  if (patch.cost !== undefined) ing.cost = Math.max(0, patch.cost);
  if (patch.supplier !== undefined) ing.supplier = patch.supplier;
  if (patch.area !== undefined) ing.area = patch.area;
  if (patch.min !== undefined) ing.min = Math.max(0, patch.min);
  if (patch.stock !== undefined) ing.stock = Math.max(0, patch.stock);
  return ing;
}

export function listIngredientsByArea(area: Ingredient["area"]): Ingredient[] {
  return state()
    .ingredients.filter((i) => i.area === area)
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}

export interface PhysicalCountInput {
  ingredientId: string;
  counted: number;
}

export function submitPhysicalCount(user: User, area: Ingredient["area"], counts: PhysicalCountInput[]): PhysicalCount {
  requirePerm(user, "conteo");
  const lines = counts.map((c) => {
    const ing = state().ingredients.find((i) => i.id === c.ingredientId);
    if (!ing) throw new Error("Insumo no encontrado");
    const previousStock = ing.stock;
    const difference = round2(c.counted - previousStock);
    const differenceValue = round2(difference * ing.cost);
    ing.stock = Math.max(0, c.counted);
    return {
      ingredientId: ing.id,
      ingredientName: ing.name,
      unit: ing.unit,
      previousStock,
      countedStock: c.counted,
      difference,
      differenceValue,
    };
  });
  const record: PhysicalCount = {
    id: randomUUID(),
    ts: Date.now(),
    area,
    countedBy: user.name,
    lines,
  };
  state().physicalCounts.push(record);
  return record;
}

export function listPhysicalCounts(limit = 10): PhysicalCount[] {
  return [...state().physicalCounts].sort((a, b) => b.ts - a.ts).slice(0, limit);
}
