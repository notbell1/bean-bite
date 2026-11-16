<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    protected $fillable = [
        'order_id',
        'user_id',
        'payment_method',
        'amount_paid',
        'change_amount',
        'reference_number',
        'payment_time',
    ];

    protected function casts(): array
    {
        return [
            'amount_paid' => 'decimal:2',
            'change_amount' => 'decimal:2',
            'payment_time' => 'datetime',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
