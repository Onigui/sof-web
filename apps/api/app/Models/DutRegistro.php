<?php

namespace App\Models;

use App\Models\Concerns\BelongsToEmpresa;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DutRegistro extends Model
{
    use BelongsToEmpresa, HasFactory;

    public const STATUS_PENDENTE = 'PENDENTE';
    public const STATUS_COMPROVANTE = 'COMPROVANTE';
    public const STATUS_OK = 'OK';

    protected $fillable = [
        'empresa_id',
        'proposta_id',
        'status',
        'prazo_data',
        'comprovante_path',
        'concluido_em',
    ];

    protected function casts(): array
    {
        return [
            'prazo_data' => 'date',
            'concluido_em' => 'datetime',
        ];
    }

    public function proposta(): BelongsTo
    {
        return $this->belongsTo(Proposta::class);
    }
}
