<?php

namespace App\Policies;

use App\Models\Proposta;
use App\Models\User;

class DetranQueryPolicy extends BasePolicy
{
    public function request(User $user, ?Proposta $proposta = null): bool
    {
        if (in_array($user->role, [User::ROLE_ANALISTA, User::ROLE_GESTAO], true)) {
            return true;
        }

        if ($user->role !== User::ROLE_OPERADOR || !$proposta) {
            return false;
        }

        return $user->id === $proposta->operador_id && $user->empresa_id === $proposta->empresa_id;
    }

    public function list(User $user, ?Proposta $proposta = null): bool
    {
        return $this->request($user, $proposta);
    }

    public function completeManual(User $user): bool
    {
        return in_array($user->role, [User::ROLE_ANALISTA, User::ROLE_GESTAO], true);
    }
}
