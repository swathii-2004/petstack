import React from "react";

export default function PayoutsPage() {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Payouts</h1>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <h3 className="text-gray-500 text-sm font-medium">Available to Withdraw</h3>
                    <p className="text-3xl font-bold mt-2">$0.00</p>
                </div>
                <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <h3 className="text-gray-500 text-sm font-medium">Pending Processing</h3>
                    <p className="text-3xl font-bold mt-2">$0.00</p>
                </div>
                <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <h3 className="text-gray-500 text-sm font-medium">Total Lifetime Earnings</h3>
                    <p className="text-3xl font-bold mt-2">$0.00</p>
                </div>
            </div>
            
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden p-10 text-center text-gray-500">
                <p>No recent payouts. Once your orders are delivered, funds will appear here.</p>
            </div>
        </div>
    );
}
