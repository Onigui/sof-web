<?php

namespace App\Models;

use App\Models\Concerns\BelongsToEmpresa;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Proposta extends Model
{
    use BelongsToEmpresa, HasFactory;

    public const STATUS_RASCUNHO = 'RASCUNHO';
    public const STATUS_ANALISE_PROMOTORA = 'ANALISE_PROMOTORA';
    public const STATUS_ANALISE_BANCO = 'ANALISE_BANCO';
    public const STATUS_APROVADA = 'APROVADA';
    public const STATUS_RECUSADA = 'RECUSADA';
    public const STATUS_FORMALIZACAO = 'FORMALIZACAO';
    public const STATUS_ANALISE_PAGAMENTO = 'ANALISE_PAGAMENTO';
    public const STATUS_INTEGRADA = 'INTEGRADA';
    public const STATUS_CANCELADA = 'CANCELADA';

    public const PRIORIDADE_NORMAL = 'NORMAL';
    public const PRIORIDADE_ALTA = 'ALTA';

    protected $fillable = [
        'empresa_id',
        'operador_id',
        'analista_id',
        'loja_id',
        'regiao_raw',
        'regiao_id',
        'banco_id',
        'produto_id',
        'status',
        'prioridade',
        'pv',
        'cliente_nome',
        'cliente_cpf',
        'cliente_celular',
        'cliente_email',
        'veiculo_placa',
        'veiculo_renavam',
        'veiculo_descricao',
        'valor_veiculo',
        'valor_financiado',
        'enviada_em',
        'aprovada_em',
        'integrada_em',
    ];

    protected function casts(): array
    {
        return [
            'enviada_em' => 'datetime',
            'aprovada_em' => 'datetime',
            'integrada_em' => 'datetime',
            'valor_veiculo' => 'decimal:2',
            'valor_financiado' => 'decimal:2',
        ];
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    public function operador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'operador_id');
    }

    public function analista(): BelongsTo
    {
        return $this->belongsTo(User::class, 'analista_id');
    }

    public function loja(): BelongsTo
    {
        return $this->belongsTo(Loja::class);
    }

    public function regiao(): BelongsTo
    {
        return $this->belongsTo(Regiao::class);
    }

    public function banco(): BelongsTo
    {
        return $this->belongsTo(Banco::class);
    }

    public function produto(): BelongsTo
    {
        return $this->belongsTo(Produto::class);
    }

    public function pendencias(): HasMany
    {
        return $this->hasMany(Pendencia::class);
    }

    public function documentos(): HasMany
    {
        return $this->hasMany(Documento::class);
    }

    public function integracao(): HasOne
    {
        return $this->hasOne(Integracao::class);
    }
}
