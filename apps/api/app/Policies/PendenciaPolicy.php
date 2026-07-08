<?php

namespace App\Policies;

use App\Models\Pendencia;
use App\Models\Proposta;
use App\Models\User;

class PendenciaPolicy extends BasePolicy
{
    public function create(User $user, Proposta $proposta): bool
    {
        if ($user->empresa_id !== $proposta->empresa_id) {
            return false;
        }

        if (!in_array($user->role, [User::ROLE_ANALISTA, User::ROLE_GESTAO], true)) {
            return false;
        }

        return !in_array($proposta->status, [
            Proposta::STATUS_RECUSADA,
            Proposta::STATUS_CANCELADA,
            Proposta::STATUS_INTEGRADA,
        ], true);
    }

    public function view(User $user, Pendencia $pendencia): bool
    {
        if (!$this->sameEmpresa($user, $pendencia)) {
            return false;
        }

        $proposta = $pendencia->proposta;

        return $user->id === $proposta->operador_id
            || in_array($user->role, [User::ROLE_ANALISTA, User::ROLE_GESTAO], true);
    }

    public function resolve(User $user, Pendencia $pendencia): bool
    {
        if (!$this->sameEmpresa($user, $pendencia)) {
            return false;
        }

        if ($pendencia->status !== Pendencia::STATUS_ABERTA) {
            return false;
        }

        return $user->role === User::ROLE_GESTAO
            || $user->id === $pendencia->proposta->operador_id;
    }

    public function reabrir(User $user, Pendencia $pendencia): bool
    {
        if (!$this->sameEmpresa($user, $pendencia)) {
            return false;
        }

        return $user->role === User::ROLE_GESTAO;
    }
}
