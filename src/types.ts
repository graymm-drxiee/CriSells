export type CameraCategory = "Mirrorless" | "DSLR" | "Cinema" | "Drone" | "Action" | "Film";

export interface Camera {
	id: string;
	name: string;
	brand: string;
	category: CameraCategory;
	pricePerDay: number;
	image: string;
	gallery: string[];
	rating: number;
	reviews: number;
	description: string;
	sku?: string;
	specs: {
		sensor: string;
		resolution: string;
		video: string;
		weight: string;
		mount: string;
		battery: string;
	};
	features: string[];
	available: boolean;
	tag?: string;
}

export interface CartItem {
	camera: Camera;
	startDate: string;
	endDate: string;
	days: number;
	total: number;
}

export interface ClientUser {
	email: string;
	name: string;
	phone?: string;
	address?: string;
	role?: string;
}

export interface CheckoutDetails {
	customer: { fullName: string; email: string; phone: string; address: string };
	deliveryMode: string;
}

export interface ClientOrderItem {
	productId: string | null;
	name: string;
	qty: number;
	pricePerDay: number;
	days: number;
	startDate?: string | null;
	endDate?: string | null;
	total?: number;
}

export interface ClientOrderCustomer {
	fullName: string;
	email: string;
	phone: string;
	address?: string;
}

export interface ClientOrder {
	id: string;
	orderNumber: string;
	status: string;
	total: number;
	subtotal?: number;
	insurance?: number;
	deliveryMode?: string;
	customer?: ClientOrderCustomer;
	createdAt: string;
	items: ClientOrderItem[];
}
