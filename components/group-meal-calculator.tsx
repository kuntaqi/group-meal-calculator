'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Moon, Sun, Plus, Trash2, Download, Camera } from 'lucide-react'

export function GroupMealCalculatorComponent() {
  const [darkMode, setDarkMode] = useState(false)
  const [users, setUsers] = useState([{ name: '', items: [{ name: '', price: 0, quantity: 1 }] }])
  const [discount, setDiscount] = useState({ type: 'percentage', value: 0 })
  const [shipping, setShipping] = useState(0)
  const [results, setResults] = useState([])
  const [currency, setCurrency] = useState('IDR')
  const [billPayer, setBillPayer] = useState('')
  const [date, setDate] = useState('')
  const [restaurantName, setRestaurantName] = useState('')
  const [isCalculating, setIsCalculating] = useState(false)

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const addUser = () => {
    setUsers([...users, { name: '', items: [{ name: '', price: 0, quantity: 1 }] }])
  }

  const addItem = ({userIndex}: { userIndex: number }) => {
    const newUsers = [...users]
    newUsers[userIndex].items.push({ name: '', price: 0, quantity: 1 })
    setUsers(newUsers)
  }

  const removeItem = ({userIndex, itemIndex}: { userIndex: number, itemIndex: number }) => {
    const newUsers = [...users]
    newUsers[userIndex].items.splice(itemIndex, 1)
    setUsers(newUsers)
  }

  const handleInputChange = ({userIndex, itemIndex, field, value}: {
    userIndex: number,
    itemIndex: number,
    field: string,
    value: string
  }) => {
    const newUsers = [...users]
    if (field === 'name' && itemIndex === -1) {
      newUsers[userIndex].name = value
    } else {
      newUsers[userIndex].items[itemIndex][field] = field === 'price' || field === 'quantity' ? parseFloat(value) || 0 : value
      if (field === 'quantity' && newUsers[userIndex].items[itemIndex][field] < 1) {
        newUsers[userIndex].items[itemIndex][field] = 1
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
      const totalWithShipping = totalAfterDiscount + shipping
      const shippingPerPerson = shipping / users.length

      const shares = users.map(user => {
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

      setResults(shares)
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

  const saveAsImage = () => {
    alert("This feature would capture a screenshot of the results and save it as an image.")
  }

  const formatCurrency = (amount) => {
    const roundedAmount = Math.ceil(amount)
    if (currency === 'IDR') {
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(roundedAmount)
    } else {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(roundedAmount)
    }
  }

  return (
    <div className={`min-h-screen p-4 flex flex-col ${darkMode ? 'dark' : ''}`}>
      <div className="max-w-4xl mx-auto space-y-6 flex-grow">
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <span>Group Meal Calculator</span>
              <div className="flex items-center space-x-4">
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IDR">Rupiah (IDR)</SelectItem>
                    <SelectItem value="USD">Dollar (USD)</SelectItem>
                  </SelectContent>
                </Select>
                <Switch
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                >
                  <span className="sr-only">Toggle dark mode</span>
                  {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
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
            {users.map((user, userIndex) => (
              <div key={userIndex} className="mb-6 p-4 border rounded-lg">
                <div className="mb-4">
                  <Label htmlFor={`user-${userIndex}`}>User Name</Label>
                  <Input
                    id={`user-${userIndex}`}
                    value={user.name}
                    onChange={(e) => handleInputChange({
                      userIndex: userIndex,
                      itemIndex: -1,
                      field: 'name',
                      value: e.target.value
                    })}
                    placeholder="Enter user name"
                  />
                </div>
                {user.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-2">
                    <Input
                      className="w-full sm:w-1/3"
                      value={item.name}
                      onChange={(e) => handleInputChange({
                        userIndex: userIndex,
                        itemIndex: itemIndex,
                        field: 'name',
                        value: e.target.value
                      })}
                      placeholder="Item name"
                    />
                    <Input
                      className="w-full sm:w-1/4"
                      type="number"
                      value={item.price}
                      onChange={(e) => handleInputChange({
                        userIndex: userIndex,
                        itemIndex: itemIndex,
                        field: 'price',
                        value: e.target.value
                      })}
                      placeholder={`Price (${currency})`}
                    />
                    <Input
                      className="w-full sm:w-1/6"
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleInputChange({
                        userIndex: userIndex,
                        itemIndex: itemIndex,
                        field: 'quantity',
                        value: e.target.value
                      })}
                      placeholder="Qty"
                      min="1"
                    />
                    <Button variant="outline" size="icon" onClick={() => removeItem({
                      userIndex: userIndex,
                      itemIndex: itemIndex
                    })}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remove item</span>
                    </Button>
                  </div>
                ))}
                <Button onClick={() => addItem({userIndex: userIndex})} className="mt-2">
                  <Plus className="h-4 w-4 mr-2" /> Add Item
                </Button>
              </div>
            ))}
            <Button onClick={addUser} className="mt-4">
              <Plus className="h-4 w-4 mr-2" /> Add User
            </Button>
            <div className="mt-6 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                <Label htmlFor="discount-type" className="min-w-[100px]">Discount Type</Label>
                <Select
                  value={discount.type}
                  onValueChange={(value) => setDiscount({ ...discount, type: value })}
                >
                  <SelectTrigger id="discount-type" className="w-full sm:w-[120px]">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="amount">Amount</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  className="w-full sm:w-auto"
                  type="number"
                  step={discount.type === 'percentage' ? '0.01' : '1'}
                  value={discount.value}
                  onChange={(e) => setDiscount({ ...discount, value: parseFloat(e.target.value) || 0 })}
                  placeholder={discount.type === 'percentage' ? 'Discount %' : `Discount (${currency})`}
                />
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                <Label htmlFor="shipping" className="min-w-[100px]">Shipping Cost</Label>
                <Input
                  id="shipping"
                  className="w-full sm:w-auto"
                  type="number"
                  value={shipping}
                  onChange={(e) => setShipping(parseFloat(e.target.value) || 0)}
                  placeholder={`Enter shipping cost (${currency})`}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={calculateShares} className="w-full" disabled={isCalculating}>
              {isCalculating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p><strong>Bill Payer:</strong> {billPayer}</p>
                <p><strong>Date:</strong> {date}</p>
                <p><strong>Restaurant:</strong> {restaurantName}</p>
              </div>
              {results.map((result, index) => (
                <div key={index} className="mb-6 p-4 border rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">{result.name}</h3>
                  <ul className="list-disc list-inside mb-2">
                    {result.items.map((item, itemIndex) => (
                      <li key={itemIndex}>
                        {item.name} - {formatCurrency(item.price)} x {item.quantity} = {formatCurrency(item.total)}
                      </li>
                    ))}
                  </ul>
                  <p><strong>Subtotal:</strong> {formatCurrency(result.subtotal)}</p>
                  <p><strong>Discount:</strong> {formatCurrency(result.discount)}</p>
                  <p><strong>Shipping:</strong> {formatCurrency(result.shipping)}</p>
                  <p className="text-lg font-semibold mt-2">
                    <strong>Total Share:</strong> {formatCurrency(result.share)}
                  </p>
                </div>
              ))}
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-between space-y-2 sm:space-y-0">
              <Button onClick={exportCSV} className="w-full sm:w-auto">
                <Download className="h-4 w-4 mr-2" /> Export CSV
              </Button>
              <Button onClick={saveAsImage} className="w-full sm:w-auto">
                <Camera className="h-4 w-4 mr-2" /> Save as Image
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
      <footer className="mt-8 py-4 text-center text-sm text-muted-foreground">
        Created by Ahmad Taqiyudin
      </footer>
    </div>
  )
}