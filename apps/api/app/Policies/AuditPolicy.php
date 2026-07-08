<?php

namespace App\Policies;

use App\Models\AuditLog;
use App\Models\User;

class AuditPolicy extends BasePolicy
{
    public function list(User $user): bool
    {
        return in_array($user->role, [User::ROLE_GESTAO, User::ROLE_ANALISTA], true);
    }

    public function export(User $user): bool
    {
        return $user->role === User::ROLE_GESTAO;
    }

    public function viewProposta(User $user, int $empresaId, int $operadorId): bool
    {
        if ($user->empresa_id !== $empresaId) {
            return false;
        }

        return $user->role === User::ROLE_GESTAO
            || $user->role === User::ROLE_ANALISTA
            || $user->id === $operadorId;
    }
}
