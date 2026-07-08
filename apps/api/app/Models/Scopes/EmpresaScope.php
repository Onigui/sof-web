<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class EmpresaScope implements Scope
{
    protected static ?int $empresaId = null;

    public function apply(Builder $builder, Model $model): void
    {
        $empresaId = static::$empresaId ?? auth()->user()?->empresa_id;

        if ($empresaId !== null) {
            $builder->where($model->getTable().'.empresa_id', $empresaId);
        }
    }

    public static function setEmpresaId(?int $empresaId): void
    {
        static::$empresaId = $empresaId;
    }

    public static function clear(): void
    {
        static::$empresaId = null;
    }
}
