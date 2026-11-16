<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Order extends Model
{
    protected $fillable = [
        'order_number',
        'user_id',
        'cash_shift_id',
        'customer_name',
        'table_number',
        'order_type',
        'is_open_bill',
        'subtotal',
        'tax_amount',
        'service_charge',
        'discount_amount',
        'promo_id',
        'total_price',
        'total_cost',
        'order_status',
        'payment_status',
        'notes',
        'cancel_reason',
        'cancelled_by',
        'ready_at',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'is_open_bill' => 'boolean',
            'subtotal' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'service_charge' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'total_price' => 'decimal:2',
            'total_cost' => 'decimal:2',
            'ready_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function cancelledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }

    public function cashShift(): BelongsTo
    {
        return $this->belongsTo(CashShift::class);
    }

    public function promo(): BelongsTo
    {
        return $this->belongsTo(Promo::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class);
    }
}
