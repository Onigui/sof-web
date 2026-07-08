<?php

namespace App\Models;

use App\Models\Concerns\BelongsToEmpresa;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BillingEvent extends Model
{
    use BelongsToEmpresa, HasFactory;

    public const TIPO_INTEGRADA = 'INTEGRADA';

    protected $fillable = [
        'empresa_id',
        'tipo_evento',
        'proposta_id',
        'integracao_id',
        'valor_centavos',
        'gerado_em',
    ];

    protected function casts(): array
    {
        return [
            'valor_centavos' => 'integer',
            'gerado_em' => 'datetime',
        ];
    }

    public function proposta(): BelongsTo
    {
        return $this->belongsTo(Proposta::class);
    }

    public function integracao(): BelongsTo
    {
        return $this->belongsTo(Integracao::class);
    }
}
