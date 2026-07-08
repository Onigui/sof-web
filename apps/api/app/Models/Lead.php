<?php

namespace App\Models;

use App\Models\Concerns\BelongsToEmpresa;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Lead extends Model
{
    use BelongsToEmpresa, HasFactory;

    public const STATUS_NOVO = 'NOVO';
    public const STATUS_EM_ANALISE = 'EM_ANALISE';
    public const STATUS_APROVADO = 'APROVADO';
    public const STATUS_RECUSADO = 'RECUSADO';
    public const STATUS_CONVERTIDO = 'CONVERTIDO';

    protected $fillable = [
        'empresa_id',
        'loja_id',
        'status',
        'cliente_nome',
        'cliente_cpf',
        'cliente_celular',
        'placa',
        'renavam',
        'descricao',
        'valor_veiculo',
        'entrada',
        'valor_solicitado',
        'banco_id',
        'produto_id',
        'observacoes',
        'convertido_proposta_id',
    ];

    protected function casts(): array
    {
        return [
            'valor_veiculo' => 'decimal:2',
            'entrada' => 'decimal:2',
            'valor_solicitado' => 'decimal:2',
        ];
    }

    public function loja(): BelongsTo
    {
        return $this->belongsTo(Loja::class);
    }

    public function banco(): BelongsTo
    {
        return $this->belongsTo(Banco::class);
    }

    public function produto(): BelongsTo
    {
        return $this->belongsTo(Produto::class);
    }

    public function proposta(): BelongsTo
    {
        return $this->belongsTo(Proposta::class, 'convertido_proposta_id');
    }
}
