<?php

namespace App\Models;

use App\Models\Concerns\BelongsToEmpresa;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Integracao extends Model
{
    use BelongsToEmpresa, HasFactory;

    protected $fillable = [
        'empresa_id',
        'proposta_id',
        'data_averbacao',
        'contrato',
        'repasse',
        'tabela',
        'veiculo',
        'alienado',
        'regiao_override',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'data_averbacao' => 'date',
            'repasse' => 'decimal:2',
            'alienado' => 'boolean',
        ];
    }

    public function proposta(): BelongsTo
    {
        return $this->belongsTo(Proposta::class);
    }

    public function criadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}

