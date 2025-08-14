export function formatCurrency(amount: number, currency: string): string {
	const roundedAmount = Math.ceil(amount)
	if (currency === 'IDR') {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			maximumFractionDigits: 0
		}).format(roundedAmount)
	} else {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			maximumFractionDigits: 0
		}).format(roundedAmount)
	}
}