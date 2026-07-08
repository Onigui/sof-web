<?php

namespace App\Models;

use App\Models\Concerns\BelongsToEmpresa;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmpresaSubscription extends Model
{
    use BelongsToEmpresa, HasFactory;

    public const STATUS_TRIAL = 'TRIAL';
    public const STATUS_ATIVA = 'ATIVA';
    public const STATUS_SUSPENSA = 'SUSPENSA';

    protected $fillable = [
        'empresa_id',
        'status',
        'trial_ends_at',
        'active_since',
        'suspended_at',
        'grace_days',
    ];

    protected function casts(): array
    {
        return [
            'trial_ends_at' => 'datetime',
            'active_since' => 'datetime',
            'suspended_at' => 'datetime',
            'grace_days' => 'integer',
        ];
    }
}
