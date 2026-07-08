<?php

namespace App\Models;

use App\Models\Concerns\BelongsToEmpresa;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DetranQuery extends Model
{
    use BelongsToEmpresa, HasFactory;

    public const STATUS_PENDENTE = 'PENDENTE';
    public const STATUS_EM_PROCESSO = 'EM_PROCESSO';
    public const STATUS_CONCLUIDA = 'CONCLUIDA';
    public const STATUS_FALHOU = 'FALHOU';
    public const STATUS_MANUAL = 'MANUAL';

    protected $fillable = [
        'empresa_id',
        'proposta_id',
        'placa',
        'renavam',
        'status',
        'requested_by',
        'requested_at',
        'processed_at',
        'result_json',
        'result_text',
        'error',
        'source',
        'cache_key',
        'cache_expires_at',
    ];

    protected function casts(): array
    {
        return [
            'requested_at' => 'datetime',
            'processed_at' => 'datetime',
            'cache_expires_at' => 'datetime',
            'result_json' => 'array',
        ];
    }

    public function proposta(): BelongsTo
    {
        return $this->belongsTo(Proposta::class);
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }
}
