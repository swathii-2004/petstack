import React, { useEffect, useState } from "react";
import { getSellerPayouts } from "../api/orders";

export default function PayoutsPage() {
    const [payouts, setPayouts] = useState<any>({ available: 0, pending: 0, lifetime: 0, history: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getSellerPayouts().then(data => {
            setPayouts(data);
            setLoading(false);
        }).catch(err => {
            console.error("Failed to load payouts", err);
            setLoading(false);
        });
    }, []);

    if (loading) {
        return <div className="p-6">Loading payout data...</div>;
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Payouts</h1>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <h3 className="text-gray-500 text-sm font-medium">Available to Withdraw</h3>
                    <p className="text-3xl font-bold mt-2">₹{payouts.available.toFixed(2)}</p>
                </div>
                <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <h3 className="text-gray-500 text-sm font-medium">Pending Processing</h3>
                    <p className="text-3xl font-bold mt-2">₹{payouts.pending.toFixed(2)}</p>
                </div>
                <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <h3 className="text-gray-500 text-sm font-medium">Total Lifetime Earnings</h3>
                    <p className="text-3xl font-bold mt-2">₹{payouts.lifetime.toFixed(2)}</p>
                </div>
            </div>
            
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b bg-gray-50/50">
                    <h2 className="font-semibold text-gray-800 text-sm">Recent Transactions</h2>
                </div>
                {!payouts.history || payouts.history.length === 0 ? (
                    <div className="p-10 text-center text-gray-500">
                        <p>No recent payouts. Once your orders are delivered, funds will appear here.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="p-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Order ID</th>
                                    <th className="p-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Date</th>
                                    <th className="p-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Amount</th>
                                    <th className="p-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {payouts.history.map((payout: any) => (
                                    <tr key={payout.order_id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4 font-mono text-xs text-gray-500">{payout.order_id}</td>
                                        <td className="p-4 text-gray-600 font-medium">
                                            {new Date(payout.date).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 font-bold text-gray-900">
                                            ₹{payout.amount.toFixed(2)}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 border rounded-full text-2xs font-bold uppercase tracking-wider inline-block ${
                                                payout.status === 'available'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                : 'bg-amber-50 text-amber-700 border-amber-200'
                                            }`}>
                                                {payout.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
