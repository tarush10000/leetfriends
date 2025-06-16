"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Plus, Tag, Users, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminCouponManager() {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);

    const [newCoupon, setNewCoupon] = useState({
        code: '',
        name: '',
        description: '',
        type: 'free_tier',
        value: 100,
        tier: 'silver',
        maxUses: 10,
        validFrom: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        applicableTiers: ['silver', 'gold'],
        applicableCycles: ['monthly', 'yearly']
    });

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            const response = await fetch('/api/admin/coupons');
            if (response.ok) {
                const data = await response.json();
                setCoupons(data.coupons);
            }
        } catch (error) {
            toast.error('Failed to fetch coupons');
        } finally {
            setLoading(false);
        }
    };

    const createCoupon = async () => {
        try {
            const response = await fetch('/api/admin/coupons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCoupon)
            });

            if (response.ok) {
                toast.success('Coupon created successfully!');
                setShowCreateForm(false);
                setNewCoupon({
                    code: '',
                    name: '',
                    description: '',
                    type: 'free_tier',
                    value: 100,
                    tier: 'silver',
                    maxUses: 10,
                    validFrom: new Date().toISOString().split('T')[0],
                    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    applicableTiers: ['silver', 'gold'],
                    applicableCycles: ['monthly', 'yearly']
                });
                fetchCoupons();
            } else {
                const error = await response.json();
                toast.error(error.error);
            }
        } catch (error) {
            toast.error('Failed to create coupon');
        }
    };

    const createFriendsCoupon = () => {
        const friendCode = `FRIENDS${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        setNewCoupon({
            ...newCoupon,
            code: friendCode,
            name: 'Friends & Family 100% Off',
            description: 'Special 100% discount for friends and family',
            type: 'free_tier',
            value: 100,
            maxUses: 1
        });
        setShowCreateForm(true);
    };

    if (loading) {
        return <div className="p-8">Loading coupons...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Coupon Management</h2>
                <div className="space-x-2">
                    <Button onClick={createFriendsCoupon} className="bg-green-600 hover:bg-green-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Quick: 100% Off for Friends
                    </Button>
                    <Button onClick={() => setShowCreateForm(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Coupon
                    </Button>
                </div>
            </div>

            {showCreateForm && (
                <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardHeader>
                        <CardTitle className="text-white">Create New Coupon</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                placeholder="Coupon Code (e.g., FRIENDS100)"
                                value={newCoupon.code}
                                onChange={(e) => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})}
                                className="bg-slate-700/50 border-slate-600 text-white"
                            />
                            <Input
                                placeholder="Coupon Name"
                                value={newCoupon.name}
                                onChange={(e) => setNewCoupon({...newCoupon, name: e.target.value})}
                                className="bg-slate-700/50 border-slate-600 text-white"
                            />
                        </div>
                        
                        <Input
                            placeholder="Description"
                            value={newCoupon.description}
                            onChange={(e) => setNewCoupon({...newCoupon, description: e.target.value})}
                            className="bg-slate-700/50 border-slate-600 text-white"
                        />

                        <div className="grid grid-cols-3 gap-4">
                            <Select value={newCoupon.type} onValueChange={(value: string) => setNewCoupon({...newCoupon, type: value})}>
                                <SelectTrigger className="bg-slate-700/50 border-slate-600">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="free_tier">100% Off (Free Tier)</SelectItem>
                                    <SelectItem value="percentage">Percentage Discount</SelectItem>
                                    <SelectItem value="fixed">Fixed Amount Off</SelectItem>
                                </SelectContent>
                            </Select>

                            <Input
                                placeholder="Max Uses"
                                type="number"
                                value={newCoupon.maxUses}
                                onChange={(e) => setNewCoupon({...newCoupon, maxUses: parseInt(e.target.value)})}
                                className="bg-slate-700/50 border-slate-600 text-white"
                            />

                            <Select value={newCoupon.tier} onValueChange={(value: string) => setNewCoupon({...newCoupon, tier: value})}>
                                <SelectTrigger className="bg-slate-700/50 border-slate-600">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="silver">Silver Tier</SelectItem>
                                    <SelectItem value="gold">Gold Tier</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                type="date"
                                value={newCoupon.validFrom}
                                onChange={(e) => setNewCoupon({...newCoupon, validFrom: e.target.value})}
                                className="bg-slate-700/50 border-slate-600 text-white"
                            />
                            <Input
                                type="date"
                                value={newCoupon.validUntil}
                                onChange={(e) => setNewCoupon({...newCoupon, validUntil: e.target.value})}
                                className="bg-slate-700/50 border-slate-600 text-white"
                            />
                        </div>

                        <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                                Cancel
                            </Button>
                            <Button onClick={createCoupon}>
                                Create Coupon
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {coupons.map((coupon: any) => (
                    <Card key={coupon._id} className="bg-slate-800/50 border-slate-700/50">
                        <CardContent className="p-4">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                                        {coupon.code}
                                    </Badge>
                                    {coupon.isActive ? (
                                        <CheckCircle className="w-5 h-5 text-green-400" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-red-400" />
                                    )}
                                </div>
                                
                                <div>
                                    <h3 className="font-semibold text-white">{coupon.name}</h3>
                                    <p className="text-sm text-slate-400">{coupon.description}</p>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-400">Discount:</span>
                                        <span className="text-green-400 font-semibold">
                                            {coupon.type === 'free_tier' ? '100% OFF' : `${coupon.value}%`}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-400">Usage:</span>
                                        <span className="text-white">
                                            {coupon.usedCount} / {coupon.maxUses === -1 ? '∞' : coupon.maxUses}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-400">Valid Until:</span>
                                        <span className="text-white">
                                            {new Date(coupon.validUntil).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}