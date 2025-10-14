// components/ByItemMode.tsx
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, X } from 'lucide-react'
import { AssignItemModal } from './AssignItemModal'

interface ItemByItemMode {
	id: string
	name: string
	price: number
	quantity: number
}

interface MemberByItem {
	id: string
	name: string
	assignedItems: Array<{
		itemId: string
		itemName: string
		quantity: number
		pricePerUnit: number
	}>
}

interface ByItemModeProps {
	itemsByItem: ItemByItemMode[]
	membersByItem: MemberByItem[]
	currency: string
	showAssignModal: boolean
	currentMemberId: string | null
	selectedItemId: string
	assignQuantity: number
	onAddItem: () => void
	onRemoveItem: (id: string) => void
	onUpdateItem: (id: string, field: keyof ItemByItemMode, value: string | number) => void
	onAddMember: () => void
	onRemoveMember: (id: string) => void
	onUpdateMemberName: (id: string, name: string) => void
	onOpenAssignModal: (memberId: string) => void
	onCloseAssignModal: () => void
	onRemoveAssignedItem: (memberId: string, itemId: string) => void
	onAssignItem: () => void
	onSetSelectedItemId: (id: string) => void
	onSetAssignQuantity: (qty: number) => void
	getAvailableItems: (memberId: string) => ItemByItemMode[]
	getRemainingQuantity: (itemId: string) => number
	getTotalUnassigned: () => number
	getMemberSubtotal: (member: MemberByItem) => number
	formatCurrency: (amount: number) => string
	getCurrencyPrefix: (currency: string) => string
}

