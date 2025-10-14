'use client'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Moon, Sun, Download, Camera } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast, Toaster } from "react-hot-toast"
import { ByUserMode } from './ByUserMode'
import { ByItemMode } from './ByItemMode'
import { formatCurrency } from "@/utils/utils"
import { Discount, Item, User, Result, ItemByItemMode, MemberByItem } from "@/types/types"
import ReactDOMServer from "react-dom/server";
import { Receipt } from "@/components/receipt";
import html2canvas from "html2canvas";

export function GroupMealCalculatorComponent() {
	const [ darkMode, setDarkMode ] = useState<boolean>(false)
	const [ inputMode, setInputMode ] = useState<'by-user' | 'by-item'>('by-user')

	const [ users, setUsers ] = useState<User[]>([ {
		name: '',
		items: [ { name: '', price: 0, quantity: 1, total: 0 } ]
	} ])

	const [ itemsByItem, setItemsByItem ] = useState<ItemByItemMode[]>([])
	const [ membersByItem, setMembersByItem ] = useState<MemberByItem[]>([])
	const [ showAssignModal, setShowAssignModal ] = useState(false)
	const [ currentMemberId, setCurrentMemberId ] = useState<string | null>(null)
	const [ selectedItemId, setSelectedItemId ] = useState<string>('')
	const [ assignQuantity, setAssignQuantity ] = useState<number>(1)

	const [ discount, setDiscount ] = useState<Discount>({ type: 'percentage', value: 0 })
	const [ shipping, setShipping ] = useState<number>(0)
	const [ results, setResults ] = useState<Result[]>([])
	const [ currency, setCurrency ] = useState<string>('IDR')
	const [ billPayer, setBillPayer ] = useState<string>('')
	const [ date, setDate ] = useState<string>('')
	const [ restaurantName, setRestaurantName ] = useState<string>('')
	const [ isCalculating, setIsCalculating ] = useState<boolean>(false)
	const [ grandTotal, setGrandTotal ] = useState<number>(0)

	useEffect(() => {
		if (darkMode) {
			document.documentElement.classList.add('dark')
		} else {
			document.documentElement.classList.remove('dark')
		}
	}, [ darkMode ])

	const handleModeSwitch = (mode: 'by-user' | 'by-item') => {
		if (mode !== inputMode) {
			setUsers([ { name: '', items: [ { name: '', price: 0, quantity: 1, total: 0 } ] } ])
			setItemsByItem([])
			setMembersByItem([])
			setResults([])
			setInputMode(mode)
			toast.success(`Switched to ${ mode === 'by-user' ? 'Input by User' : 'Input by Item' } mode`)
		}
	}

	const getCurrencyPrefix = (curr: string) => {
		return curr === 'IDR' ? 'Rp' : '$'
	}

	const formatCurr = (amount: number): string => {
		return formatCurrency(amount, currency)
	}

	const addItemByItem = () => {
		setItemsByItem([ ...itemsByItem, { id: Date.now().toString(), name: '', price: 0, quantity: 1 } ])
	}

	const importExtractedItems = (parsedItems: { name: string; qty: number; price: number }[]) => {
		console.log("📥 Importing extracted items:", parsedItems)
		const mapped = parsedItems.map(i => ({
			id: Date.now().toString() + Math.random(),
			name: i.name,
			price: i.price,
			quantity: i.qty,
		}))
		setItemsByItem(mapped)
		toast.success(`Imported ${ mapped.length } items from receipt`)
	}


	const removeItemByItem = (id: string) => {
		setItemsByItem(itemsByItem.filter(item => item.id !== id))
		setMembersByItem(membersByItem.map(member => ({
			...member,
			assignedItems: member.assignedItems.filter(item => item.itemId !== id)
		})))
	}

	const updateItemByItem = (id: string, field: keyof ItemByItemMode, value: string | number) => {
		setItemsByItem(itemsByItem.map(item =>
			item.id === id ? { ...item, [ field ]: value } : item
		))
	}

	const addMemberByItem = () => {
		setMembersByItem([ ...membersByItem, { id: Date.now().toString(), name: '', assignedItems: [] } ])
	}

	const removeMemberByItem = (id: string) => {
		setMembersByItem(membersByItem.filter(member => member.id !== id))
	}

	const updateMemberName = (id: string, name: string) => {
		setMembersByItem(membersByItem.map(member =>
			member.id === id ? { ...member, name } : member
		))
	}

	const openAssignModal = (memberId: string) => {
		setCurrentMemberId(memberId)
		setSelectedItemId('')
		setAssignQuantity(1)
		setShowAssignModal(true)
	}

	const getAvailableItemsForMember = () => {
		return itemsByItem.filter(item => {
			const totalAssigned = membersByItem.reduce((sum, member) => {
				const assigned = member.assignedItems.find(ai => ai.itemId === item.id)
				return sum + (assigned?.quantity || 0)
			}, 0)
			return totalAssigned < item.quantity
		})
	}

	const getRemainingQuantity = (itemId: string) => {
		const item = itemsByItem.find(i => i.id === itemId)
		if (!item) return 0

		const totalAssigned = membersByItem.reduce((sum, member) => {
			const assigned = member.assignedItems.find(ai => ai.itemId === itemId)
			return sum + (assigned?.quantity || 0)
		}, 0)

		return item.quantity - totalAssigned
	}

	const assignItemToMember = () => {
		if (!currentMemberId || !selectedItemId || assignQuantity <= 0) {
			toast.error('Please select an item and quantity')
			return
		}

		const item = itemsByItem.find(i => i.id === selectedItemId)
		if (!item) return

		const remainingQty = getRemainingQuantity(selectedItemId)
		if (assignQuantity > remainingQty) {
			toast.error(`Only ${ remainingQty } available`)
			return
		}

		setMembersByItem(membersByItem.map(member => {
			if (member.id === currentMemberId) {
				const existingItem = member.assignedItems.find(ai => ai.itemId === selectedItemId)
				if (existingItem) {
					return {
						...member,
						assignedItems: member.assignedItems.map(ai =>
							ai.itemId === selectedItemId
								? { ...ai, quantity: ai.quantity + assignQuantity }
								: ai
						)
					}
				} else {
					return {
						...member,
						assignedItems: [ ...member.assignedItems, {
							itemId: selectedItemId,
							itemName: item.name,
							quantity: assignQuantity,
							pricePerUnit: item.price
						} ]
					}
				}
			}
			return member
		}))

		setShowAssignModal(false)
		toast.success('Item assigned successfully')
	}

	const removeAssignedItem = (memberId: string, itemId: string) => {
		setMembersByItem(membersByItem.map(member => {
			if (member.id === memberId) {
				return {
					...member,
					assignedItems: member.assignedItems.filter(item => item.itemId !== itemId)
				}
			}
			return member
		}))
		toast.success('Item removed')
	}

	const getTotalUnassignedItems = () => {
		return itemsByItem.reduce((total, item) => {
			const remaining = getRemainingQuantity(item.id)
			return total + remaining
		}, 0)
	}

	const getMemberSubtotal = (member: MemberByItem) => {
		return member.assignedItems.reduce((sum, item) =>
			sum + (item.quantity * item.pricePerUnit), 0
		)
	}

	const addUser = () => {
		setUsers([ { name: '', items: [ { name: '', price: 0, quantity: 1, total: 0 } ] }, ...users ])
	}

	const addItem = (userIndex: number) => {
		const newUsers = [ ...users ]
		newUsers[ userIndex ].items.push({ name: '', price: 0, quantity: 1, total: 0 })
		setUsers(newUsers)
	}

	const removeItem = (userIndex: number, itemIndex: number) => {
		const newUsers = [ ...users ]
		newUsers[ userIndex ].items.splice(itemIndex, 1)
		setUsers(newUsers)
	}

	const handleInputChange = (userIndex: number, itemIndex: number, field: keyof Item, value: string | number) => {
		const newUsers = [ ...users ]
		if (field === 'name' && itemIndex === -1) {
			newUsers[ userIndex ].name = value as string
		} else {
			const item = newUsers[ userIndex ].items[ itemIndex ]
			if (field === 'price' || field === 'quantity') {
				item[ field ] = typeof value === 'number' ? value : parseFloat(value as string) || 0
			} else {
				item[ field as 'name' ] = value as string
			}
			if (field === 'quantity' && item.quantity < 1) {
				item.quantity = 1
			}
		}
		setUsers(newUsers)
	}

	const validateData = (users: User[]) => {
		let isValid = true
		users.forEach(user => {
			if (!user.name.trim()) {
				toast.error('User name cannot be empty')
				isValid = false
			}
			user.items = user.items.filter(item => {
				if (!item.name.trim()) {
					toast.error("You can't have empty item")
					isValid = false
					return true
				}
				if (item.price == 0) {
					toast.error(`Price for item "${ item.name }" cannot be 0`)
					isValid = false
					return true
				}
				return item.quantity > 0
			})
		})
		return isValid
	}

	const convertByItemToUsers = (): User[] => {
		return membersByItem.map(member => ({
			name: member.name,
			items: member.assignedItems.map(item => ({
				name: item.itemName,
				price: item.pricePerUnit,
				quantity: item.quantity,
				total: item.pricePerUnit * item.quantity
			}))
		}))
	}

	const calculateShares = () => {
		let usersToCalculate: User[] = []

		if (inputMode === 'by-item') {
			if (itemsByItem.length === 0) {
				toast.error('Please add at least one item')
				return
			}
			if (membersByItem.length === 0) {
				toast.error('Please add at least one member')
				return
			}

			const unassignedCount = getTotalUnassignedItems()
			if (unassignedCount > 0) {
				toast.error(`${ unassignedCount } items still unassigned`)
				return
			}

			usersToCalculate = convertByItemToUsers()
		} else {
			usersToCalculate = users
		}

		const isValid = validateData(usersToCalculate)
		if (!isValid) return

		setIsCalculating(true)

		const totalBeforeDiscount = usersToCalculate.reduce((total, user) =>
			total + user.items.reduce((userTotal, item) => userTotal + (item.price * item.quantity), 0), 0)

		if (totalBeforeDiscount <= 0) {
			toast.error("Add at least one item with price more than 0 before calculating")
			setIsCalculating(false)
			return
		}

		const discountAmount = discount.type === 'percentage'
			? totalBeforeDiscount * (discount.value / 100)
			: Math.min(discount.value, totalBeforeDiscount)

		const totalAfterDiscount = totalBeforeDiscount - discountAmount
		const shippingPerPerson = shipping / usersToCalculate.length

		const shares: Result[] = usersToCalculate.map(user => {
			const userItems = user.items.map(item => ({
				name: item.name,
				price: item.price,
				quantity: item.quantity,
				total: item.price * item.quantity
			}))
			const userTotal = userItems.reduce((total, item) => total + item.total, 0)
			const userDiscount = (userTotal / totalBeforeDiscount) * discountAmount
			const userShare = (userTotal / totalBeforeDiscount) * totalAfterDiscount + shippingPerPerson
			return {
				name: user.name,
				items: userItems,
				subtotal: userTotal,
				discount: userDiscount,
				shipping: shippingPerPerson,
				share: Math.ceil(userShare)
			}
		})

		const result = shares.reduce((sum, s) => sum + s.share, 0)
		setResults(shares)
		setGrandTotal(result)
		setIsCalculating(false)
	}

	const exportCSV = () => {
		const csvContent = "data:text/csv;charset=utf-8,"
			+ `Bill Payer: ${ billPayer }\n`
			+ `Date: ${ date }\n`
			+ `Restaurant: ${ restaurantName }\n\n`
			+ "Name,Item,Price,Quantity,Total,Subtotal,Discount,Shipping,Share\n"
			+ results.flatMap(r =>
				r.items.map((item, index) =>
					`${ index === 0 ? r.name : '' },${ item.name },${ Math.ceil(item.price) },${ item.quantity },${ Math.ceil(item.total) }` +
					`${ index === 0 ? `,${ Math.ceil(r.subtotal) },${ Math.ceil(r.discount) },${ Math.ceil(r.shipping) },${ Math.ceil(r.share) }` : ',,,' }`
				).join("\n")
			).join("\n")

		const encodedUri = encodeURI(csvContent)
		const link = document.createElement("a")
		link.setAttribute("href", encodedUri)
		link.setAttribute("download", "meal_shares.csv")
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
	}

	const saveAsImage = async () => {
		const receiptHtml = ReactDOMServer.renderToString(
			<Receipt
				billPayer={ billPayer }
				date={ date }
				restaurantName={ restaurantName }
				results={ results }
				currency={ currency }
			/>
		);

		const container = document.createElement('div');
		container.innerHTML = receiptHtml;
		container.style.position = "absolute";
		container.style.top = '-9999px';
		document.body.appendChild(container);

		const canvas = await html2canvas(container, { scale: 2 });
		document.body.removeChild(container);

		const link = document.createElement('a')
		link.href = canvas.toDataURL('image/png')
		link.download = `${ restaurantName }_${ date }.png`;
		link.click()
	}

	return (
		<div className={ `min-h-screen p-4 flex flex-col ${ darkMode ? 'dark' : '' }` }>
			<Toaster position="bottom-right" toastOptions={ { duration: 3000 } }/>
			<div className="max-w-4xl mx-auto space-y-6 flex-grow">
				<Card>
					<CardHeader>
						<CardTitle
							className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
							<span>Group Meal Calculator</span>
							<div className="flex items-center space-x-4">
								<Select value={ currency } onValueChange={ setCurrency }>
									<SelectTrigger className="w-[120px]">
										<SelectValue placeholder="Currency"/>
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="IDR">Rupiah (IDR)</SelectItem>
										<SelectItem value="USD">Dollar (USD)</SelectItem>
									</SelectContent>
								</Select>
								<Switch checked={ darkMode } onCheckedChange={ setDarkMode }>
									{ darkMode ? <Moon className="h-4 w-4"/> : <Sun className="h-4 w-4"/> }
								</Switch>
							</div>
						</CardTitle>
					</CardHeader>

					<CardContent>
						{/* Common Fields */ }
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
							<div>
								<Label htmlFor="billPayer">Bill Payer</Label>
								<Input id="billPayer" value={ billPayer }
									   onChange={ (e) => setBillPayer(e.target.value) }
									   placeholder="Who paid the bill?"/>
							</div>
							<div>
								<Label htmlFor="date">Date</Label>
								<Input id="date" type="date" value={ date }
									   onChange={ (e) => setDate(e.target.value) }/>
							</div>
							<div>
								<Label htmlFor="restaurantName">Restaurant Name</Label>
								<Input id="restaurantName" value={ restaurantName }
									   onChange={ (e) => setRestaurantName(e.target.value) }
									   placeholder="Enter restaurant name"/>
							</div>
						</div>

						{/* Mode Tabs */ }
						<div className="flex border-b mb-6">
							<button
								onClick={ () => handleModeSwitch('by-user') }
								className={ `px-6 py-2 font-medium transition-colors ${
									inputMode === 'by-user'
										? 'border-b-2 border-blue-500 text-blue-500'
										: 'text-gray-500 hover:text-gray-700'
								}` }
							>
								Input by User
							</button>
							<button
								onClick={ () => handleModeSwitch('by-item') }
								className={ `px-6 py-2 font-medium transition-colors ${
									inputMode === 'by-item'
										? 'border-b-2 border-blue-500 text-blue-500'
										: 'text-gray-500 hover:text-gray-700'
								}` }
							>
								Input by Item
							</button>
						</div>

						{/* Mode-specific content */ }
						{ inputMode === 'by-user' && (
							<ByUserMode
								users={ users }
								currency={ currency }
								onAddUser={ addUser }
								onAddItem={ addItem }
								onRemoveItem={ removeItem }
								onInputChange={ handleInputChange }
								getCurrencyPrefix={ getCurrencyPrefix }
							/>
						) }

						{ inputMode === 'by-item' && (
							<ByItemMode
								itemsByItem={ itemsByItem }
								membersByItem={ membersByItem }
								currency={ currency }
								showAssignModal={ showAssignModal }
								currentMemberId={ currentMemberId }
								selectedItemId={ selectedItemId }
								assignQuantity={ assignQuantity }
								onAddItem={ addItemByItem }
								onRemoveItem={ removeItemByItem }
								onUpdateItem={ updateItemByItem }
								onAddMember={ addMemberByItem }
								onRemoveMember={ removeMemberByItem }
								onUpdateMemberName={ updateMemberName }
								onOpenAssignModal={ openAssignModal }
								onCloseAssignModal={ () => setShowAssignModal(false) }
								onRemoveAssignedItem={ removeAssignedItem }
								onAssignItem={ assignItemToMember }
								onSetSelectedItemId={ setSelectedItemId }
								onSetAssignQuantity={ setAssignQuantity }
								getAvailableItems={ getAvailableItemsForMember }
								getRemainingQuantity={ getRemainingQuantity }
								getTotalUnassigned={ getTotalUnassignedItems }
								getMemberSubtotal={ getMemberSubtotal }
								formatCurrency={ formatCurr }
								getCurrencyPrefix={ getCurrencyPrefix }
								onImportExtractedItems={ importExtractedItems }
							/>
						) }

						{/* Discount & Shipping */ }
						<div className="mt-6 space-y-4">
							<div
								className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
								<Label htmlFor="discount-type" className="min-w-[100px]">Discount Type</Label>
								<Select
									value={ discount.type }
									onValueChange={ (value) => setDiscount({
										...discount,
										type: value as 'percentage' | 'amount'
									}) }
								>
									<SelectTrigger className="w-full sm:w-[120px]">
										<SelectValue placeholder="Select type"/>
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="percentage">Percentage</SelectItem>
										<SelectItem value="amount">Amount</SelectItem>
									</SelectContent>
								</Select>
								<div className="relative w-full sm:w-auto">
									<Input
										className={ `pl-9 ${ discount.type === 'amount' ? 'pr-9' : '' }` }
										type="number"
										step={ discount.type === 'percentage' ? '0.01' : '1000' }
										value={ discount.value === 0 ? '' : discount.value }
										onChange={ (e) => setDiscount({
											...discount,
											value: parseFloat(e.target.value) || 0
										}) }
										placeholder={ discount.type === 'percentage' ? 'Discount %' : '0' }
									/>
									{ discount.type === 'amount' && (
										<span
											className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      						{ getCurrencyPrefix(currency) }
                    					</span>
									) }
									{ discount.type === 'percentage' && (
										<span
											className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
									) }
								</div>
							</div>
							<div
								className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
								<Label htmlFor="shipping" className="min-w-[100px]">Shipping Cost</Label>
								<div className="relative w-full sm:w-auto">
									<span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
										{ getCurrencyPrefix(currency) }
									</span>
									<Input
										className="pl-9"
										type="number"
										step="1000"
										value={ shipping === 0 ? '' : shipping }
										onChange={ (e) => setShipping(parseFloat(e.target.value) || 0) }
										placeholder="0"
									/>
								</div>
							</div>
						</div>
					</CardContent>

					<CardFooter>
						<Button onClick={ calculateShares } className="w-full" disabled={ isCalculating }>
							{ isCalculating ? 'Calculating...' : 'Calculate Shares' }
						</Button>
					</CardFooter>
				</Card>

				{/* Results */ }
				{ results.length > 0 && (
					<Card>
						<CardHeader>
							<CardTitle>Results</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="mb-4">
								<p><strong>Bill Payer:</strong> { billPayer }</p>
								<p><strong>Date:</strong> { date }</p>
								<p><strong>Restaurant:</strong> { restaurantName }</p>
								<p><strong>Grand Total:</strong> { formatCurr(grandTotal) }</p>
							</div>
							{ results.map((result, index) => (
								<div key={ index } className="mb-6 p-4 border rounded-lg">
									<h3 className="text-lg font-semibold mb-2">{ result.name }</h3>
									<ul className="list-disc list-inside mb-2">
										{ result.items.map((item, itemIndex) => (
											<li key={ itemIndex }>
												{ item.name } - { formatCurr(item.price) } x { item.quantity } = { formatCurr(item.total) }
											</li>
										)) }
									</ul>
									<p><strong>Subtotal:</strong> { formatCurr(result.subtotal) }</p>
									<p><strong>Discount:</strong> { formatCurr(result.discount) }</p>
									<p><strong>Shipping:</strong> { formatCurr(result.shipping) }</p>
									<p className="text-lg font-semibold mt-2">
										<strong>Total Share:</strong> { formatCurr(result.share) }
									</p>
								</div>
							)) }
						</CardContent>
						<CardFooter className="flex flex-col sm:flex-row justify-between space-y-2 sm:space-y-0">
							<Button onClick={ exportCSV } className="w-full sm:w-auto">
								<Download className="h-4 w-4 mr-2"/> Export CSV
							</Button>
							<Button onClick={ saveAsImage } className="w-full sm:w-auto">
								<Camera className="h-4 w-4 mr-2"/> Save as Image
							</Button>
						</CardFooter>
					</Card>
				) }
			</div>
			<footer className="mt-8 py-4 text-center text-sm text-muted-foreground">
				Made with 🧠 by <a href="https://teqo.me/" target="_blank">Ahmad Taqiyudin</a> ®️
				2025
			</footer>
		</div>
	)
}