import {formatCurrency} from "@/utils/utils";

interface Item {
    name: string,
    price: number,
    quantity: number,
    total: number
}

interface Result {
    name: string,
    items: Item[],
    subtotal: number,
    discount: number,
    shipping: number,
    share: number
}

interface ReceiptProps {
    billPayer: string
    date: string
    restaurantName: string
    results: Result[]
    currency: string
}

export function Receipt({ billPayer, date, restaurantName, results, currency }: ReceiptProps) {
    const total = results.reduce((sum, result) => sum + result.share, 0)

    return (
        <div className="bg-white text-black p-4 max-w-md mx-auto font-mono text-sm">
            <div className="text-center mb-4">
                <h2 className="text-xl font-bold">{restaurantName}</h2>
                <p>Date: {date}</p>
                <p>Bill Payer: {billPayer}</p>
            </div>
            <div className="border-t border-b border-dashed border-gray-300 py-2 mb-4">
                {results.map((result, index) => (
                    <div key={index} className="mb-4">
                        <p className="font-bold justify-center">{result.name}</p>
                        {result.items.map((item, itemIndex) => (
                            <p key={itemIndex} className="flex justify-between">
                                <span>{item.name} x{item.quantity}</span>
                                <span>{formatCurrency(item.total, currency)}</span>
                            </p>
                        ))}
                        <p className="flex justify-between mt-1">
                            <span>Subtotal</span>
                            <span>{formatCurrency(result.subtotal, currency)}</span>
                        </p>
                        <p className="flex justify-between">
                            <span>Discount</span>
                            <span>-{formatCurrency(result.discount, currency)}</span>
                        </p>
                        <p className="flex justify-between">
                            <span>Shipping</span>
                            <span>{formatCurrency(result.shipping, currency)}</span>
                        </p>
                        <p className="flex justify-between font-bold">
                            <span>Share</span>
                            <span>{formatCurrency(result.share, currency)}</span>
                        </p>
                    </div>
                ))}
            </div>
            <div className="text-right">
                <p className="font-bold text-lg">Total: {formatCurrency(total, currency)}</p>
            </div>
            <div className="mt-4 text-center text-xs">
                <p>Thank you for using <strong className="font-bold">Group Meal Calculator!</strong></p>
                <p>https://group-meal-calculators.vercel.app</p>
            </div>
        </div>
    )
}