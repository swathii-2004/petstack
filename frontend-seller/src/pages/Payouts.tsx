import React, { useEffect, useState } from "react";
import { getSellerPayouts } from "../api/orders";

export default function PayoutsPage() {
    const [payouts, setPayouts] = useState({ available: 0, pending: 0, lifetime: 0 });
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
                    <p className="text-3xl font-bold mt-2">${payouts.available.toFixed(2)}</p>
                </div>
                <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <h3 className="text-gray-500 text-sm font-medium">Pending Processing</h3>
                    <p className="text-3xl font-bold mt-2">${payouts.pending.toFixed(2)}</p>
                </div>
                <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <h3 className="text-gray-500 text-sm font-medium">Total Lifetime Earnings</h3>
                    <p className="text-3xl font-bold mt-2">${payouts.lifetime.toFixed(2)}</p>
                </div>
            </div>
            
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden p-10 text-center text-gray-500">
                <p>No recent payouts. Once your orders are delivered, funds will appear here.</p>
            </div>
        </div>
    );
}
