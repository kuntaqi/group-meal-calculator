import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2 } from 'lucide-react'

interface Item {
	name: string
	price: number
	quantity: number
	total: number
}

interface User {
	name: string
	items: Item[]
}

interface ByUserModeProps {
	users: User[]
	currency: string
	onAddUser: () => void
	onAddItem: (userIndex: number) => void
	onRemoveItem: (userIndex: number, itemIndex: number) => void
	onInputChange: (userIndex: number, itemIndex: number, field: keyof Item, value: string | number) => void
	getCurrencyPrefix: (currency: string) => string
}

export function ByUserMode({
							   users,
							   currency,
							   onAddUser,
							   onAddItem,
							   onRemoveItem,
							   onInputChange,
							   getCurrencyPrefix
						   }: ByUserModeProps) {
	return (
		<>
			<Button onClick={onAddUser} className="mt-4">
				<Plus className="h-4 w-4 mr-2"/> Add User
			</Button>
			{users.map((user, userIndex) => (
				<div key={userIndex} className="mt-4 mb-6 p-4 border rounded-lg">
					<div className="mb-4">
						<Label htmlFor={`user-${userIndex}`}>User Name</Label>
						<Input
							id={`user-${userIndex}`}
							value={user.name}
							onChange={(e) => onInputChange(userIndex, -1, 'name', e.target.value)}
							placeholder="Enter user name"
						/>
					</div>
					{user.items.map((item, itemIndex) => (
						<div key={itemIndex} className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-2">
							<Input
								className="w-full sm:w-1/3"
								value={item.name}
								onChange={(e) => onInputChange(userIndex, itemIndex, 'name', e.target.value)}
								placeholder="Item name"
							/>
							<div className="relative w-full sm:w-1/4">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  {getCurrencyPrefix(currency)}
                </span>
								<Input
									className="pl-9"
									type="number"
									step="1000"
									value={item.price === 0 ? '' : item.price}
									onChange={(e) => onInputChange(userIndex, itemIndex, 'price', e.target.value)}
									placeholder="0"
								/>
							</div>
							<Input
								className="w-full sm:w-1/6"
								type="number"
								value={item.quantity}
								onChange={(e) => onInputChange(userIndex, itemIndex, 'quantity', e.target.value)}
								placeholder="Qty"
								min="1"
							/>
							<Button variant="outline" size="icon" onClick={() => onRemoveItem(userIndex, itemIndex)}>
								<Trash2 className="h-4 w-4"/>
							</Button>
						</div>
					))}
					<Button onClick={() => onAddItem(userIndex)} className="mt-2">
						<Plus className="h-4 w-4 mr-2"/> Add Item
					</Button>
				</div>
			))}
		</>
	)
}