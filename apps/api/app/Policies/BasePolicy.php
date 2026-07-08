<?php

namespace App\Policies;

use App\Models\User;

class BasePolicy
{
    protected function sameEmpresa(User $user, object $model): bool
    {
        if (!property_exists($model, 'empresa_id')) {
            return false;
        }

        return $user->empresa_id === $model->empresa_id;
    }
}
