import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronDown, ChevronUp, Plus, Trash2, Upload, X } from 'lucide-react'
import { AssignItemModal } from './AssignItemModal'
import { extractOrderItems } from "@/utils/extractOrderItems";
import React, { useState } from "react";
import { toast } from "react-hot-toast";

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
	onImportExtractedItems: (parsedItems: { name: string; qty: number; price: number }[]) => void;
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

	const [ loadingImport, setLoadingImport ] = useState(false);
	const [ showTips, setShowTips ] = useState(false);


	async function handleImportReceipt(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[ 0 ];
		if (!file) return;

		if (!file.type.startsWith("image/")) {
			toast.error("❌ Only image files (JPG, PNG, etc.) are supported.");
			e.target.value = "";
			return;
		}

		setLoadingImport(true);
		try {
			const result = await extractOrderItems(file);
			if (result.items.length === 0) {
				toast.error("No items detected in the receipt.");
			} else {
				props.onImportExtractedItems(result.items);
				toast.success(`✅ Imported ${ result.items.length } items from ${ result.platform.toUpperCase() } receipt`);
			}
		} catch (err) {
			console.error(err);
			toast.error("Failed to import receipt. Please try again.");
		}
		setLoadingImport(false);
		e.target.value = "";
	}

	return (
		<>
			{/* Step 1: Add Items */ }
			<div className="mb-6">
				<div className="flex justify-between items-center mb-2">
					<h3 className="text-lg font-semibold">Step 1: Add All Items</h3>
					<div className="flex gap-2">
						<Button onClick={ onAddItem } className="bg-green-500 hover:bg-green-600">
							<Plus className="h-4 w-4 mr-2"/> Add Item
						</Button>
						<label
							className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1">
							<Upload className="h-4 w-4"/>
							{ loadingImport ? "Reading..." : "Import from Receipt" }
							<input
								type="file"
								accept="image/*,application/pdf"
								onChange={ handleImportReceipt }
								className="hidden"
							/>
						</label>
					</div>
				</div>
				<div className="bg-yellow-50 border border-yellow-300 text-yellow-800 px-4 py-3 rounded-xl text-sm space-y-2">
					<button
						type="button"
						onClick={() => setShowTips(!showTips)}
						className="flex items-center justify-between w-full font-medium text-yellow-800 focus:outline-none"
					>
						<span>
							⚠️ OCR accuracy notice
						</span>
						{showTips ? (
							<ChevronUp size={18} className="text-yellow-700" />
						) : (
							<ChevronDown size={18} className="text-yellow-700" />
						)}
					</button>

					{ showTips && (
						<div className="space-y-2">
							<p>
								⚠️ <strong>Important:</strong> The import currently supports <strong>image files
								only</strong> (JPG, PNG, etc.).
							</p>
							<p>
								⚠️ Text recognition uses OCR and results <strong>may vary</strong> depending on image quality.
							</p>
							<ul className="list-disc list-inside text-xs text-yellow-900">
								<li>Use bright lighting and clear focus.</li>
								<li>Avoid cropping too close to the text or having glare.</li>
								<li>Ensure all items, prices, and totals are visible.</li>
								<li>Prefer screenshots instead of scanned or blurred photos.</li>
								<li>Keep text horizontal (not rotated or slanted).</li>
							</ul>
							<p className="text-xs text-gray-600 italic">
								🙏 If the system finds it hard to scan your image, we’re really sorry —
								you might need to edit your items manually. Thank you for understanding ❤️
							</p>
							{/*<p className="pt-1 text-xs">*/ }
							{/*	📹 Need help? Watch our{" "}*/ }
							{/*	<a*/ }
							{/*		href="/tutorials/receipt-import.mp4"*/ }
							{/*		target="_blank"*/ }
							{/*		rel="noopener noreferrer"*/ }
							{/*		className="text-blue-700 underline hover:text-blue-900 font-medium"*/ }
							{/*	>*/ }
							{/*		quick tutorial*/ }
							{/*	</a>{" "}*/ }
							{/*	on how to capture clear and readable receipts.*/ }
							{/*</p>*/ }
						</div>
					)}
				</div>

				<div className="space-y-3">
					{ itemsByItem.map((item) => (
						<div key={ item.id } className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
							<Input
								value={ item.name }
								onChange={ (e) => onUpdateItem(item.id, 'name', e.target.value) }
								placeholder="Item name"
								className="flex-1"
							/>
							<div className="relative w-32">
								<span className="absolute left-3 top-1/2 transform -translate-y-1/2">
									{ getCurrencyPrefix(currency) }
								</span>
								<Input
									type="number"
									step="1000"
									value={ item.price === 0 ? '' : item.price }
									onChange={ (e) => onUpdateItem(item.id, 'price', parseFloat(e.target.value) || 0) }
									placeholder="Price"
									className="pl-9"
								/>
							</div>
							<Input
								type="number"
								value={ item.quantity }
								onChange={ (e) => onUpdateItem(item.id, 'quantity', parseInt(e.target.value) || 1) }
								placeholder="Qty"
								min="1"
								className="w-20"
							/>
							<Button variant="ghost" size="icon" onClick={ () => onRemoveItem(item.id) }>
								<Trash2 className="h-4 w-4 text-red-500"/>
							</Button>
						</div>
					)) }
				</div>
			</div>

			{/* Unassigned Items Pool */ }
			{ itemsByItem.length > 0 && (
				<div className={ `mb-6 p-4 border-2 border-dashed rounded-lg ${
					getTotalUnassigned() === 0
						? 'border-green-300 bg-green-50'
						: 'border-orange-300 bg-orange-50'
				}` }>
					<h3 className={ `font-semibold mb-3 ${
						getTotalUnassigned() === 0 ? 'text-green-800' : 'text-orange-800'
					}` }>
						{ getTotalUnassigned() === 0 ? '✅ All Items Assigned!' : '📦 Unassigned Items' }
					</h3>
					{ getTotalUnassigned() > 0 && (
						<>
							<div className="flex flex-wrap gap-2">
								{ itemsByItem.map(item => {
									const remaining = getRemainingQuantity(item.id)
									if (remaining > 0) {
										return (
											<span key={ item.id }
												  className="px-3 py-1 bg-white border border-orange-300 rounded-full text-sm">
												{ item.name } × { remaining }
											</span>
										)
									}
									return null
								}) }
							</div>
							<p className="text-sm text-orange-600 mt-2">
								⚠️ { getTotalUnassigned() } items remaining
							</p>
						</>
					) }
					{ getTotalUnassigned() === 0 && (
						<p className="text-sm text-green-600">0 items remaining</p>
					) }
				</div>
			) }

			{/* Step 2: Add Members & Assign */ }
			<div className="mb-6">
				<div className="flex justify-between items-center mb-4">
					<h3 className="text-lg font-semibold">Step 2: Add Members & Assign Items</h3>
					<Button onClick={ onAddMember }>
						<Plus className="h-4 w-4 mr-2"/> Add Member
					</Button>
				</div>

				{ membersByItem.map((member) => {
					const availableItems = getAvailableItems(member.id)
					const hasAvailableItems = availableItems.length > 0

					return (
						<div key={ member.id } className="mb-4 p-4 border rounded-lg">
							<div className="flex items-center justify-between mb-3">
								<Input
									value={ member.name }
									onChange={ (e) => onUpdateMemberName(member.id, e.target.value) }
									placeholder="Member name"
									className="font-semibold flex-1 mr-3"
								/>
								<Button
									onClick={ () => onOpenAssignModal(member.id) }
									disabled={ !hasAvailableItems }
									className={ hasAvailableItems ? 'bg-green-500 hover:bg-green-600' : '' }
									size="sm"
								>
									<Plus className="h-4 w-4 mr-1"/> Assign Item
								</Button>
								<Button variant="ghost" size="icon" onClick={ () => onRemoveMember(member.id) }
										className="ml-2">
									<Trash2 className="h-4 w-4 text-red-500"/>
								</Button>
							</div>

							<div className="bg-gray-50 p-3 rounded">
								<p className="text-xs text-gray-500 mb-2">
									{ member.assignedItems.length === 0 ? 'No items assigned yet' : 'Assigned items:' }
								</p>
								{ member.assignedItems.length > 0 && (
									<div className="space-y-2">
										{ member.assignedItems.map((item) => (
											<div key={ item.itemId }
												 className="flex items-center justify-between bg-white p-2 rounded border">
												<span className="text-sm">{ item.itemName } × { item.quantity }</span>
												<div className="flex items-center gap-2">
													<span className="text-sm text-gray-600">
														{ formatCurrency(item.quantity * item.pricePerUnit) }
													</span>
													<Button
														variant="ghost"
														size="sm"
														onClick={ () => onRemoveAssignedItem(member.id, item.itemId) }
														className="h-6 w-6 p-0"
													>
														<X className="h-4 w-4 text-red-500"/>
													</Button>
												</div>
											</div>
										)) }
									</div>
								) }
								{ member.assignedItems.length > 0 && (
									<div className="mt-3 pt-2 border-t text-right">
										<span className="text-sm font-semibold">
											Subtotal: { formatCurrency(getMemberSubtotal(member)) }
										</span>
									</div>
								) }
							</div>
						</div>
					)
				}) }
			</div>

			{/* Assignment Modal */ }
			{ showAssignModal && currentMemberId && (
				<AssignItemModal
					memberName={ membersByItem.find(m => m.id === currentMemberId)?.name || 'Member' }
					availableItems={ getAvailableItems(currentMemberId) }
					selectedItemId={ selectedItemId }
					assignQuantity={ assignQuantity }
					onClose={ onCloseAssignModal }
					onAssign={ onAssignItem }
					onSelectItem={ onSetSelectedItemId }
					onSetQuantity={ onSetAssignQuantity }
					getRemainingQuantity={ getRemainingQuantity }
					formatCurrency={ formatCurrency }
				/>
			) }
		</>
	)
}