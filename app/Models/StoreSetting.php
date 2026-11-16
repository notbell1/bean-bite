<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StoreSetting extends Model
{
    protected $fillable = [
        'store_name',
        'tagline',
        'address',
        'phone',
        'email',
        'logo',
        'tax_percentage',
        'service_charge_percentage',
        'receipt_footer',
        'is_open',
    ];

    protected function casts(): array
    {
        return [
            'tax_percentage' => 'decimal:2',
            'service_charge_percentage' => 'decimal:2',
            'is_open' => 'boolean',
        ];
    }
}
