<?php

namespace App\Models;

use App\Models\Concerns\BelongsToEmpresa;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PendenciaItem extends Model
{
    use BelongsToEmpresa, HasFactory;

    protected $fillable = [
        'empresa_id',
        'pendencia_id',
        'doc_tipo',
        'obrigatorio',
    ];

    protected function casts(): array
    {
        return [
            'obrigatorio' => 'boolean',
        ];
    }

    public function pendencia(): BelongsTo
    {
        return $this->belongsTo(Pendencia::class);
    }
}
