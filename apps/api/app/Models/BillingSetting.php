<?php

namespace App\Models;

use App\Models\Concerns\BelongsToEmpresa;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BillingSetting extends Model
{
    use BelongsToEmpresa, HasFactory;

    protected $fillable = [
        'empresa_id',
        'monthly_fee_centavos',
        'per_integrada_centavos',
        'currency',
        'active',
    ];

    protected function casts(): array
    {
        return [
            'monthly_fee_centavos' => 'integer',
            'per_integrada_centavos' => 'integer',
            'active' => 'boolean',
        ];
    }
}
