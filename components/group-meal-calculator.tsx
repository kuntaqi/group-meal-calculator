'use client'

import {useState, useEffect, useRef} from 'react'
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Switch} from "@/components/ui/switch"
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from "@/components/ui/card"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Moon, Sun, Plus, Trash2, Download, Camera} from 'lucide-react'
import html2canvas from "html2canvas";
import {formatCurrency} from "@/utils/utils";
import ReactDOMServer from "react-dom/server";
import {Receipt} from "@/components/receipt";

interface Item {
    name: string,
    price: number,
    quantity: number,
    total: number
}

interface User {
    name: string,
    items: Item[]
}

interface Discount {
    type: "percentage" | "amount",
    value: number
}

interface Result {
    name: string,
    items: Item[],
    subtotal: number,
    discount: number,
    shipping: number,
    share: number
}

export function GroupMealCalculatorComponent() {
    const [darkMode, setDarkMode] = useState<boolean>(false)
    const [users, setUsers] = useState<User[]>([{name: '', items: [{name: '', price: 0, quantity: 1, total: 0}]}])
    const [discount, setDiscount] = useState<Discount>({type: 'percentage', value: 0})
    const [shipping, setShipping] = useState<number>(0)
    const [results, setResults] = useState<Result[]>([])
    const [currency, setCurrency] = useState<string>('IDR')
    const [billPayer, setBillPayer] = useState<string>('')
    const [date, setDate] = useState<string>('')
    const [restaurantName, setRestaurantName] = useState<string>('')
    const [isCalculating, setIsCalculating] = useState<boolean>(false)
    const resultCardRef = useRef<HTMLDivElement>(null)
    const [grandTotal, setGrandTotal] = useState<number>(0)

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }, [darkMode])

    const addUser = () => {
        setUsers([{name: '', items: [{name: '', price: 0, quantity: 1, total: 0}]}, ...users])
    }

    const addItem = (userIndex: number) => {
        const newUsers = [...users]
        newUsers[userIndex].items.push({name: '', price: 0, quantity: 1, total: 0})
        setUsers(newUsers)
    }

    const removeItem = (userIndex: number, itemIndex: number) => {
        const newUsers = [...users]
        newUsers[userIndex].items.splice(itemIndex, 1)
        setUsers(newUsers)
    }

    const handleInputChange = (userIndex: number, itemIndex: number, field: keyof Item, value: string | number) => {
        const newUsers = [...users]

        if (field === 'name' && itemIndex === -1) {
            newUsers[userIndex].name = value as string
        } else {
            const item = newUsers[userIndex].items[itemIndex]

            if (field === 'price' || field === 'quantity') {
                item[field] = typeof value === 'number' ? value : parseFloat(value as string) || 0
            } else {
                item[field as 'name'] = value as string
            }

            if (field === 'quantity' && item.quantity < 1) {
                item.quantity = 1
            }
        }

        setUsers(newUsers)
    }

    const calculateShares = () => {
        setIsCalculating(true)
        // Simulate a delay to show the loading state (remove this in a real app)
        setTimeout(() => {
            const totalBeforeDiscount = users.reduce((total, user) =>
                total + user.items.reduce((userTotal, item) => userTotal + (item.price * item.quantity), 0), 0)

            const discountAmount = discount.type === 'percentage'
                ? totalBeforeDiscount * (discount.value / 100)
                : discount.value

            const totalAfterDiscount = totalBeforeDiscount - discountAmount
            const shippingPerPerson = shipping / users.length

            const shares: Result[] = users.map(user => {
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
                    share: Math.ceil(userShare) // Round up the final share
                }
            })

            let result = 0;
            shares.forEach(number => {
                result += number.share
            })

            setResults(shares)
            setGrandTotal(result)
            setIsCalculating(false)
        }, 500) // Simulated delay of 500ms
    }

    const formatNumberForCSV = (amount: number): string => {
        return Math.ceil(amount).toString()
    }

    const exportCSV = () => {
        const csvContent = "data:text/csv;charset=utf-8,"
            + `Bill Payer: ${billPayer}\n`
            + `Date: ${date}\n`
            + `Restaurant: ${restaurantName}\n\n`
            + "Name,Item,Price,Quantity,Total,Subtotal,Discount,Shipping,Share\n"
            + results.flatMap(r =>
                r.items.map((item, index) =>
                    `${index === 0 ? r.name : ''},${item.name},${formatNumberForCSV(item.price)},${item.quantity},${formatNumberForCSV(item.total)}` +
                    `${index === 0 ? `,${formatNumberForCSV(r.subtotal)},${formatNumberForCSV(r.discount)},${formatNumberForCSV(r.shipping)},${formatNumberForCSV(r.share)}` : ',,,'}`
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
                billPayer={billPayer}
                date={date}
                restaurantName={restaurantName}
                results={results}
                currency={currency}
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
        link.download = `${restaurantName}_${date}.png`;
        link.click()
    }

    const getCurrencyPrefix = (currency: string) => {
        switch (currency) {
            case 'IDR':
                return 'Rp'; // Indonesian Rupiah
            case 'USD':
                return '$'; // US Dollar
            default:
                return ''; // Default case
        }
    };

    return (
        <div className={`min-h-screen p-4 flex flex-col ${darkMode ? 'dark' : ''}`}>
            <div className="max-w-4xl mx-auto space-y-6 flex-grow">
                <Card>
                    <CardHeader>
                        <CardTitle
                            className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                            <span>Group Meal Calculator</span>
                            <div className="flex items-center space-x-4">
                                <Select value={currency} onValueChange={(value: string) => setCurrency(value)}>
                                    <SelectTrigger className="w-[120px]">
                                        <SelectValue placeholder="Currency"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="IDR">Rupiah (IDR)</SelectItem>
                                        <SelectItem value="USD">Dollar (USD)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Switch checked={darkMode} onCheckedChange={setDarkMode}>
                                    <span className="sr-only">Toggle dark mode</span>
                                    {darkMode ? <Moon className="h-4 w-4"/> : <Sun className="h-4 w-4"/>}
                                </Switch>
                            </div>
                        </CardTitle>
                    </CardHeader>

                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div>
                                <Label htmlFor="billPayer">Bill Payer</Label>
                                <Input
                                    id="billPayer"
                                    value={billPayer}
                                    onChange={(e) => setBillPayer(e.target.value)}
                                    placeholder="Who paid the bill?"
                                />
                            </div>
                            <div>
                                <Label htmlFor="date">Date</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="restaurantName">Restaurant Name</Label>
                                <Input
                                    id="restaurantName"
                                    value={restaurantName}
                                    onChange={(e) => setRestaurantName(e.target.value)}
                                    placeholder="Enter restaurant name"
                                />
                            </div>
                        </div>
                        <Button onClick={addUser} className="mt-4">
                            <Plus className="h-4 w-4 mr-2"/> Add User
                        </Button>
                        {users.map((user, userIndex) => (
                            <div key={userIndex} className="mt-4 mb-6 p-4 border rounded-lg">
                                <div className="mb-4">
                                    <Label htmlFor={`user-${userIndex}`}>User Name</Label>
                                    <Input
                                        id={`user-${userIndex}`}
                                        value={user.name}
                                        onChange={(e) => handleInputChange(userIndex, -1, 'name', e.target.value)}
                                        placeholder="Enter user name"
                                    />
                                </div>
                                {user.items.map((item, itemIndex) => (
                                    <div key={itemIndex}
                                         className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-2">
                                        <Input
                                            className="w-full sm:w-1/3"
                                            value={item.name}
                                            onChange={(e) => handleInputChange(userIndex, itemIndex, 'name', e.target.value)}
                                            placeholder="Item name"
                                        />
                                        <div className="relative w-full sm:w-1/4">
                                            <span
                                                className="absolute left-3 top-1/2 transform -translate-y-1/2">{getCurrencyPrefix(currency)}</span>
                                            <Input
                                                className="pl-9"
                                                type="number"
                                                step="1000"
                                                value={item.price === 0 ? '' : item.price}
                                                onChange={(e) => handleInputChange(userIndex, itemIndex, 'price', e.target.value)}
                                                placeholder="0"/>
                                        </div>
                                        <Input
                                            className="w-full sm:w-1/6"
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => handleInputChange(userIndex, itemIndex, 'quantity', e.target.value)}
                                            placeholder="Qty"
                                            min="1"
                                        />
                                        <Button variant="outline" size="icon"
                                                onClick={() => removeItem(userIndex, itemIndex)}>
                                            <Trash2 className="h-4 w-4"/>
                                            <span className="sr-only">Remove item</span>
                                        </Button>
                                    </div>
                                ))}
                                <Button onClick={() => addItem(userIndex)} className="mt-2">
                                    <Plus className="h-4 w-4 mr-2"/> Add Item
                                </Button>
                            </div>
                        ))}

                        {/* Discount Section */}
                        <div className="mt-6 space-y-4">
                            <div
                                className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                                <Label htmlFor="discount-type" className="min-w-[100px]">Discount Type</Label>
                                <Select
                                    value={discount.type}
                                    onValueChange={(value) => setDiscount({
                                        ...discount,
                                        type: value as Discount['type'],
                                        value: discount.value
                                    })}
                                >
                                    <SelectTrigger id="discount-type" className="w-full sm:w-[120px]">
                                        <SelectValue placeholder="Select type"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percentage">Percentage</SelectItem>
                                        <SelectItem value="amount">Amount</SelectItem>
                                    </SelectContent>
                                </Select>

                                {/* Updated Discount Input */}
                                <div className="relative w-full sm:w-auto">
                                    <Input
                                        id="discount-value"
                                        className={`pl-9 ${discount.type === 'amount' ? 'pr-9' : ''}`}
                                        type="number"
                                        step={discount.type === 'percentage' ? '0.01' : '1000'}
                                        value={discount.value === 0 ? '' : discount.value}
                                        onChange={(e) => setDiscount({
                                            ...discount,
                                            value: parseFloat(e.target.value) || 0
                                        })}
                                        placeholder={discount.type === 'percentage' ? 'Discount %' : `0`}
                                    />
                                    {discount.type === 'amount' && (
                                        <span
                                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          {getCurrencyPrefix(currency)}
                        </span>
                                    )}
                                    {discount.type === 'percentage' && (
                                        <span
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          %
                        </span>
                                    )}
                                </div>
                            </div>
                            <div
                                className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                                <Label htmlFor="shipping" className="min-w-[100px]">Shipping Cost</Label>
                                <div className="relative w-full sm:w-auto">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      {getCurrencyPrefix(currency)}
                    </span>
                                    <Input
                                        id="shipping"
                                        className="pl-9" // Padding for the prefix
                                        type="number"
                                        step="1000"
                                        value={shipping === 0 ? '' : shipping}
                                        onChange={(e) => setShipping(parseFloat(e.target.value) || 0)}
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        </div>

                    </CardContent>
                    <CardFooter>
                        <Button onClick={calculateShares} className="w-full" disabled={isCalculating}>
                            {isCalculating ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                         xmlns="http://www.w3.org/2000/svg"
                                         fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                                strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor"
                                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Calculating...
                                </>
                            ) : (
                                'Calculate Shares'
                            )}
                        </Button>
                    </CardFooter>
                </Card>

                {results.length > 0 && (
                    <Card ref={resultCardRef} className="result-card">
                        <CardHeader>
                            <CardTitle>Results</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4">
                                <p><strong>Bill Payer:</strong> {billPayer}</p>
                                <p><strong>Date:</strong> {date}</p>
                                <p><strong>Restaurant:</strong> {restaurantName}</p>
                                <p><strong>Grand Total:</strong> {formatCurrency(grandTotal, currency)}</p>
                            </div>
                            {results.map((result, index) => (
                                <div key={index} className="mb-6 p-4 border rounded-lg">
                                    <h3 className="text-lg font-semibold mb-2">{result.name}</h3>
                                    <ul className="list-disc list-inside mb-2">
                                        {result.items.map((item, itemIndex) => (
                                            <li key={itemIndex}>
                                                {item.name} - {formatCurrency(item.price, currency)} x {item.quantity} = {formatCurrency(item.total, currency)}
                                            </li>
                                        ))}
                                    </ul>
                                    <p><strong>Subtotal:</strong> {formatCurrency(result.subtotal, currency)}</p>
                                    <p><strong>Discount:</strong> {formatCurrency(result.discount, currency)}</p>
                                    <p><strong>Shipping:</strong> {formatCurrency(result.shipping, currency)}</p>
                                    <p className="text-lg font-semibold mt-2">
                                        <strong>Total Share:</strong> {formatCurrency(result.share, currency)}
                                    </p>
                                </div>
                            ))}
                        </CardContent>
                        <CardFooter className="flex flex-col sm:flex-row justify-between space-y-2 sm:space-y-0">
                            <Button onClick={exportCSV} className="w-full sm:w-auto">
                                <Download className="h-4 w-4 mr-2"/> Export CSV
                            </Button>
                            <Button onClick={saveAsImage} className="w-full sm:w-auto">
                                <Camera className="h-4 w-4 mr-2"/> Save as Image
                            </Button>
                        </CardFooter>
                    </Card>
                )}
            </div>
            <footer className="mt-8 py-4 text-center text-sm text-muted-foreground">
                Made with 🧠 by <a href="https://www.linkedin.com/in/taqiyudin/" target="_blank">Ahmad Taqiyudin</a> ®️
                2024
            </footer>
        </div>
    )
}