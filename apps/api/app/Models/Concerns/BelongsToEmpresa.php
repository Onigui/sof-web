<?php

namespace App\Models\Concerns;

use App\Models\Empresa;
use App\Models\Scopes\EmpresaScope;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait BelongsToEmpresa
{
    protected static function bootBelongsToEmpresa(): void
    {
        static::addGlobalScope(new EmpresaScope());
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }
}
