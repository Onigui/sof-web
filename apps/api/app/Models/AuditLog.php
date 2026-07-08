<?php

namespace App\Models;

use App\Models\Concerns\BelongsToEmpresa;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    use BelongsToEmpresa, HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'empresa_id',
        'actor_user_id',
        'actor_role',
        'action',
        'entity_type',
        'entity_id',
        'metadata',
        'ip',
        'user_agent',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'created_at' => 'datetime',
        ];
    }
}
