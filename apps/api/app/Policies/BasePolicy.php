<?php

namespace App\Policies;

use App\Models\User;

class BasePolicy
{
    protected function sameEmpresa(User $user, object $model): bool
    {
        $empresaId = data_get($model, 'empresa_id');

        if ($empresaId === null) {
            return false;
        }

        return (int) $user->empresa_id === (int) $empresaId;
    }

    protected function sameUserId(User $user, int|string|null $userId): bool
    {
        if ($userId === null) {
            return false;
        }

        return (int) $user->id === (int) $userId;
    }
}
