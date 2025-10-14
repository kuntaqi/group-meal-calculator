// components/AssignItemModal.tsx
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X } from 'lucide-react'

interface ItemByItemMode {
	id: string
	name: string
	price: number
	quantity: number
}

interface AssignItemModalProps {
	memberName: string
	availableItems: ItemByItemMode[]
	selectedItemId: string
	assignQuantity: number
	onClose: () => void
	onAssign: () => void
	onSelectItem: (id: string) => void
	onSetQuantity: (qty: number) => void
	getRemainingQuantity: (itemId: string) => number
	formatCurrency: (amount: number) => string
}

export function AssignItemModal({
									memberName,
									availableItems,
									selectedItemId,
									assignQuantity,
									onClose,
									onAssign,
									onSelectItem,
									onSetQuantity,
									getRemainingQuantity,
									formatCurrency
								}: AssignItemModalProps) {
	const selectedItem = availableItems.find(i => i.id === selectedItemId)
	const maxQty = selectedItem ? getRemainingQuantity(selectedItem.id) : 0

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
				<div className="flex justify-between items-center mb-4">
					<h3 className="font-semibold text-lg">
						Assign Item to {memberName}
					</h3>
					<Button variant="ghost" size="icon" onClick={onClose}>
						<X className="h-4 w-4"/>
					</Button>
				</div>

				<div className="mb-4">
					<Label className="mb-2">Select Item</Label>
					<Select value={selectedItemId} onValueChange={onSelectItem}>
						<SelectTrigger>
							<SelectValue placeholder="-- Choose an item --"/>
						</SelectTrigger>
						<SelectContent>
							{availableItems.map(item => (
								<SelectItem key={item.id} value={item.id}>
									{item.name} ({getRemainingQuantity(item.id)} available) - {formatCurrency(item.price)} each
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{availableItems.length === 0 && (
						<p className="text-xs text-red-500 mt-1">
							⚠️ All items have been assigned
						</p>
					)}
				</div>

				{selectedItemId && (
					<>
						<div className="mb-4">
							<Label className="mb-2">Quantity</Label>
							<Input
								type="number"
								value={assignQuantity}
								onChange={(e) => onSetQuantity(parseInt(e.target.value) || 1)}
								min="1"
								max={maxQty}
							/>
							<p className="text-xs text-gray-500 mt-1">
								Maximum: {maxQty} available
							</p>
						</div>

						<div className="mb-4 p-3 bg-blue-50 rounded">
							<p className="text-sm">
								<strong>Preview:</strong> {selectedItem?.name} × {assignQuantity} = {formatCurrency((selectedItem?.price || 0) * assignQuantity)}
							</p>
						</div>
					</>
				)}

				<div className="flex gap-2">
					<Button
						onClick={onAssign}
						disabled={!selectedItemId || assignQuantity <= 0}
						className="flex-1 bg-blue-500 hover:bg-blue-600"
					>
						Add to {memberName}
					</Button>
					<Button onClick={onClose} variant="outline">
						Cancel
					</Button>
				</div>
			</div>
		</div>
	)
}