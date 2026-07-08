<?php

namespace App\Models;

use App\Models\Concerns\BelongsToEmpresa;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Pendencia extends Model
{
    use BelongsToEmpresa, HasFactory;

    public const STATUS_ABERTA = 'ABERTA';
    public const STATUS_RESOLVIDA = 'RESOLVIDA';

    protected $fillable = [
        'empresa_id',
        'proposta_id',
        'categoria',
        'comentario',
        'status',
        'criada_por',
        'criada_em',
        'resolvida_por',
        'resolvida_em',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'criada_em' => 'datetime',
            'resolvida_em' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function proposta(): BelongsTo
    {
        return $this->belongsTo(Proposta::class);
    }

    public function itens(): HasMany
    {
        return $this->hasMany(PendenciaItem::class);
    }
}