export function ByItemMode(props: ByItemModeProps) {
	const {
		itemsByItem,
		membersByItem,
		currency,
		showAssignModal,
		currentMemberId,
		selectedItemId,
		assignQuantity,
		onAddItem,
		onRemoveItem,
		onUpdateItem,
		onAddMember,
		onRemoveMember,
		onUpdateMemberName,
		onOpenAssignModal,
		onCloseAssignModal,
		onRemoveAssignedItem,
		onAssignItem,
		onSetSelectedItemId,
		onSetAssignQuantity,
		getAvailableItems,
		getRemainingQuantity,
		getTotalUnassigned,
		getMemberSubtotal,
		formatCurrency,
		getCurrencyPrefix
	} = props

	return (
		<>
			{/* Step 1: Add Items */}
			<div className="mb-6">
				<div className="flex justify-between items-center mb-4">
					<h3 className="text-lg font-semibold">Step 1: Add All Items</h3>
					<Button onClick={onAddItem} className="bg-green-500 hover:bg-green-600">
						<Plus className="h-4 w-4 mr-2"/> Add Item
					</Button>
				</div>

				<div className="space-y-3">
					{itemsByItem.map((item) => (
						<div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
							<Input
								value={item.name}
								onChange={(e) => onUpdateItem(item.id, 'name', e.target.value)}
								placeholder="Item name"
								className="flex-1"
							/>
							<div className="relative w-32">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  {getCurrencyPrefix(currency)}
                </span>
								<Input
									type="number"
									step="1000"
									value={item.price === 0 ? '' : item.price}
									onChange={(e) => onUpdateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
									placeholder="Price"
									className="pl-9"
								/>
							</div>
							<Input
								type="number"
								value={item.quantity}
								onChange={(e) => onUpdateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
								placeholder="Qty"
								min="1"
								className="w-20"
							/>
							<Button variant="ghost" size="icon" onClick={() => onRemoveItem(item.id)}>
								<Trash2 className="h-4 w-4 text-red-500"/>
							</Button>
						</div>
					))}
				</div>
			</div>

			{/* Unassigned Items Pool */}
			{itemsByItem.length > 0 && (
				<div className={`mb-6 p-4 border-2 border-dashed rounded-lg ${
					getTotalUnassigned() === 0
						? 'border-green-300 bg-green-50'
						: 'border-orange-300 bg-orange-50'
				}`}>
					<h3 className={`font-semibold mb-3 ${
						getTotalUnassigned() === 0 ? 'text-green-800' : 'text-orange-800'
					}`}>
						{getTotalUnassigned() === 0 ? '✅ All Items Assigned!' : '📦 Unassigned Items'}
					</h3>
					{getTotalUnassigned() > 0 && (
						<>
							<div className="flex flex-wrap gap-2">
								{itemsByItem.map(item => {
									const remaining = getRemainingQuantity(item.id)
									if (remaining > 0) {
										return (
											<span key={item.id} className="px-3 py-1 bg-white border border-orange-300 rounded-full text-sm">
                        {item.name} × {remaining}
                      </span>
										)
									}
									return null
								})}
							</div>
							<p className="text-sm text-orange-600 mt-2">
								⚠️ {getTotalUnassigned()} items remaining
							</p>
						</>
					)}
					{getTotalUnassigned() === 0 && (
						<p className="text-sm text-green-600">0 items remaining</p>
					)}
				</div>
			)}

			{/* Step 2: Add Members & Assign */}
			<div className="mb-6">
				<div className="flex justify-between items-center mb-4">
					<h3 className="text-lg font-semibold">Step 2: Add Members & Assign Items</h3>
					<Button onClick={onAddMember}>
						<Plus className="h-4 w-4 mr-2"/> Add Member
					</Button>
				</div>

				{membersByItem.map((member) => {
					const availableItems = getAvailableItems(member.id)
					const hasAvailableItems = availableItems.length > 0

					return (
						<div key={member.id} className="mb-4 p-4 border rounded-lg">
							<div className="flex items-center justify-between mb-3">
								<Input
									value={member.name}
									onChange={(e) => onUpdateMemberName(member.id, e.target.value)}
									placeholder="Member name"
									className="font-semibold flex-1 mr-3"
								/>
								<Button
									onClick={() => onOpenAssignModal(member.id)}
									disabled={!hasAvailableItems}
									className={hasAvailableItems ? 'bg-green-500 hover:bg-green-600' : ''}
									size="sm"
								>
									<Plus className="h-4 w-4 mr-1"/> Assign Item
								</Button>
								<Button variant="ghost" size="icon" onClick={() => onRemoveMember(member.id)} className="ml-2">
									<Trash2 className="h-4 w-4 text-red-500"/>
								</Button>
							</div>

							<div className="bg-gray-50 p-3 rounded">
								<p className="text-xs text-gray-500 mb-2">
									{member.assignedItems.length === 0 ? 'No items assigned yet' : 'Assigned items:'}
								</p>
								{member.assignedItems.length > 0 && (
									<div className="space-y-2">
										{member.assignedItems.map((item) => (
											<div key={item.itemId} className="flex items-center justify-between bg-white p-2 rounded border">
												<span className="text-sm">{item.itemName} × {item.quantity}</span>
												<div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            {formatCurrency(item.quantity * item.pricePerUnit)}
                          </span>
													<Button
														variant="ghost"
														size="sm"
														onClick={() => onRemoveAssignedItem(member.id, item.itemId)}
														className="h-6 w-6 p-0"
													>
														<X className="h-4 w-4 text-red-500"/>
													</Button>
												</div>
											</div>
										))}
									</div>
								)}
								{member.assignedItems.length > 0 && (
									<div className="mt-3 pt-2 border-t text-right">
                    <span className="text-sm font-semibold">
                      Subtotal: {formatCurrency(getMemberSubtotal(member))}
                    </span>
									</div>
								)}
							</div>
						</div>
					)
				})}
			</div>

			{/* Assignment Modal */}
			{showAssignModal && currentMemberId && (
				<AssignItemModal
					memberName={membersByItem.find(m => m.id === currentMemberId)?.name || 'Member'}
					availableItems={getAvailableItems(currentMemberId)}
					selectedItemId={selectedItemId}
					assignQuantity={assignQuantity}
					onClose={onCloseAssignModal}
					onAssign={onAssignItem}
					onSelectItem={onSetSelectedItemId}
					onSetQuantity={onSetAssignQuantity}
					getRemainingQuantity={getRemainingQuantity}
					formatCurrency={formatCurrency}
				/>
			)}
		</>
	)
}