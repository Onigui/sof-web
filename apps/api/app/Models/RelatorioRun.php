<?php

namespace App\Models;

use App\Models\Concerns\BelongsToEmpresa;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RelatorioRun extends Model
{
    use BelongsToEmpresa, HasFactory;

    public const TIPO_APROVADAS = 'APROVADAS';
    public const TIPO_INTEGRADAS = 'INTEGRADAS';

    public const STATUS_GERADO = 'GERADO';
    public const STATUS_FALHOU = 'FALHOU';

    protected $fillable = [
        'empresa_id',
        'data_ref',
        'tipo',
        'formato',
        'arquivo_path',
        'status',
        'erro',
        'gerado_em',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'data_ref' => 'date',
            'gerado_em' => 'datetime',
        ];
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    public function criadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
