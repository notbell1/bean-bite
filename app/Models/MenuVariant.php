<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MenuVariant extends Model
{
    protected $fillable = [
        'menu_id',
        'name',
        'variant_type',
        'price_adjustment',
        'cost_adjustment',
        'is_available',
    ];

    protected function casts(): array
    {
        return [
            'price_adjustment' => 'decimal:2',
            'cost_adjustment' => 'decimal:2',
            'is_available' => 'boolean',
        ];
    }

    public function menu(): BelongsTo
    {
        return $this->belongsTo(Menu::class);
    }
}
