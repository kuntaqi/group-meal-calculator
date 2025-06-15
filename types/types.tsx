export interface Item {
	name: string,
	price: number,
	quantity: number,
	total: number
}

export interface User {
	name: string,
	items: Item[]
}

export interface Discount {
	type: "percentage" | "amount",
	value: number
}

export interface Result {
	name: string,
	items: Item[],
	subtotal: number,
	discount: number,
	shipping: number,
	share: number
}

export interface ReceiptProps {
	billPayer: string
	date: string
	restaurantName: string
	results: Result[]
	currency: string
}