<?php

namespace App\Models;

use App\Models\Concerns\BelongsToEmpresa;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Documento extends Model
{
    use BelongsToEmpresa, HasFactory;

    public const STATUS_ENVIADO = 'ENVIADO';
    public const STATUS_VALIDO = 'VALIDO';
    public const STATUS_INVALIDO = 'INVALIDO';
    public const STATUS_SUBSTITUIDO = 'SUBSTITUIDO';

    protected $fillable = [
        'empresa_id',
        'proposta_id',
        'tipo',
        'arquivo_path',
        'mime_type',
        'tamanho_bytes',
        'enviado_por',
        'enviado_em',
        'status',
        'motivo_invalidez',
        'substitui_documento_id',
        'validado_por',
        'validado_em',
    ];

    protected function casts(): array
    {
        return [
            'enviado_em' => 'datetime',
            'validado_em' => 'datetime',
        ];
    }

    public function proposta(): BelongsTo
    {
        return $this->belongsTo(Proposta::class);
    }

    public function enviadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'enviado_por');
    }

    public function validadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'validado_por');
    }

    public function substituiDocumento(): BelongsTo
    {
        return $this->belongsTo(self::class, 'substitui_documento_id');
    }
}
