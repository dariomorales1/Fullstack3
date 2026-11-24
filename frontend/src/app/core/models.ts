export interface Producto {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  activo: boolean;
}

export interface ProductoInput {
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  activo?: boolean;
}

export interface ItemPedido {
  productoId: number;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal?: number;
}

export interface Pedido {
  id: number;
  clienteId: string;
  estado: string;
  total: number;
  items: ItemPedido[];
  creadoEn: string;
  entregadoEn?: string;
  leadTimeSegundos?: number;
}

export interface CrearPedido {
  clienteId: string;
  items: { productoId: number; nombreProducto: string; cantidad: number; precioUnitario: number }[];
}

export interface AuditoriaEvento {
  id: number;
  eventType: string;
  pedidoId: number;
  clienteId: string;
  estado: string;
  total: number;
  ocurridoEn: string;
  registradoEn: string;
}
